import React, { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTrigger } from "../store/TestSlice";
import { UserContext } from "../Context/RtcSockContext";
import Dropdown from "./Dropdown";
import { showToast } from "../helper/Toasts";
import { addLocalMedia ,cleanupLocalMedia} from "../helper/LocalStreamer";

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
    rtc_status
  } = useContext(UserContext);
  
  useEffect(()=>{   
    let cmb=messge[uid]
    let cp=managers[uid]?.wrtc?.peer
    let mng=managers[uid]
     if(cmb?.payload?.msg&&cmb?.payload?.msg==="remove_media"){
        if(cp){
        mng.wrtc.close()
        mng.wrtc.destroy()
        cleanupLocalMedia(cp)
        }
        
     }
          if(cmb?.payload?.msg&&cmb?.payload?.msg==="reload_page"){
            window.location.reload();

        
     }
  },[messge])
  
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

  // Save uid to localStorage when changed
  useEffect(() => {
    if (uid) localStorage.setItem("uid", uid);
  }, [uid]);

  // Handle WebSocket + RTC auto
 useEffect(() => {
    if (!uid) return;

  const wsState = soc_states[uid];
  const mana = managers[uid];

  if (!mana) return;

  // Get current RTC status from context
  const curStatus = rtc_status.find(v => v.userId === uid)?.status;
    console.log(`Current status::::`,curStatus)
  // Cleanup media if peer is disconnected or WS is closed
  if (!wsState || wsState !== "open" || curStatus?.peerConnectionState === "disconnected") {
 
    if (mana.wrtc) {
    cleanupLocalMedia(mana.wrtc.peer);
      mana.wrtc.close();
      mana.wrtc.destroy();
    
    }
  
  }

  // Create peer & add local media only if peer is missing or closed


  // Handle incoming master offer
  const cm = messge[uid];
  if (cm?.from === uid && cm?.type === "master" && cm.payload?.sdp) {
    (async () => {
           mana.wrtc.createPeer(true);
        addLocalMedia(mana.wrtc.peer, { audio: true, video: false });
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
