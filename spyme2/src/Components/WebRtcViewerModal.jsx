import React, { useRef, useEffect, useState } from "react";
import { XMarkIcon, SignalIcon, BoltIcon } from "@heroicons/react/24/solid";

const statusColor = {
  connected: "bg-green-500",
  connecting: "bg-orange-500",
  disconnected: "bg-red-500"
};

const WebRtcViewerModal = ({ isOpen, onClose, rtc_sdp_data, cid, rtc_statuses = [] }) => {
  const dialogRef = useRef(null);

   

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const statusObj = rtc_statuses.find((s) => s.userId === cid);
  const peerStatus = statusObj?.status?.peerConnectionState || "disconnected";

  const userData = rtc_sdp_data?.[cid] || {};

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 w-full max-w-3xl rounded-xl p-6 bg-white shadow-lg"
      style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
    >
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        onClick={onClose}
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      {/* RTC Status */}
      <div className="flex items-center mb-4">
        <span
          className={`w-3 h-3 rounded-full mr-2 ${statusColor[peerStatus]}`}
        ></span>
        <h2 className="text-xl font-semibold">RTC Status: {peerStatus}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* User Side */}
        {(userData.sdp || (userData.ice?.length > 0)) && (
          <div className="border p-4 rounded-lg bg-gray-50">
            <h3 className="flex items-center mb-2 font-semibold">
              <SignalIcon className="w-5 h-5 mr-1" /> User Side
            </h3>
            {userData.sdp && (
              <div className="mb-2">
                <span className="font-semibold">SDP:</span>
                <pre className="text-xs p-2 bg-white rounded shadow-inner overflow-x-auto">
                  {typeof userData.sdp === "string"
                    ? userData.sdp
                    : JSON.stringify(userData.sdp, null, 2)}
                </pre>
              </div>
            )}
            {userData.ice?.length > 0 && (
              <div>
                <span className="font-semibold">ICE:</span>
                <ul className="text-xs list-disc list-inside max-h-32 overflow-y-auto">
                  {userData.ice.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Answer Side */}
        {(userData.answer_sdp || (userData.answer_ice?.length > 0)) && (
          <div className="border p-4 rounded-lg bg-gray-50">
            <h3 className="flex items-center mb-2 font-semibold">
              <BoltIcon className="w-5 h-5 mr-1" /> Answer Side
            </h3>
            {userData.answer_sdp && (
              <div className="mb-2">
                <span className="font-semibold">SDP:</span>
                <pre className="text-xs p-2 bg-white rounded shadow-inner overflow-x-auto">
                  {userData.answer_sdp}
                </pre>
              </div>
            )}
            {userData.answer_ice?.length > 0 && (
              <div>
                <span className="font-semibold">ICE:</span>
                <ul className="text-xs list-disc list-inside max-h-32 overflow-y-auto">
                  {userData.answer_ice.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
};

export default WebRtcViewerModal;
