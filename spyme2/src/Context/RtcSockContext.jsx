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

  const Wrapper = (props,time_interv=1000) => {
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

    let addUser = async (id, conf = {}, urole = "master") => {
      if (!users[id]) {

        if (!peerRef.current[id]) {
          let webRtc = new WebRTCManager(conf)

          peerRef.current = {
            ...peerRef.current, [id]: { ...peerRef.current[id], rtc: webRtc, peer: webRtc?.peer }
          }
          console.log("added new webrtc for user", "all webrtc::: ", peerRef.current)
        }
        if (!sockRef.current[id]) {
          let wsc = new createSignalingSocket(id, null, urole)
          sockRef.current = {
            ...sockRef.current, [id]: {
              ...sockRef.current[id], sock: wsc

            }
          }
        }
        SetUsers(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            webrtc: peerRef.current[id],
            sock_ref: sockRef.current[id]
          }
        }));

      }

    }



    let destroyRtcSock = async (id) => {
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
      }
    };

    let RemoveSock = async (id) => {
      if (users[id]) {
        await destroyRtcSock(id);
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

        console.log(`✅ WebRTC destroyed for user ${id}`);
      } else {
        console.warn(`⚠️ No WebRTC found for user ${id}`);
      }
    };

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

    //-----------Auto poll start-----------
      useEffect(() => {
        // Interval to check status every X ms
        const interval = setInterval(() => {
          Object.keys(peerRef.current).forEach((id) => {
            // Update RTC status
            const rtc = peerRef.current[id]?.rtc;
            if (rtc) {
              const rtcStatus = rtc.getStatus();
              SetUsers(prev => ({
                ...prev,
                [id]: {
                  ...prev[id],
                  rtc_status: rtcStatus
                }
              }));
            }

            // Update Socket status
            const sock = sockRef.current[id]?.sock;
            if (sock) {
              const sockStatus = sock.getStatus();
              SetUsers(prev => ({
                ...prev,
                [id]: {
                  ...prev[id],
                  sock_status: sockStatus
                }
              }));
            }
          });
        }, time_interv?time_interv:1000); // update every 1 second

        return () => clearInterval(interval); // cleanup on unmount
      }, [users]); // dependency can be just the users object or [] if refs never change

    //-----------Auto poll end-----------
const addUsersCb = useCallback(addUser, [users, peerRef.current, sockRef.current]);
const RemoveSockCb = useCallback(RemoveSock, [users, peerRef.current, sockRef.current, destroyRtcSock]);
const destroyRtcSockCb = useCallback(destroyRtcSock, [peerRef.current, sockRef.current]);
 const removeWebRTCB=useCallback(removeWebRTC,[peerRef.current])
// const vals = useMemo(() => ({
//   addUsers: addUsersCb,
//   destroyRtcSock:destroyRtcSockCb,
//   RemoveSock: RemoveSockCb,
//   removeWebRTC:removeWebRTC,
//   rtcStatusUpdate: updateRtcStatus,
//   socUpdateStatus: updateSockStatus
// }), [peerRef, sockRef]);
const vals = useMemo(() => ({
  addUsers: addUsersCb,
  destroyRtcSock: destroyRtcSockCb,
  RemoveSock: RemoveSockCb,
  removeWebRTC:removeWebRTCB,
  rtcStatusUpdate: updateRtcStatus,
  socUpdateStatus: updateSockStatus
}), [
  addUsersCb,
  destroyRtcSockCb,
  RemoveSockCb,
  removeWebRTCB,
  updateRtcStatus,
  updateSockStatus
]);

    //-------------------Context business logic stat-------------------

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