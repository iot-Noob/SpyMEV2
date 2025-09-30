import React, { createContext, useState, useRef, useEffect, useCallback } from "react";
import { createSignalingSocket } from "../helper/apiClient";
import WebRTCManager from "../helper/WebRTCManager";
/**
 * @typedef {Object} UserContextType
 * @property {string|null} cuid - Currently active user ID
 * @property {(id: string|null) => void} setCuid - Set the current user ID
 * @property {(userId: number, role: "slave" | "master") => void} addManager - Add a manager for a user
 * @property {Record<string, any>} managers - Active managers
 * @property {(userId: string) => void} destroy_manager - Destroy one manager
 * @property {() => void} destroy_all_managers - Destroy all managers
 * @property {Record<string, any>} rtc_contxt_data - RTC-related shared data
 * @property {(data: any) => void} set_rtc_contxt - Update RTC shared data
 * @property {Record<string, WebSocket>} soc_contxt - Map of userId → WebSocket
 * @property {Record<string, string>} soc_states - Map of userId → socket state
 */

/** @type {UserContextType} */
const defaultValue = {
  cuid: null,
  setCuid: () => { },
  addManager: () => { },
  managers: {},
  destroy_manager: () => { },
  destroy_all_managers: () => { },
  rtc_contxt_data: {},
  set_rtc_contxt: () => { },
  soc_contxt: {},
  soc_states: {},
};
/**
 * @typedef {Object}  UserContext
 * @param {Object} defaultValue
 */
const UserContext = createContext(defaultValue);
/**
 * Provider component for WebRTC + WebSocket managers
 *
 * @param {{ 
 *   children: React.ReactNode, 
 *   handlers?: Record<string, Function>, 
 *   stun?: object 
 * }} props
 */
const RtcSockContext = ({ children, handlers = {}, stun = {} }) => {
  const [managers, setMnager] = useState({});

  const [cuid, setCuid] = useState(null); // active user
  const rtcContext = useRef({});
  const socContext = useRef({});
  const [socStates, setSocStates] = useState({}); // { uid: "open" | "closed" }
  const [messages, setMessages] = useState([]);

  const [rtcStatuses, setRtcStatuses] = useState([]);

  const updateRtcStatus = (userId) => {
    const manager = managers[userId]?.wrtc;
    if (!manager) return;

    const status = manager.getStatus();

    setRtcStatuses((prev) => {
      const exists = prev.some((s) => s.userId === userId);

      if (exists) {
        // update only the matching user, keep others intact
        return prev.map((s) =>
          s.userId === userId ? { userId, status } : s
        );
      } else {
        // add new user
        return [...prev, { userId, status }];
      }
    });
  };



  /**
 * Convert a WebSocket readyState number to a human-readable string.
 *
 * @param {number} readyState - The WebSocket.readyState value.
 * @returns {"connecting" | "open" | "closing" | "closed" | "unknown"} - Readable state name.
 */
  // helper: translate readyState
  const getStateName = (readyState) => {
    switch (readyState) {
      case WebSocket.CONNECTING: return "connecting";
      case WebSocket.OPEN: return "open";
      case WebSocket.CLOSING: return "closing";
      case WebSocket.CLOSED: return "closed";
      default: return "unknown";
    }
  };
  /**
   * Add a WebRTC manager and WebSocket connection for a specific user.
   * If a manager already exists for the given `userId`, the function does nothing.
   *
   * @param {string} userId - The unique identifier of the user.
   *
   * The manager object stored internally contains:
   * @property {WebRTCManager} wrtc - Instance of the WebRTC manager for handling peer connections.
   * @property {WebSocket} wsoc - WebSocket connection used for signaling.
   * @property {(data: any) => void} send_user_data - Function to send data over the WebSocket.
   * @property {Record<string, Function>} wsh - Handlers for signaling messages.
   * @property {object} rtcss - STUN server configuration.
   * @property {() => void} [unbind] - Function to remove WebSocket event listeners.
   *
   * Side effects:
   * - Updates `managers.current` with a new manager object for the user.
   * - Adds the WebSocket to `socContext.current`.
   * - Tracks socket state and updates `socStates` state for UI consumption.
   * - Logs to console when a manager is successfully added.
   */
  // add manager explicitly
  //   const addManager = useCallback((userId,role) => {
  //     if (!userId || managers[userId]) return;

  //     const rtc = new WebRTCManager(stun);
  //     const { socket, send_data } = createSignalingSocket(userId, handlers,role);

  //     // managers.current[userId] = {
  //     //   wrtc: rtc,
  //     //   wsoc: socket,
  //     //   send_user_data: send_data,
  //     //   wsh: handlers,
  //     //   rtcss: stun,
  //     // };
  //    setMnager(prev => ({
  //   ...prev, // keep existing managers
  //   [userId]: {
  //     ...prev[userId],
  //     wrtc: rtc,
  //     wsoc: socket,
  //     send_user_data: send_data,
  //     wsh: handlers,
  //     rtcss: stun,
  //   }
  // }));

  //     socContext.current[userId] = socket;

  //     // track socket state
  //     const updateState = () => {
  //       setSocStates((prev) => ({
  //         ...prev,
  //         [userId]: getStateName(socket.readyState),
  //       }));
  //     };

  //     updateState(); // initial
  //     socket.addEventListener("open", updateState);
  //     socket.addEventListener("close", updateState);
  //     socket.addEventListener("error", updateState);
  //     socket.addEventListener("message", (event) => {
  //       try {
  //         const msg = JSON.parse(event.data);
  //         //console.log("📩 WS message from", userId, msg);

  //         //  setMessages((prev) => {
  //         //   const prevMsgs = prev[userId] || [];
  //         //   return {
  //         //     ...prev,
  //         //     [userId]: [...prevMsgs, msg], // new reference
  //         //   };
  //         // });

  //         setMessages((prev) => ({
  //           ...prev,
  //           [userId]: msg, // just one latest message
  //         }));

  //         updateRtcStatus(userId)
  //       } catch (err) {
  //         console.error("Bad WS message", err);
  //       }
  //     });
  // if (!managers[userId]) {
  //   managers[userId] = {};  // ✅ initialize
  // }
  //     // cleanup binding when destroyed
  //     managers[userId].unbind = () => {
  //       socket.removeEventListener("open", updateState);
  //       socket.removeEventListener("close", updateState);
  //       socket.removeEventListener("error", updateState);
  //     };

  //     console.log("✅ Added manager for user", userId);
  //   }, [handlers, stun]);


  const addManager = useCallback((userId, role) => {
    if (!userId || managers[userId]) return;

    const rtc = new WebRTCManager(stun);
    const { socket, send_data } = createSignalingSocket(userId, handlers, role);

    // managers.current[userId] = {
    //   wrtc: rtc,
    //   wsoc: socket,
    //   send_user_data: send_data,
    //   wsh: handlers,
    //   rtcss: stun,
    // };
    setMnager(prev => ({
      ...prev, // keep existing managers
      [userId]: {
        ...prev[userId],
        wrtc: rtc,
        wsoc: socket,
        send_user_data: send_data,
        wsh: handlers,
        rtcss: stun,
      }
    }));

    socContext.current[userId] = socket;

    // track socket state
    const updateState = () => {
      setSocStates((prev) => ({
        ...prev,
        [userId]: getStateName(socket.readyState),
      }));
    };

    updateState(); // initial
    socket.addEventListener("open", updateState);
    socket.addEventListener("close", updateState);
    socket.addEventListener("error", updateState);
    socket.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        //console.log("📩 WS message from", userId, msg);

        //  setMessages((prev) => {
        //   const prevMsgs = prev[userId] || [];
        //   return {
        //     ...prev,
        //     [userId]: [...prevMsgs, msg], // new reference
        //   };
        // });

        setMessages((prev) => ({
          ...prev,
          [userId]: msg, // just one latest message
        }));

        updateRtcStatus(userId)
      } catch (err) {
        console.error("Bad WS message", err);
      }
    });
    if (!managers[userId]) {
      managers[userId] = {};  // ✅ initialize
    }
    // cleanup binding when destroyed
    managers[userId].unbind = () => {
      socket.removeEventListener("open", updateState);
      socket.removeEventListener("close", updateState);
      socket.removeEventListener("error", updateState);
    };

    console.log("✅ Added manager for user", userId);
  }, [handlers, stun]);


  // auto-create when cuid changes
  useEffect(() => {
    if (cuid) addManager(cuid);
  }, [cuid, addManager]);




  // destroy one
  /**
 * Destroy a manager for a specific user and clean up resources.
 * This removes the WebRTC manager, closes the WebSocket connection,
 * unbinds event listeners, and updates relevant state objects.
 *
 * @param {string} userId - The unique identifier of the user whose manager should be destroyed.
 *
 * Side effects:
 * - Calls `unbind()` if present to remove WebSocket event listeners.
 * - Closes the WebSocket connection if it is still open.
 * - Calls `cleanup()` and `close()` on the WebRTC manager if available.
 * - Removes the manager from `managers.current`.
 * - Removes the WebSocket from `socContext.current`.
 * - Updates `socStates` to remove the user's socket state.
 * - Resets `cuid` to null if it matches the destroyed userId.
 *
 * Logs a message to the console indicating the manager was destroyed.
 */
  const destroyManager = (userId) => {
    const m = managers[userId];
    if (!m) return;

    console.log("🗑 Destroying manager for user", userId);

    if (m.unbind) m.unbind();
    if (m.wsoc && m.wsoc.readyState === WebSocket.OPEN) m.wsoc.close();
    if (m.wrtc) {
      if (typeof m.wrtc.cleanup === "function") m.wrtc.cleanup();
      if (typeof m.wrtc.close === "function") m.wrtc.close();
      if (typeof m.wrtc.destroy === "function") m.wrtc.destroy(); // optional extra cleanup
    }
    setRtcStatuses((prev) => prev.filter((s) => s.userId !== userId)); // ✅ remove from state

    delete managers[userId];
    delete socContext.current[userId];

    setSocStates((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });

    if (cuid === userId) setCuid(null);
  };

  // destroy all
  function destroyAllManagers() {
    if (!managers || typeof managers !== "object") {
      console.warn("No managers found to destroy");
      return;
    }

    Object.keys(managers).forEach((key) => {
      if (managers[key] && typeof managers[key].destroy === "function") {
        managers[key].destroy();
      }
    });
  }

  /**
   * @typedef {Object} UserContextValue
   * @property {string|null} cuid - Current active user ID.
   * @property {function(string|null): void} setCuid - Function to set the current user ID.
   * @property {function(string, Object): void} addManager - Function to add a new WebRTC + WebSocket manager for a user.
   * @property {Object.<string, Object>} managers - A map of all user managers keyed by user ID.
   * @property {function(string): void} destroy_manager - Function to destroy a manager for a specific user ID.
   * @property {function(): void} destroy_all_managers - Function to destroy all user managers.
   * @property {Object} rtc_contxt_data - Stores WebRTC context data (SDP, ICE candidates) for users.
   * @property {function(Object): void} set_rtc_contxt - Function to update the WebRTC context data.
   * @property {Object} soc_contxt - Current WebSocket context object (e.g., { socket, send_data }).
   * @property {Object} soc_states - UI-friendly state object reflecting socket connection states.
   */

  /** @type {UserContextValue} */
  const value = {
    cuid,
    setCuid,
    addManager,
    managers: managers,
    setManagers: setMnager,
    destroy_manager: destroyManager,
    destroy_all_managers: destroyAllManagers,
    rtc_contxt_data: rtcContext.current,
    set_rtc_contxt: (data) => (rtcContext.current = data),
    soc_contxt: socContext.current,
    soc_states: socStates, // 👈 UI can use this
    setSocState: setSocStates,
    messge: messages,
    rtc_status: rtcStatuses,
    update_rtc_status: updateRtcStatus
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export { UserContext };
export default RtcSockContext;
