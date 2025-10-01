import React, { useContext } from "react";
import { 
  VideoCameraIcon, SpeakerWaveIcon, SignalIcon, ArrowPathIcon, 
  BoltIcon, EyeIcon 
} from "@heroicons/react/24/solid";
import { ImPhoneHangUp } from "react-icons/im";
import { GiBroom } from "react-icons/gi";
import { FcRefresh } from "react-icons/fc";
import { RiEyeCloseFill } from "react-icons/ri";
import { SiWebrtc } from "react-icons/si";
import { PhoneArrowDownLeftIcon, PhoneIcon } from "@heroicons/react/24/solid";
import { useAutoRtcStatus } from "../helper/useAutoRtcStatus";
import { UserContext } from "../Context/RtcSockContext";
import { MdDelete } from "react-icons/md";

const UserCardRow = ({
  id, user, setCuid, cuid, refreshRtc, handle_del, 
  establish_ws_conn, css, close_conn, open_wss_modal, 
  rtc_status = [], refresh_rtc, setRtcView, scuid, rtc_fix_data = [], 
  call_handler, ici
}) => {
  const { managers, update_rtc_status } = useContext(UserContext);
  useAutoRtcStatus(id, update_rtc_status, 1000);

  const userRtcStatus = rtc_status.find((s) => s.userId === id)?.status;

  const peerIcon = (() => {
    if (!userRtcStatus || userRtcStatus.peerConnectionState !== "connected") {
      return <PhoneIcon className="w-5 h-5 text-red-500" />;
    } else {
      return <ImPhoneHangUp className="w-5 h-5 text-green-500" />;
    }
  })();

  return (
    <div className="relative card bg-white shadow-md rounded-lg border border-gray-200 mb-3 p-3 hover:bg-gray-50 transition-all">
       {/* Top Right: Delete + Connection Status */}
  <div className="absolute top-2 right-2 flex items-center gap-2">
    <span className={`badge ${css[id] === "open" ? "badge-success" : "badge-error"} text-xs`}>
      {css[id] === "open" ? "Connected" : "Disconnected"}
    </span>
    <button
      onClick={() => handle_del(id)}
      title="Delete"
      className="text-red-500 hover:text-red-700"
    >
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
  {userRtcStatus ? (
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
  ) : (
    <span className="text-gray-400 text-xs">No RTC info</span>
  )}

      {/* Action Icons */}
      <div className="flex flex-wrap gap-2 text-sm">
        <button className="btn btn-ghost btn-sm p-1" disabled={css[id] !== "open"} onClick={() => { refreshRtc(id); setCuid(id); refresh_rtc(id) }} title="Create Offer">
          <SiWebrtc className="w-5 h-5" />
        </button>

        <button className="btn btn-ghost btn-sm p-1" disabled={css[id] !== "open"} onClick={() => { open_wss_modal(); setCuid(id); }} title="WebSocket">
          <BoltIcon className="w-5 h-5" />
        </button>

        <button className="btn btn-ghost btn-sm p-1" onClick={() => { setCuid(id); css[id] === "open" ? close_conn(id) : establish_ws_conn(id); }} title="WS Connect/Disconnect">
          <SignalIcon className="w-5 h-5" />
        </button>

        <button className="btn btn-ghost btn-sm p-1" onClick={() => { setRtcView(true); scuid(id); }} title="View RTC">
          <EyeIcon className="w-5 h-5" />
        </button>

        <button className="btn btn-ghost btn-sm p-1" disabled={css[id] !== "open" || !rtc_fix_data[id]?.answer_sdp || !(rtc_fix_data[id]?.answer_ice?.length > 0)} onClick={() => { call_handler(id); setCuid(id); }} title="Call">
          {peerIcon}
        </button>

        <button className="btn btn-ghost btn-sm p-1" disabled={css[id] !== "open" || userRtcStatus?.peerConnectionState !== "connected" || (!rtc_fix_data[id]?.answer_sdp && !(rtc_fix_data[id]?.answer_ice?.length > 0))} onClick={() => { ici(true); setCuid(id); }} title="Incoming Call">
          <PhoneArrowDownLeftIcon className="w-5 h-5" />
        </button>

        <button className="btn btn-ghost btn-sm p-1" disabled={css[id] !== "open"} onClick={() => managers[id]?.send_user_data("send_data_raw", { msg: "remove_media" })} title="Clean Media">
          <GiBroom className="w-5 h-5" />
        </button>

        <button className="btn btn-ghost btn-sm p-1" disabled={css[id] !== "open"} onClick={() => managers[id]?.send_user_data("send_data_raw", { msg: "reload_page" })} title="Reload Page">
          <FcRefresh className="w-5 h-5" />
        </button>

        <button className="btn btn-ghost btn-sm p-1" disabled={css[id] !== "open"} onClick={() => managers[id]?.send_user_data("send_data_raw", { msg: "close_tab" })} title="Close Tab">
          <RiEyeCloseFill className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(UserCardRow);
