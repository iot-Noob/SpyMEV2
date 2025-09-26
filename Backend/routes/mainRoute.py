from fastapi import APIRouter,Request,Response,BackgroundTasks,WebSocket,WebSocketDisconnect,WebSocketException,Query,Form,HTTPException,Depends
from fastapi.responses import JSONResponse,Response
from contextlib import asynccontextmanager
import os
import json
from datetime import datetime
from dotenv import load_dotenv
from uuid import uuid4
from models.validate_ep import Registry,Update_RTC
from typing import Optional
from Database.Tables import SessionLocal,User,init_table,RtcSession
from sqlalchemy.orm import Session
from pydantic import ValidationError
from asyncio import Lock
import asyncio
load_dotenv()

cfpth=""

 
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



@asynccontextmanager
async def cml(app: APIRouter):
    init_table()
    # Check config_path before yielding
    cfpth = os.getenv("config_path")
    
    if not cfpth:
        # Raise exception — app will not start
        raise RuntimeError("'config_path' not exist in env")

    # Store config_path in app.state for endpoints
    app.state.config_path = cfpth

    print("Route start")
    try:
        yield  # Must always yield once
    finally:
        print("Route End")
        
class CustomMiddleware:
    def __init__(self, app: APIRouter):
        self.app = app

    async def __call__(self, request: Request, call_next):
 
        # Continue to next middleware / route
        response: Response = await call_next(request)
 
        return response
route=APIRouter(lifespan=cml)

user_data={}

@route.post("/register_user",tags=["Register User server"])
async def register_user(register:Registry,db:Session=Depends(get_db)):
    try:
        existing_user = db.query(User).filter(User.username == register.username).first()
        if existing_user:
            raise HTTPException(409,"User already exist")
        user=User(username=register.username)
        db.add(user)
        db.commit()
         
    except Exception as e:
        db.rollback()
        raise HTTPException(500,f"Error occur register user due to {e}")
    return {"sucess":"User registered sucessfully","id":user.id}
  
@route.patch("/update_user", tags=["Register User server"])
async def update_sdp(id: int, uname:str=Form(...),db:Session=Depends(get_db)):
    try:
        if id not in user_data:
            raise HTTPException(status_code=404, detail="User not found")
        eu=db.query(User).filter(User.id==id).first()
        print(eu)
        return {"success": True, "updated_data": user_data[id]}
    except HTTPException:
        # Let explicit HTTPExceptions bubble up untouched
        raise
    except Exception as e:
        # Catch unexpected errors
        raise HTTPException(status_code=500, detail=f"Error occurred during update: {e}")

@route.delete("/delete_data", tags=["Register User server"])
async def delete_data(id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User does not exist")

        db.delete(user)
        db.commit()
        return {"message": f"User with id {id} deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete due to: {e}")


@route.get("/get_users", tags=["get server data"])
async def get_data(
    db: Session = Depends(get_db),
    id: Optional[str] = Query(None, description="User id for specific user")
):
    try:
        du = {}

        if not id:
            # All users
            all_users = db.query(User).all()
            for u in all_users:
                du[u.id] = {
                    "username": u.username,
                    "created_at": u.created_at,
                    "updated_at": getattr(u, "updated_at", None),  # if exists in User
                }
                if u.rtc_sessions:  # only include sessions if they exist
                    du[u.id]["sessions"] = [
                        {
                            "id": s.id,
                            "created_at": s.created_at,
                            "updated_at": s.updated_at,
                        }
                        for s in u.rtc_sessions
                    ]

            return du

        # Specific user
        user = db.query(User).filter(User.id == id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_info = {
            "username": user.username,
            "created_at": user.created_at,
            "updated_at": getattr(user, "updated_at", None),
        }
        if user.rtc_sessions:
            user_info["sessions"] = [
                {
                    "id": s.id,
                    "created_at": s.created_at,
                    "updated_at": s.updated_at,
                }
                for s in user.rtc_sessions
            ]

        return {user.id: user_info}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error occurred getting client: {e}")
 

async def safe_send(socket: WebSocket, data):
    try:
        await socket.send_json(data)
    except (WebSocketDisconnect, RuntimeError):
        # Socket is already closed, ignore
        pass


wsc = {}
 

@route.websocket("/signaling")
async def signaling(socket: WebSocket, id: int = Query(...), role: str = Query(...)):
    db: Session = SessionLocal()
    conn = None
    try:
        await socket.accept()

        # --- Check user exists ---
        user = db.query(User).filter(User.id == id).one_or_none()
        if not user:
            await socket.send_json({"error": "User not found"})
            await socket.close()
            return

        if role not in ["master", "slave"]:
            await socket.send_json({"error": "Role must be 'master' or 'slave'"})
            await socket.close()
            return

        # --- Initialize list ---
        if id not in wsc:
            wsc[id] = []

        # --- Enforce only one master + one slave per id ---
        if any(c["type"] == role for c in wsc[id]):
            await socket.send_json({"error": f"{role} already exists for user {id}"})
            await socket.close()
            return

        # --- Register ---
        conn = {"socket": socket, "type": role}
        wsc[id].append(conn)
        async def safe_send(target_conn, message):
            try:
                await target_conn["socket"].send_json(message)
            except WebSocketDisconnect:
                if id in wsc and target_conn in wsc[id]:
                    wsc[id].remove(target_conn)

        # --- Loop ---
        while True:
            try:
                data = await socket.receive_json()
            except WebSocketDisconnect:
                break

            action = data.get("action")
            raw_payload = data.get("payload")

            if not action or raw_payload is None:
                await socket.send_json({"error": "action and payload are required"})
                continue

            # Validate with Pydantic
            try:
                dta = Update_RTC(**raw_payload)
                payload = dta.model_dump(exclude_unset=True)
            except ValidationError as ve:
                await socket.send_json({"error": "Invalid payload", "details": ve.errors()})
                continue
            match action:
                case "send_data":
                    target_type = "slave" if role == "master" else "master"
                    for target_conn in wsc.get(id, []):
                        if target_conn["type"] == target_type:
                            await safe_send(target_conn, {
                                "from": id,
                                "type": role,
                                "payload": payload
                            })
                case "send_data_raw":
                    target_type = "slave" if role == "master" else "master"
                    for target_conn in wsc.get(id, []):
                        if target_conn["type"] == target_type:
                            await safe_send(target_conn, {
                                "from": id,
                                "type": role,
                                "payload": raw_payload  # send exactly what was received
                            })

                case "rec_data":
                    if role != "slave":
                        await socket.send_json({"error": "Only slave can send rec_data"})
                        continue
                    master_conn = next((c for c in wsc.get(id, []) if c["type"] == "master"), None)
                    if master_conn:
                        await safe_send(master_conn, {
                            "from": id,
                            "type": "slave",
                            "payload": payload
                        })
                    else:
                        await socket.send_json({"error": "No master connected"})

                case "get_socks":
                    await socket.send_json({
                        "sockets": {
                            uid: [c["type"] for c in conns]
                            for uid, conns in wsc.items()
                        }
                    })

                case _:
                    await socket.send_json({"error": "Invalid action"})

    finally:
        db.close()
        if conn and id in wsc:
            if conn in wsc[id]:
                wsc[id].remove(conn)
            if not wsc[id]:
                del wsc[id]
