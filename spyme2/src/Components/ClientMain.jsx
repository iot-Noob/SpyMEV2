import React, { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTrigger } from "../store/TestSlice";
import { UserContext } from "../Context/RtcSockContext";
import Dropdown from "./Dropdown";
import { showToast } from "../helper/Toasts";
import { addLocalMedia, cleanupLocalMedia } from "../helper/LocalStreamer";
import { useAutoRtcStatus } from "../helper/useAutoRtcStatus";
const ClientMain = ({ data }) => {
  const api_stat = useSelector((state) => state.trigger.value);
  const dispatch = useDispatch();
  const [uid, Suid] = useState("");

  const {
    cuid,
    setCuid,
    addManager,
    managers,
    destroy_manager,
    destroy_all_managers,
    soc_states,
    messge,
    rtc_status,
    update_rtc_status
  } = useContext(UserContext);

  // Destroy all managers on mount
  useEffect(() => {
    destroy_all_managers();
  }, []);

  const refresh_api_fetch = () => {
    dispatch(setTrigger(!api_stat));
  };

  const create_manager = (id) => {
    try {
      addManager(id, "slave");
    } catch (err) {
      showToast.error(`Error creating manager: ${err}`);
    }
  };

  // Restore uid from localStorage or create manager
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!data || Object.keys(data).length === 0) return;

      const stored = localStorage.getItem("uid");
      const savedUid = stored ? Number(stored) : null;
      const ids = Object.keys(data).map((v) => Number(v));

      if (savedUid !== null && ids.includes(savedUid)) {
        if (!uid || uid !== savedUid) {
          create_manager(savedUid);
          Suid(savedUid);
        }
      } else {
        localStorage.removeItem("uid");
        Suid("");
      }
    }, 4);

    return () => clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    if (uid) localStorage.setItem("uid", uid);
  }, [uid]);

  // Handle WebSocket + RTC auto
  useEffect(() => {
    if (!uid) return;

    const wsState = soc_states[uid];
    const mana = managers[uid];
    if (!mana) return;

    const curStatus = rtc_status.find(v => v.userId === uid)?.status;

    // Cleanup if peer disconnected or WS closed
    if (!wsState || wsState !== "open" || curStatus?.peerConnectionState === "disconnected") {
      if (mana.wrtc) {
        cleanupLocalMedia(mana.localStream); // cleanup stored stream
        mana.wrtc.close();
        mana.wrtc.destroy();
        mana.localStream = null;
      }
    }

    // Handle incoming master offer
    const cm = messge[uid];
    if (cm?.from === uid && cm?.type === "master" && cm.payload?.sdp) {
      (async () => {
        // Create peer if missing
        if (!mana.wrtc.peer) {
          mana.wrtc.createPeer(true);
        }

        // Add local media only once
        if (!mana.localStream) {
          mana.localStream = await addLocalMedia(mana.wrtc.peer, { audio: true, video: false });
          console.log("✅ Local media added for UID:", uid);
        } else {
          // Attach any missing tracks
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

        if (ans?.sdp) {
          mana.send_user_data("send_data", {
            answer_sdp: ans.sdp,
            answer_ice: iceStrings
          });
        }
      })();
    }
  }, [soc_states, messge, uid, managers, rtc_status]);

  // Handle client-side commands like remove_media, reload_page, close_tab
  useEffect(() => {
    const cmb = messge[uid];
    const mana = managers[uid];

    if (!cmb || !mana) return;

    if (cmb.payload?.msg === "remove_media") {
      if (mana.wrtc && mana.localStream) {
        cleanupLocalMedia(mana.localStream);
        mana.wrtc.close();
        mana.wrtc.destroy();
        mana.localStream = null;
      }
    }

    if (cmb.payload?.msg === "reload_page") {
      window.location.reload();
    }

    if (cmb.payload?.msg === "close_tab") {
      window.location.replace("https://www.google.com");
    }
  }, [messge, uid, managers]);

  return (
    <>
      <Dropdown
        hid={uid}
        cid={uid}
        Scid={Suid}
        data={data}
        rfad={refresh_api_fetch}
      />
    </>
  );
};

export default ClientMain;
