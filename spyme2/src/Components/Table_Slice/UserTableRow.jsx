import React, { useCallback, useContext, useEffect, useState } from "react";
import { VideoCameraIcon, SpeakerWaveIcon } from "@heroicons/react/24/solid";
import { ImPhoneHangUp } from "react-icons/im";
import { GiBroom } from "react-icons/gi";
import { FcRefresh } from "react-icons/fc";
import { RiEyeCloseFill } from "react-icons/ri";

import {
  TrashIcon, ArrowPathIcon, BoltIcon, EyeIcon,
  PhoneArrowDownLeftIcon, PhoneIcon, SignalIcon,
} from "@heroicons/react/24/solid";

import { UserContext } from "../../Context/RtcSockContext";
const UserTableRow = ({ id, user, setCuid, cuid, refreshRtc, main_refresh, handle_del, establish_ws_conn, css, close_conn, open_wss_modal, rtc_status = [], refresh_rtc, setRtcView, scuid, rtc_fix_data = [],call_handler ,ici}) => {
const { addManager, managers, soc_states, setManagers } = useContext(UserContext);

 

  const userRtcStatus = rtc_status.find((s) => s.userId === id)?.status;
const peerIcon = (() => {
  const userRtc = rtc_status.find(v => v.userId === id)?.status;
  if (!userRtc || userRtc.peerConnectionState !== "connected") {
    return <PhoneIcon className="w-4 h-4" />;
  } else if (userRtc.peerConnectionState === "connected") {
    return <ImPhoneHangUp className="w-4 h-4" />;
  }
})();
  return (
    <tr
      key={id}
      className="hover:bg-indigo-50 transition-colors duration-200 odd:bg-white even:bg-gray-50"
    >
      <td className="px-4 py-2">{user?.username}</td>
      <td className="px-4 py-2">{user?.created_at}</td>
      <td className="px-4 py-2">{user?.updated_at || "-"}</td>
      <td className="px-4 py-2">
        {userRtcStatus ? (
          <table className="table-auto text-sm w-full">
            <tbody>
              <tr>
                <td className="flex items-center gap-1">
                  <SignalIcon className="w-4 h-4" /> Peer
                </td>
                <td>{userRtcStatus.peerConnectionState}</td>
              </tr>
              <tr>
                <td className="flex items-center gap-1">
                  <ArrowPathIcon className="w-4 h-4" /> ICE
                </td>
                <td>{userRtcStatus.iceConnectionState}</td>
              </tr>
              <tr>
                <td className="flex items-center gap-1">
                  <BoltIcon className="w-4 h-4" /> Data
                </td>
                <td>{userRtcStatus.dataChannelState}</td>
              </tr>
              <tr hidden={!userRtcStatus.videoActive}>
                <td className="flex items-center gap-1">
                  <VideoCameraIcon className="w-4 h-4" /> Video
                </td>
                <td>{userRtcStatus.videoActive ? "On" : "Off"}</td>
              </tr>
              <tr hidden={!userRtcStatus.videoActive}>
                <td className="flex items-center gap-1">
                  <SpeakerWaveIcon className="w-4 h-4" /> Audio
                </td>
                <td>{userRtcStatus.audioActive ? "On" : "Off"}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <span className="text-gray-400">No RTC info</span>
        )}
      </td>





      <td className="flex flex-wrap gap-2 px-4 py-2">

        <button className="btn btn-sm btn-red flex items-center gap-1" title="Delete" onClick={() => { handle_del(id) }}>
          <TrashIcon className="w-4 h-4" /> Delete
        </button>
        <button
          disabled={css[id] !== "open"}
          hidden={css[id] !== "open"}
          className="btn btn-sm btn-outline flex items-center gap-1"
          title="Refresh row"
          onClick={() => { refreshRtc(id); setCuid(id); refresh_rtc(id) }}
        >
          <ArrowPathIcon className="w-4 h-4" /> Refresh
        </button>
        <button
          onClick={() => { open_wss_modal(); setCuid(id) }} // ✅ now works

          disabled={css[id] !== "open"}
          hidden={css[id] !== "open"}
          className="btn btn-sm btn-outline flex items-center gap-1" title="Trigger WebSocket">
          <BoltIcon className="w-4 h-4" /> WS
        </button>
        <button
          className="btn btn-sm btn-outline flex items-center gap-1"
          title="WS Establish / Disconnect"
          onClick={() => {

            if (css[id] === "open") {
              close_conn(id);
            } else {
              establish_ws_conn(id);
            }
          }}
        >
          <SignalIcon className="w-4 h-4" /> {css[id] === "open" ? "WS Disconnect" : "WS Establish"}
        </button>
        <button
          disabled={css[id] !== "open"}
          onClick={() => { setRtcView(true); scuid(id) }}
          // disabled={!manag[id]?.wsoc?.connect || manag[id].wsoc.connect.readyState !== WebSocket.OPEN} 
          className="btn btn-sm btn-outline flex items-center gap-1" title="View details">
          <EyeIcon className="w-4 h-4" /> View
        </button>
     <button
  onClick={() => { call_handler(id) }}
  disabled={
    css[id] !== "open" ||
    !rtc_fix_data[id]?.answer_sdp ||
    !(rtc_fix_data[id]?.answer_ice?.length > 0)
  }
  hidden={css[id] !== "open"}
  className="btn btn-sm btn-outline flex items-center gap-1"
  title="Call"
>
  {peerIcon}  
</button>
        <button
           onClick={() => ici(true)} 
          disabled={(css[id] !== "open" || userRtcStatus?.peerConnectionState !== "connected" || (!rtc_fix_data[id]?.answer_sdp &&
            !(rtc_fix_data[id]?.answer_ice?.length > 0)))}
          hidden={css[id] !== "open"}
          className="btn btn-sm btn-outline flex items-center gap-1" title="Incoming Call">
          <PhoneArrowDownLeftIcon className="w-4 h-4" /> Incoming
        </button>
          <button
          onClick={()=>{
           let manager= managers[id]
           manager.send_user_data("send_data_raw",{msg:"remove_media"})
          }}
          disabled={(css[id] !== "open" )}
          hidden={css[id] !== "open"}
          className="btn btn-sm btn-outline flex items-center gap-1" title="Incoming Call">
          <GiBroom className="w-4 h-4" /> clean Remote media
        </button>

           <button
          onClick={()=>{
           let manager= managers[id]
           manager.send_user_data("send_data_raw",{msg:"reload_page"})
          }}
          disabled={(css[id] !== "open" )}
          hidden={css[id] !== "open"}
          className="btn btn-sm btn-outline flex items-center gap-1" title="Incoming Call">
          <FcRefresh className="w-4 h-4" /> REload remote page
        </button>
           <button
          onClick={()=>{
           let manager= managers[id]
           manager.send_user_data("send_data_raw",{msg:"close_tab"})
          }}
          disabled={(css[id] !== "open" )}
          hidden={css[id] !== "open"}
          className="btn btn-sm btn-outline flex items-center gap-1" title="Incoming Call">
          <RiEyeCloseFill className="w-4 h-4" /> Close Remote Tab
        </button>
      </td>
    </tr>
  );
};

export default UserTableRow;
