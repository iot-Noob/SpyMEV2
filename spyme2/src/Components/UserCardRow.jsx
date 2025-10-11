import React,{useContext} from "react";
import { 
  VideoCameraIcon, SpeakerWaveIcon, SignalIcon, ArrowPathIcon, 
  BoltIcon, EyeIcon, PhoneArrowDownLeftIcon, PhoneIcon 
} from "@heroicons/react/24/solid";
import { ImPhoneHangUp } from "react-icons/im";
import { MdDelete } from "react-icons/md";
import { GiBroom } from "react-icons/gi";
import { FcRefresh } from "react-icons/fc";
import { RiEyeCloseFill } from "react-icons/ri";
import { SiWebrtc } from "react-icons/si";
import { UserContext } from "../Context/RtcSockContext";
const UserCardRow = ({ id, user,handle_delete,offer_maker,enable_sock}) => {
  // Placeholder for RTC status
  const userRtcStatus = {
    peerConnectionState: "disconnected",
    iceConnectionState: "new",
    dataChannelState: "closed",
    videoActive: false,
  };
  let {
    updateRtcSockBoth,
    User,
    peerRef,
    sockRef
  }=useContext(UserContext)
  const peerIcon = userRtcStatus.peerConnectionState === "connected"
    ? <ImPhoneHangUp className="w-5 h-5 text-green-500" />
    : <PhoneIcon className="w-5 h-5 text-red-500" />;

  // Placeholder for CSS sock state
  const connectionState = "Disconnected";

  return (
    <div className="relative card bg-white shadow-md rounded-lg border border-gray-200 mb-3 p-3 hover:bg-gray-50 transition-all">
      
      {/* Top Right: Delete + Connection Status */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <span className={`badge ${connectionState === "Connected" ? "badge-success" : "badge-error"} text-xs`}>
          {connectionState}
        </span>
        <button onClick={()=>{handle_delete(id)}} title="Delete" className="text-red-500 hover:text-red-700">
          <MdDelete className="w-5 h-5" />
        </button>
      </div>

      {/* Header */}
      <div className="mb-2">
        <h3 className="font-semibold text-md">{user?.username}</h3>
        <p className="text-gray-400 text-xs">
          Created: {user?.created_at} | Updated: {user?.updated_at || "-"}
        </p>
      </div>

      {/* RTC Status Badges */}
      <div className="flex flex-wrap gap-1 text-xs mb-2">
        <span className={`badge ${userRtcStatus.peerConnectionState === "connected" ? "badge-success" : "badge-error"} flex items-center gap-1`}>
          <SignalIcon className="w-4 h-4" /> {userRtcStatus.peerConnectionState}
        </span>
        <span className="badge badge-info flex items-center gap-1">
          <ArrowPathIcon className="w-4 h-4" /> {userRtcStatus.iceConnectionState}
        </span>
        <span className="badge badge-warning flex items-center gap-1">
          <BoltIcon className="w-4 h-4" /> {userRtcStatus.dataChannelState}
        </span>
        {userRtcStatus.videoActive && (
          <>
            <span className="badge badge-outline flex items-center gap-1">
              <VideoCameraIcon className="w-4 h-4" /> On
            </span>
            <span className="badge badge-outline flex items-center gap-1">
              <SpeakerWaveIcon className="w-4 h-4" /> On
            </span>
          </>
        )}
      </div>

      {/* Action Icons (UI only, no handlers) */}
      <div className="flex flex-wrap gap-2 text-sm">
        <button
        disabled={User[id]?.sock_status!=="open"}
         onClick={()=>{offer_maker(id)}}
          className="btn btn-ghost btn-sm p-1"
           title="Create Offer">
          <SiWebrtc className="w-5 h-5" />
        </button>
        <button 
         disabled={User[id]?.sock_status!=="open"}
        className="btn btn-ghost btn-sm p-1" 
        title="WebSocket">
          <BoltIcon className="w-5 h-5" />
        </button>
        <button onClick={()=>{enable_sock(id)}} className="btn btn-ghost btn-sm p-1" title="WS Connect/Disconnect">
          <SignalIcon className="w-5 h-5" />
        </button>
        <button className="btn btn-ghost btn-sm p-1" title="View RTC">
          <EyeIcon className="w-5 h-5" />
        </button>
        <button 
         disabled={User[id]?.sock_status!=="open"}
        className="btn btn-ghost btn-sm p-1"
         title="Call">
          {peerIcon}
        </button>
        <button  disabled={User[id]?.sock_status!=="open"} className="btn btn-ghost btn-sm p-1" title="Incoming Call">
          <PhoneArrowDownLeftIcon className="w-5 h-5" />
        </button>
        <button  disabled={User[id]?.sock_status!=="open"} className="btn btn-ghost btn-sm p-1" title="Clean Media">
          <GiBroom className="w-5 h-5" />
        </button>
        <button  disabled={User[id]?.sock_status!=="open"} className="btn btn-ghost btn-sm p-1" title="Reload Page">
          <FcRefresh className="w-5 h-5" />
        </button>
        <button  disabled={User[id]?.sock_status!=="open"} className="btn btn-ghost btn-sm p-1" title="Close Tab">
          <RiEyeCloseFill className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(UserCardRow);
