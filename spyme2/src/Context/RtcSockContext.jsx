import React, { useState, useEffect, createContext, useMemo, useRef, useCallback } from "react";
import WebRTCManager from "../helper/WebRTCManager";
import { createSignalingSocket, updateUser } from "../helper/apiClient";
import { SignalingSocket } from "../helper/WSConnect";
import { showToast } from "../helper/Toasts";

export const UserContext = createContext({})

//-------------------Main HOC start-------------------
export const RtcSockContext = (Coponent) => {
  const WS_URL = import.meta.env.VITE_WS_URL;

  if (!WS_URL) {
    showToast.error("Error websock url missing!!")
    return
  }

  const Wrapper = (time_interv = 1000, props) => {
    //-------------------INitial state start-------------------


    let [users, SetUsers] = useState({})
    let peerRef = useRef({})
    let sockRef = useRef({})
    console.log("context start")
    //-------------------INitial state end-------------------

    //-------------------Context business logic stat-------------------
    /**
     * Adds a new user to the WebRTC + WebSocket context.
     *
     * This function initializes a new `WebRTCManager` instance and a signaling
     * WebSocket connection for a given user ID. It updates internal React refs
     * (`peerRef`, `sockRef`) and the `users` state with the created instances.
     * 
     * If the user or corresponding connections already exist, the function
     * does nothing to avoid duplication.
     *
     * @async
     * @function addUser
     * @param {string|number} id - Unique user identifier.
     * @param {Object} [conf={}] - Configuration object passed to the `WebRTCManager` constructor.
     * @param {string} [urole="master"] - User role (e.g., `"master"` or `"slave"`).
     *
     * @returns {Promise<void>} Resolves when the user has been initialized.
     *
     * @throws {Error} Propagates errors that occur during WebRTC or WebSocket initialization.
     *
     * @example
     * await addUser("user123", { iceServers: [...] }, "slave");
     *
     * // Result:
     * // - Creates a new WebRTCManager for user123
     * // - Opens a signaling WebSocket
     * // - Adds both to the React context state
     */

    let connect_ws=(id)=>{
      // if(!users[id] || !sockRef?.current[id]?.sock) return
      try{
      sockRef?.current[id]?.sock.connect(WS_URL)
      updateBothRTCSock(id)
      // showToast.success("Ws connection establish")
      }catch(err){
        showToast.error(`Fail to establish connection to ws:\n\n${err}`)
        console.error("error connect to websock due to ",err)
      }
       
    }

    let updateRtcStatus = (id) => {
      const rtcEntry = peerRef.current[id]?.rtc;

      if (!rtcEntry) return; // nothing to do if rtc not present

      const status = rtcEntry.getStatus(); // assume this returns a string or object

      SetUsers(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          rtc_status: status
        }
      }));
    };

    let updateSockStatus = (id) => {
      const socEntry = sockRef.current[id]?.sock;
      const cs = socEntry?.getStatus?.() ?? "closed"; // fallback if undefined

      SetUsers(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          sock_status: cs
        }
      }));
    };

    let updateBothRTCSock = (id) => {
      updateRtcStatus(id)
      updateSockStatus(id)
    }

    let addUser = async (id, conf = {}, urole = "master",crt_peer=true,create_sock=false) => {
      if (!users[id]) {

        if (!peerRef.current[id] && crt_peer) {
          let webRtc = new WebRTCManager(conf)
          if (typeof webRtc.createPeer === "function" && !webRtc.peer) {
            
            webRtc.createPeer(true);
          }else{
            console.warn("peer for user ",id," Already made")
          }
          peerRef.current = {
            ...peerRef.current, [id]: { ...peerRef.current[id], rtc: webRtc, peer: webRtc?.peer }
          }
          
          console.log("added new webrtc for user", "all webrtc::: ", peerRef.current)
        }
        if (!sockRef.current[id] && create_sock) {
          let wsc = new SignalingSocket(id,{},urole)
          
          sockRef.current = {
            ...sockRef.current, [id]: {
              ...sockRef.current[id], sock: wsc

            }
          }
          
        }else{
              console.warn("Websock   for user ",id," Already made")
        }
        SetUsers(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            webrtc: peerRef.current[id],
            sock_ref: sockRef.current[id]
          }
        }));  
        setTimeout(()=>connect_ws(id),500)
      } 

    }



    let removeRTCandSockAll = async (id) => {
      const rtcEntry = peerRef.current[id];
      const sockEntry = sockRef.current[id];

      try {
        // --- 1️⃣ Clean up WebRTC ---
        if (rtcEntry?.rtc) {
          const rtc = rtcEntry.rtc;
          rtc.clean?.();
          rtc.close?.();
          rtc.destroy?.();
          console.log(`✅ WebRTC cleaned for user ${id}`);
        } else {
          console.warn(`⚠️ No WebRTC found for user ${id}`);
        }

        // --- 2️⃣ Close WebSocket connection ---
        if (sockEntry?.sock) {
          const sock = sockEntry.sock;
          sock.close?.(1000, "peer destroyed");
          console.log(`✅ WebSocket closed for user ${id}`);
        } else {
          console.warn(`⚠️ No socket found for user ${id}`);
        }

        // --- 3️⃣ Remove from refs ---
        if (peerRef.current[id]) delete peerRef.current[id];
        if (sockRef.current[id]) delete sockRef.current[id];

        // --- 4️⃣ Update React state ---
        SetUsers((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });

      } catch (err) {
        console.error(`⚠️ Error destroying WebRTC or WS for ${id}:`, err);
      } finally {
         updateBothRTCSock(id)
      }
    };

    let RemoveSock = async (id) => {
      if (!id) {
        console.warn("⚠️ RemoveSock called without user ID");
        return;
      }

      const user = users[id];
      if (!user) {
        console.warn(`⚠️ No user with id ${id} found in context`);
        return;
      }

      const sock = sockRef.current[id];
      if (!sock) {
        console.warn(`⚠️ No active socket found for user ${id}`);
        return;
      }

      try {
        // ✅ Gracefully close WebSocket connection
        sock.sock.close(1000, "Socket removed by client"); // 1000 = normal closure
        delete sockRef.current[id];


        console.log(`🗑️ WebSocket removed for user ${id}`);
        showToast.success(`User ${id}'s socket connection removed`);
      } catch (err) {
        console.error(`❌ Error removing socket for user ${id}:`, err);
        showToast.error(`Failed to remove user ${id}'s socket`);
      } finally {
         updateBothRTCSock(id)
      }
    };



    let removeWebRTC = async (id) => {
      const rtcEntry = peerRef.current[id];

      if (rtcEntry?.rtc) {
        const rtc = rtcEntry.rtc;

        // Clean media, close peer connection, and destroy instance
        rtc.clean?.();
        rtc.close?.();
        rtc.destroy?.();

        // Remove from ref
        delete peerRef.current[id];

        // Update React state
        SetUsers((prev) => {
          const updated = { ...prev };
          if (updated[id]?.webrtc) delete updated[id]?.webrtc;
          return updated;
        });
        updateBothRTCSock(id)
        console.log(`✅ WebRTC destroyed for user ${id}`);
      } else {
        console.warn(`⚠️ No WebRTC found for user ${id}`);
      }
    };

    let removeUser = async (id) => {
  if (!id) return console.warn("⚠️ removeUser called without user ID");

  try {
    // ♻️ Reuse your existing cleanup function
    await removeRTCandSockAll(id);

    // Optional: show toast or log
    showToast.success(`🗑️ User ${id} removed successfully form context`);
  } catch (err) {
    console.error(`❌ Error removing user ${id}:`, err);
    showToast.error(`Failed to remove user ${id}`);
  }
};


    //-----------Auto poll start-----------
    // useEffect(() => {
    //   // Interval to check status every X ms
    //   const interval = setInterval(() => {
    //     Object.keys(peerRef.current).forEach((id) => {
    //       // Update RTC status
    //       const rtc = peerRef.current[id]?.rtc;
    //       if (rtc) {
    //         const rtcStatus = rtc.getStatus();
    //         SetUsers(prev => ({
    //           ...prev,
    //           [id]: {
    //             ...prev[id],
    //             rtc_status: rtcStatus
    //           }
    //         }));
    //       }

    //       // Update Socket status
    //       const sock = sockRef.current[id]?.sock;
    //       if (sock) {
    //         const sockStatus = sock.getStatus();
    //         SetUsers(prev => ({
    //           ...prev,
    //           [id]: {
    //             ...prev[id],
    //             sock_status: sockStatus
    //           }
    //         }));
    //       }
    //     });
    //   }, time_interv ? time_interv : 5000); // update every 1 second

    //   return () => clearInterval(interval); // cleanup on unmount
    // }, [time_interv]); // dependency can be just the users object or [] if refs never change

    //-----------Auto poll end-----------

    let clearAllConnections = async () => {
      try {
        const ids = Object.keys(users);
        for (const id of ids) {
          await removeRTCandSockAll(id);
        }

        // Clear everything
        peerRef.current = {};
        sockRef.current = {};
        SetUsers({});

        console.log("🧹 All RTC and WebSocket connections removed successfully.");
        // showToast.success("All connections cleared");
      } catch (err) {
        console.error("❌ Error clearing all connections:", err);
        showToast.error("Failed to clear all connections");
      }
    };


    let addRtcToUser=(id,config={},replaceExisting=false)=>{
      if(!users[id]) return; 
      if(!peerRef.current[id]?.rtc){
        let webRtc = new WebRTCManager(config?config:null)
       
         peerRef.current = {
            ...peerRef.current, [id]: { ...peerRef.current[id], rtc: webRtc, peer: webRtc?.peer }
          }
             SetUsers(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            
            webrtc: peerRef.current[id],
            
          }
        }));  
        updateRtcStatus(id)
          
      }
    }


    const addUsersCb = useCallback(addUser, []);
    const RemoveSockCb = useCallback(RemoveSock, [users]);
    const removeAllRTCSocCB = useCallback(removeRTCandSockAll, []);
    const removeWebRTCB = useCallback(removeWebRTC, [peerRef.current])
   

    const vals = useMemo(() => ({
      removeUSer:removeUser,
      addUsers: addUsersCb,
      removeAllRTCSoc: removeAllRTCSocCB,
      RemoveSoc: RemoveSockCb,
      removeWebRTC: removeWebRTCB,
      rtcStatusUpdate: updateRtcStatus,
      socUpdateStatus: updateSockStatus,
      User: users,
      setUsers: SetUsers,
      peerRef: peerRef.current,
      sockRef: sockRef.current,
      clearAllConnection: clearAllConnections,
      updateRtcSockBoth: updateBothRTCSock,
      connectWs:connect_ws
    }), [
      addUsersCb,
      removeAllRTCSocCB,
      RemoveSockCb,
      removeWebRTCB,
      updateRtcStatus,
      updateSockStatus
    ]);
    
    //-------------------Context business logic end-------------------

    //-------------------Return main wrapped componetn with context start -------------------
    return (
      <UserContext.Provider value={vals}>
        <Coponent {...props} />
      </UserContext.Provider>

    )
    //-------------------Return main wrapped componetn with context end -------------------
  }
  return Wrapper
}
//-------------------Main HOC end-------------------