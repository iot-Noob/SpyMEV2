import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTrigger } from "../store/TestSlice";
import { UserContext } from "../Context/RtcSockContext";
import Dropdown from "./Dropdown";
import { showToast } from "../helper/Toasts";
import { addLocalMedia, cleanupLocalMedia } from "../helper/LocalStreamer";
import { useAutoRtcStatus } from "../helper/useAutoRtcStatus";
import { getLocalMedia, cleanupLocalStream } from "../helper/getLocalMedia";

// import { getLocalMedia, cleanupLocalStream } from "../helper/getLocalMedia";
const ClientMain = ({ data }) => {
  const api_stat = useSelector((state) => state.trigger.value);
  const dispatch = useDispatch();
  const [uid, Suid] = useState(() => {
    const stored = localStorage.getItem("uid");
    return stored ? Number(stored) : undefined;
  });


  
  const refresh_api_fetch = () => {
    let tit = setTimeout(() => {
      dispatch(setTrigger(!api_stat))
    },)
    return () => clearTimeout(tit)
  };
  const {
    destroyCurrentWebrtc,
    addManager,
    managers,
    soc_states,
    messge,
    rtc_status,
    update_rtc_status,
    destroy_manager,
    destroy_all_managers,
soc_contxt
  } = useContext(UserContext);
const WS_URL = import.meta.env.VITE_WS_URL;
  //-------------Once start update status of rtc start -------------
  useAutoRtcStatus(uid, update_rtc_status, 1000)
  // useEffect(()=>{
  //   useAutoRtcStatus(uid,update_rtc_status,1000)
  // },[])
  //-------------Once start update status of rtc start -------------


  //-------------Effect hook to store id in localstorage start-------------

  //-------------check current sock status and reconnect start -------------
 
useEffect(() => {
  if (!uid) return;
  const state = soc_states[uid];

  if (state && state !== "open") {
    console.log("Socket not open, reopening for uid:", uid);

    // Re-create WebSocket if it was closed
    soc_contxt[uid] = new WebSocket(WS_URL);
    soc_contxt[uid].onopen = () => console.log("Socket reopened for uid", uid);
    soc_contxt[uid].onclose = () => console.log("Socket closed for uid", uid);
  }
}, [uid, soc_states[uid]]);


   //-------------check current sock status and reconnect end -------------
  useEffect(() => {
    update_rtc_status(uid)
  }, [rtc_status[uid]])

  useEffect(() => {
    try {

      destroy_all_managers()

      if (uid === undefined) return; // don't sync if state is still undefined

      const gid = localStorage.getItem("uid");
      console.log("uid (state):", uid);
      console.log("uid (localStorage):", gid);

      if (!gid || Number(gid) !== uid) {
        console.log("Updating localStorage uid");
        localStorage.setItem("uid", uid);

      }
      let tot = setTimeout(() => {
        if (uid) {
          addManager(uid, "slave")
        }
      }, 100)
      return () => clearTimeout(tot)
    } catch (err) {
      console.error("Error occue get uid", uid)
    }

  }, [uid]);

  //-------------Effect hook to store id in localstorage end-------------


  //-------------Create offer on incomming message from webrtc and create answer start-------------

  // useEffect(() => {
  //   const manag = managers[uid]?.wrtc;
  //   const mss = managers[uid]?.send_user_data;
  //   const handleOffer = async () => {
  //     if (
  //       !messge[uid] ||
  //       messge[uid]?.type !== "master" ||
  //       !messge[uid]?.payload?.sdp ||
  //       !messge[uid]?.payload?.ice?.length
  //     ) return;


  //     const update = () => update_rtc_status(uid);

  //     if (soc_states[uid] !== "open" || !manag) return;

  //     if (!manag.peer) {
  //       manag.createPeer(true);

  //     }

  //     const sdp = messge[uid]?.payload?.sdp;
  //     const ice = messge[uid]?.payload?.ice;


  //     try {
  //           try{
  //               // var stream =  await addLocalMedia(manag?.peer,{audio: true, video: false})
  //               var stream=await getLocalMedia({audio: true, video: false})
  //           }catch(err){
  //             console.error(`Error occur add media`,err)
  //           }



  //         if(stream){
  //           var ans = await manag.createAnswer({ type: "offer", sdp }, ice, stream?stream:null);
  //         }else{
  //           console.warn("no stream found!!")
  //         }



  //       const aice = manag.iceCandidates.map(c => c.candidate);

  //       // console.log("Answer SDP:", ans.sdp);
  //       // console.log("ICE candidates:", aice);

  //       console.log("RTC status:", rtc_status);
  //       let peer = manag?.peer

  //       if (ans?.sdp && aice.length) {
  //         update()
  //         mss("send_data", {
  //           answer_sdp: ans.sdp,
  //           answer_ice: aice
  //         });

  //       }


  //     } catch (err) {
  //       console.error("Failed to create answer:", err);
  //     }
  //   };

  //   handleOffer();

  // }, [messge,uid,rtc_status[uid]]);

  useEffect(() => {
    const manag = managers[uid]?.wrtc;
    const mss = managers[uid]?.send_user_data;
    const handleOffer = async () => {
      const msg = messge[uid];
      if (!msg || msg.type !== "master" || !msg.payload?.sdp || !msg.payload?.ice?.length) return;
      if (soc_states[uid] !== "open" || !manag) return;

      if (!manag.peer) manag.createPeer(true);

      if (!manag.localStream) {
        try {
          manag.localStream = await getLocalMedia({ audio: true, video: false });
          console.log("Local media ready", uid, manag.localStream);
        } catch (err) {
          console.error("Error getting local media", err);
        }
      }

      if (manag.localStream) {
        try {
          const ans = await manag.createAnswer({ type: "offer", sdp: msg.payload.sdp }, msg.payload.ice, manag.localStream);
          const aice = manag.iceCandidates.map(c => c.candidate);
          if (ans?.sdp && aice.length) {
            update_rtc_status(uid);
            mss("send_data", { answer_sdp: ans.sdp, answer_ice: aice });
          }
        } catch (err) {
          console.error("Failed to create answer:", err);
        }
      } else {
        console.warn("No local stream available!!");
      }
    };

    handleOffer();
  }, [messge[uid], uid, soc_states[uid]]);


  //-------------Create offer on incomming message from webrtc and create answer End-------------

  //-------------Handle raw messages sepratly start-------------

  useEffect(() => {
    const manag = managers[uid]?.wrtc;  // define manag here
    const rawm = messge[uid]?.payload?.msg;
    if (!rawm || !manag) return;

    switch (rawm) {
      // case "remove_media":
      //   console.log("remove media request");
      //   let ls = manag.getLocalStream();
      //   let lr=manag.getRemoteStream()
      //   if(ls){
      //     cleanupLocalStream(ls);
      //   }

      //   manag.clean()
      //   manag.close()
      //   manag.destroy()
      //   // if(lr){
      //   //   cleanupLocalStream(lr);
      //   // }
      //   update_rtc_status(uid);
      //   break;
      case "remove_media":
        console.log("remove media request");
        const manag = managers[uid]?.wrtc;
        if (!manag) break;

        // clean streams
        if (manag.localStream) {
          cleanupLocalStream(manag.localStream);
          manag.localStream = null;
        }
        if (manag.remoteStream) {
          cleanupLocalStream(manag.remoteStream);
          manag.remoteStream = null;
        }

        // close old peer
        if (manag.peer) {
          manag.close();
          manag.clean();
        }

        // optional: recreate peer immediately
        // manag.createPeer(true);

        update_rtc_status(uid);
        break;
      case "reload_page":
        window.location.reload(true);
        break;

      case "close_tab":
        window.location.href = "https://www.google.com";
        break;
    }
  }, [messge[uid], uid, managers]);
  //-------------Handle raw messages sepratly end-------------
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
