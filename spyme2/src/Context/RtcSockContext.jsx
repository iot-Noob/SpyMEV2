import React, {
  createContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { createSignalingSocket } from "../helper/apiClient";
import WebRTCManager from "../helper/WebRTCManager";

/**
 * @typedef {Object} UserContextType
 * @property {string|null} cuid - Currently active user ID
 * @property {(id: string|null) => void} setCuid - Set the current user ID
 * @property {(userId: string, role: "slave" | "master") => void} addManager - Add a manager for a user
 * @property {Record<string, any>} managers - Active managers
 * @property {(userId: string) => void} destroy_manager - Destroy one manager
 * @property {() => void} destroy_all_managers - Destroy all managers
 * @property {Record<string, any>} rtc_contxt_data - RTC-related shared data
 * @property {(data: any) => void} set_rtc_contxt - Update RTC shared data
 * @property {Record<string, WebSocket>} soc_contxt - Map of userId → WebSocket
 * @property {Record<string, string>} soc_states - Map of userId → socket state
 * @property {Record<string, any>} messge - Latest messages from sockets
 * @property {Array<{userId: string, status: any}>} rtc_status - WebRTC status list
 * @property {(userId: string) => void} update_rtc_status - Refresh RTC status for user
 */
const defaultValue = {
  cuid: null,
  setCuid: () => {},
  addManager: () => {},
  managers: {},
  destroy_manager: () => {},
  destroy_all_managers: () => {},
  rtc_contxt_data: {},
  set_rtc_contxt: () => {},
  soc_contxt: {},
  soc_states: {},
  messge: {},
  rtc_status: [],
  update_rtc_status: () => {},
};

const UserContext = createContext(defaultValue);

/**
 * Provider component for WebRTC + WebSocket managers
 */
const RtcSockContext = ({ children, handlers = {}, stun = {} }) => {
  const [managers, setManagers] = useState({});
  const [cuid, setCuid] = useState(null);
  const [socStates, setSocStates] = useState({});
  const [messages, setMessages] = useState({});
  const [rtcStatuses, setRtcStatuses] = useState([]);

  const rtcContext = useRef({});
  const socContext = useRef({});

  // Translate readyState → string
  const getStateName = (readyState) => {
    switch (readyState) {
      case WebSocket.CONNECTING: return "connecting";
      case WebSocket.OPEN: return "open";
      case WebSocket.CLOSING: return "closing";
      case WebSocket.CLOSED: return "closed";
      default: return "unknown";
    }
  };

  // Update RTC status
  const updateRtcStatus = useCallback((userId) => {
    const manager = managers[userId]?.wrtc;
    if (!manager) return;

    const status = manager.getStatus();
    setRtcStatuses((prev) => {
      const exists = prev.some((s) => s.userId === userId);
      return exists
        ? prev.map((s) => (s.userId === userId ? { userId, status } : s))
        : [...prev, { userId, status }];
    });
  }, [managers]);

  // Add WebRTC + WebSocket manager
  const addManager = useCallback((userId, role) => {
    if (!userId) return;
    destroyManager(userId)
    // If socket exists but open → skip
    if (managers[userId]?.wsoc?.readyState === WebSocket.OPEN) {
      console.log(`⚠️ Manager for ${userId} already active`);
      return;
    }

    // If socket exists but closed → cleanup
    if (managers[userId]?.wsoc) {
      try {
        managers[userId].wsoc.close();
      } catch (e) {
        console.warn("Cleanup failed", e);
      }
      delete managers[userId];
    }

    const rtc = new WebRTCManager(stun);
    const { socket, send_data } = createSignalingSocket(userId, handlers, role);

    // Track connection state
    const updateState = () => {
      setSocStates((prev) => ({
        ...prev,
        [userId]: getStateName(socket.readyState),
      }));
    };

    socket.addEventListener("open", updateState);
    socket.addEventListener("close", updateState);
    socket.addEventListener("error", updateState);
    socket.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => ({ ...prev, [userId]: msg }));
        updateRtcStatus(userId);
      } catch (err) {
        console.error("Bad WS message", err);
      }
    });

    socContext.current[userId] = socket;

    setManagers((prev) => ({
      ...prev,
      [userId]: {
        wrtc: rtc,
        wsoc: socket,
        send_user_data: send_data,
        wsh: handlers,
        rtcss: stun,
        unbind: () => {
          socket.removeEventListener("open", updateState);
          socket.removeEventListener("close", updateState);
          socket.removeEventListener("error", updateState);
        },
      },
    }));

    updateState();
    console.log("✅ Added manager for user", userId);
  }, [handlers, stun, managers, updateRtcStatus]);

  // Destroy one manager
  const destroyManager = useCallback((userId) => {
    setManagers((prev) => {
      const m = prev[userId];
      if (!m) return prev;

      console.log("🗑 Destroying manager for user", userId);

      if (m.unbind) m.unbind();
      if (m.wsoc && m.wsoc.readyState === WebSocket.OPEN) m.wsoc.close();

      if (m.wrtc) {
        m.wrtc.cleanup?.();
        m.wrtc.close?.();
        m.wrtc.destroy?.();
      }

      const next = { ...prev };
      delete next[userId];
      return next;
    });

    setRtcStatuses((prev) => prev.filter((s) => s.userId !== userId));
    setSocStates((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });

    delete socContext.current[userId];
    if (cuid === userId) setCuid(null);
  }, [cuid]);

  // Destroy all managers
  const destroyAllManagers = useCallback(() => {
    Object.keys(managers).forEach((id) => destroyManager(id));
    console.log("🧹 All managers destroyed");
  }, [managers, destroyManager]);

  // Destroy/close WebRTC for current user

// const destroyCurrentWebrtc = useCallback((userId = cuid) => {
//   if (!userId) return;
// setManagers(prev => {
//   const m = prev[userId];
//   if (!m) return prev;

//   console.log("🗑 Destroying user's WebRTC:", userId);

//   // Cleanup WebRTC and local media
//   m.wrtc?.close?.();
//   m.wrtc?.destroy?.();
//   if (m.localStream) {
//     m.localStream.getTracks().forEach(track => track.stop());
//     m.localStream = null;
//   }

//   return {
//     ...prev,
//     [userId]: { ...m, closed: true } // mark closed instead of deleting
//   };
// });


//   setRtcStatuses(prev => prev.filter(s => s.userId !== userId));
//   setSocStates(prev => {
//     const next = { ...prev };
//     delete next[userId];
//     return next;
//   });
//   delete socContext.current[userId];

//   if (cuid === userId) setCuid(null);
// }, [cuid]);

const destroyCurrentWebrtc = useCallback((userId = cuid) => {
  if (!userId) return;

  setManagers(prev => {
    const m = prev[userId];
    if (!m) return prev;

    console.log("🗑 Cleaning up WebRTC for:", userId);

    // Cleanup WebRTC and local media
    m.wrtc?.cleanup?.();
    m.wrtc?.close?.();
    m.wrtc?.destroy?.();

    if (m.localStream) {
      m.localStream.getTracks().forEach(track => track.stop());
      m.localStream = null;
    }

    // Keep the manager object for WebSocket
    // return {
    //   ...prev,
    //   [userId]: {
    //     ...m,
    //     wrtc: null,
    //     localStream: null,
    //   }
    // };
    return {
  ...prev,
  [userId]: {
    ...m,
    wrtc: null,
    localStream: null,
  }
};
  });

  setRtcStatuses(prev => {
  const next = prev.filter(s => s.userId !== userId);
  return next.length === prev.length ? [...next] : next;
});
  // leave socStates and socContext untouched
}, [cuid]);


  const value = {
    destroyCurrentWebrtc:destroyCurrentWebrtc,
    cuid,
    setCuid,
    addManager,
    managers,
    setManager:setManagers,
    destroy_manager: destroyManager,
    destroy_all_managers: destroyAllManagers,
    rtc_contxt_data: rtcContext.current,
    set_rtc_contxt: (data) => (rtcContext.current = data),
    soc_contxt: socContext.current,
    soc_states: socStates,
    messge: messages,
    rtc_status: rtcStatuses,
    update_rtc_status: updateRtcStatus,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export { UserContext };
export default RtcSockContext;
