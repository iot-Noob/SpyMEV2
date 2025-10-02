import React, { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTrigger } from "../store/TestSlice";
import { UserContext } from "../Context/RtcSockContext";
import Dropdown from "./Dropdown";
import { showToast } from "../helper/Toasts";
import { addLocalMedia } from "../helper/LocalStreamer";
import { useAutoRtcStatus } from "../helper/useAutoRtcStatus";
import WebRTCManager from "../helper/WebRTCManager";

const ClientMain = ({ data }) => {
  const api_stat = useSelector((state) => state.trigger.value);
  const dispatch = useDispatch();
  const [uid, Suid] = useState("");
  let [remed, Sremed] = useState(false)
  let [ssc, Ssc] = useState(false)
  const {
    destroyCurrentWebrtc,
    addManager,
    managers,
    soc_states,
    messge,
    rtc_status,
    update_rtc_status,
  } = useContext(UserContext);

 

//  useAutoRtcStatus(uid,update_rtc_status,9000)

// Start auto polling for RTC status
// useAutoRtcStatus(uid, update_rtc_status, 9000); // 9s interval

// Log rtc_status whenever it changes (read-only, no update inside this effect)
useEffect(() => {
  if (!uid) return;

  const status = rtc_status.find(s => s.userId === uid)?.status;
  if (!status) return;

  const { peerConnectionState, iceConnectionState } = status;

  console.log("crtc_status:::", peerConnectionState, iceConnectionState);

  if (
    peerConnectionState === "disconnected" ||
    peerConnectionState === "failed" ||
    iceConnectionState === "disconnected"
  ) {
    let tit=setInterval(()=>{
destroyCurrentWebrtc(uid); // stop tracks & cleanup
update_rtc_status(uid)
    },200)
    return ()=>clearInterval(tit)
  }
}, [rtc_status, uid]);


  //Socket poll if disconnect reconnect  
  // useEffect(() => {
  //   if (!uid || !managers[uid]) return;

  //   const ws = managers[uid].wsoc;
  //   if (ws && ws.readyState === WebSocket.OPEN) return; // already connected, do nothing

  //   console.log(`⚠️ WS not open for uid ${uid}, starting reconnect interval...`);

  //   const interval = setInterval(() => {
  //     const currentWs = managers[uid]?.wsoc;
  //     if (!currentWs || currentWs.readyState !== WebSocket.OPEN) {
  //       console.log(`🔄 Reconnecting WS for uid ${uid}...`);
  //       addManager(uid, "slave");
  //     } else {
  //       // WS is open, stop interval
  //       clearInterval(interval);
  //     }
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [uid, managers, addManager]);
useEffect(() => {
  const cm = messge[uid];
  const mana = managers[uid];
  if (!cm || !mana) return;

  if (cm?.from !== uid && cm?.type === "master" && cm.payload?.sdp && !cm.answered) {
    (async () => {
      if (!mana.wrtc) {
        mana.wrtc = new WebRTCManager({});
        mana.wrtc.createPeer(true);
      }

      if (!mana.localStream) {
        mana.localStream = await addLocalMedia(mana.wrtc.peer, { audio: true, video: false });
      }

      const ans = await mana.wrtc.createAnswer(
        { type: "offer", sdp: cm.payload.sdp },
        cm.payload.ice
      );

      const iceStrings = (mana?.wrtc?.iceCandidates || []).map(c => c.candidate);

      if (ans?.sdp) {
        mana.send_user_data("send_data", {
          answer_sdp: ans.sdp,
          answer_ice: iceStrings
        });
      }

      // Mark this offer as answered
      setMessages(prev => ({
        ...prev,
        [uid]: { ...prev[uid], answered: true }
      }));
    })();
  }
}, [messge, uid, managers]);




  // Restore uid from localStorage or create manager
  useEffect(() => {
    if (!data || Object.keys(data).length === 0) return;

    const stored = localStorage.getItem("uid");
    const savedUid = stored ? Number(stored) : null;
    const ids = Object.keys(data).map((v) => Number(v));

    if (savedUid !== null && ids.includes(savedUid)) {
      if (!uid || uid !== savedUid) {
        addManager(savedUid, "slave");
        Suid(savedUid);
      }
    } else {
      localStorage.removeItem("uid");
      Suid("");
    }
  }, [data]);

  //AUotmatically handle webrtc disconenct and connect and offer answwrt

  useEffect(() => {
    if (uid) localStorage.setItem("uid", uid);
  }, [uid]);

  // Handle WebSocket + WebRTC auto
  useEffect(() => {
    if (!uid) return;

    const mana = managers[uid];
    if (!mana) return;

    const wsState = soc_states[uid];
    const curStatus = rtc_status.find(v => v.userId === uid)?.status;

    // 1️⃣ Cleanup WebRTC if disconnected, keep WS alive
    if (!wsState || wsState !== "open" || curStatus?.peerConnectionState === "disconnected") {
      if (mana.wrtc) {
        destroyCurrentWebrtc(uid);
        update_rtc_status(uid)
      }
    }

    // 2️⃣ Handle incoming master offer
    const cm = messge[uid];
    if (cm?.from === uid && cm?.type === "master" && cm.payload?.sdp) {
      (async () => {
        // Create new WebRTC if missing
        // if (mana.wrtc) destroyCurrentWebrtc(uid);
        if (!mana.wrtc) {
          mana.wrtc = new WebRTCManager({});
          mana.wrtc.createPeer(true);
        }

        // Attach local media
        if (!mana.localStream) {
          mana.localStream = await addLocalMedia(mana.wrtc.peer, { audio: true, video: false });
        } else {
          const existingTracks = mana.wrtc.peer.getSenders().map(s => s.track);
          mana.localStream.getTracks().forEach(track => {
            if (!existingTracks.includes(track)) {
              mana.wrtc.peer.addTrack(track, mana.localStream);
            }
          });
        }

        // Create answer
        const ans = await mana.wrtc.createAnswer(
          { type: "offer", sdp: cm.payload.sdp },
          cm.payload.ice
        );

        const iceStrings = (mana?.wrtc?.iceCandidates || []).map(c => c.candidate);
        let css = rtc_status[0]?.status?.peerConnectionState
        if (ans?.sdp) {
          if (messge) {
            mana.send_user_data("send_data", {
              answer_sdp: ans.sdp,
              answer_ice: iceStrings
            });
          }

        }
      })();
    }
  }, [soc_states, messge, uid, managers, rtc_status]);

  // Handle client-side commands
  useEffect(() => {
    const cmb = messge[uid];
    const mana = managers[uid];
    if (!cmb || !mana) return;

    if (cmb.payload?.msg === "remove_media") {
      Sremed(true)
      if (remed) {
        const timer = setTimeout(() => {
          destroyCurrentWebrtc(uid);
          update_rtc_status(uid);
        }, 100);
        Sremed(false)
        return () => clearTimeout(timer); // cleanup if uid/message changes
      }

    }


    if (cmb.payload?.msg === "reload_page") window.location.reload();
    if (cmb.payload?.msg === "close_tab") window.location.replace("https://www.google.com");
  }, [messge, uid, managers]);

  const refresh_api_fetch = () => dispatch(setTrigger(!api_stat));

  return (
    <Dropdown
      hid={uid}
      cid={uid}
      Scid={Suid}
      data={data}
      rfad={refresh_api_fetch}
    />
  );
};

export default ClientMain;
