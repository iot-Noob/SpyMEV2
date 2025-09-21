from fastapi import FastAPI,Request,Response,HTTPException,routing
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routes.mainRoute import route
@asynccontextmanager
async def cm(app:FastAPI):
    print("Main app start api")
    yield
    print("Main app end api")

app=FastAPI(title="Talha api SErver tester",description="API Tester debuger server talha local ",version="0.0.0.1",lifespan=cm)



# Allow all origins, methods, headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or list of allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CustomMiddleware:
    def __init__(self, app: FastAPI):
        self.app = app

    async def __call__(self, request: Request, call_next):
 
        # Continue to next middleware / route
        response: Response = await call_next(request)
 
        return response

app.middleware("http")(CustomMiddleware(app))
app.include_router(router=route) 
 