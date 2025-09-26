import React, { useContext, useEffect, useState } from "react";
import {
  TrashIcon, ArrowPathIcon, BoltIcon, EyeIcon,
  PhoneArrowDownLeftIcon, PhoneIcon, SignalIcon
} from "@heroicons/react/24/solid";
import { UserContext } from "../../Context/RtcSockContext";
const UserTableRow = ({ id, user, setCuid, cuid, refreshRtc, main_refresh, handle_del, establish_ws_conn, css, close_conn }) => {
  const { addManager, managers, soc_states } = useContext(UserContext);


  return (
    <tr
      key={id}
      className="hover:bg-indigo-50 transition-colors duration-200 odd:bg-white even:bg-gray-50"
    >
      <td className="px-4 py-2">{user?.username}</td>
      <td className="px-4 py-2">{user?.created_at}</td>
      <td className="px-4 py-2">{user?.updated_at || "-"}</td>
      <td className="flex flex-wrap gap-2 px-4 py-2">
        <button className="btn btn-sm btn-red flex items-center gap-1" title="Delete" onClick={() => { handle_del(id) }}>
          <TrashIcon className="w-4 h-4" /> Delete
        </button>
        <button
          disabled={css[id] !== "open"}
          hidden={css[id] !== "open"}
          className="btn btn-sm btn-outline flex items-center gap-1"
          title="Refresh row"
          onClick={() => { refreshRtc(id) }}
        >
          <ArrowPathIcon className="w-4 h-4" /> Refresh
        </button>
        <button
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
          // disabled={!manag[id]?.wsoc?.connect || manag[id].wsoc.connect.readyState !== WebSocket.OPEN} 
          className="btn btn-sm btn-outline flex items-center gap-1" title="View details">
          <EyeIcon className="w-4 h-4" /> View
        </button>
        <button
          disabled={css[id] !== "open"}
          hidden={css[id] !== "open"}
          className="btn btn-sm btn-outline flex items-center gap-1" title="Call">
          <PhoneIcon className="w-4 h-4" /> Call
        </button>
        <button
          disabled={css[id] !== "open"}
          hidden={css[id] !== "open"}
          className="btn btn-sm btn-outline flex items-center gap-1" title="Incoming Call">
          <PhoneArrowDownLeftIcon className="w-4 h-4" /> Incoming
        </button>
      </td>
    </tr>
  );
};

export default UserTableRow;
