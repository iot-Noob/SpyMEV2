import { useEffect, useState, useCallback,memo,useMemo } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline"; // refresh icon
 
 const WebSocketStatusModal = ({ isOpen, onClose, uid, messages, cstat,ssh}) => {
  const [status, setStatus] = useState({
    is_active: false,
    is_master: false,
    has_slave: false,
    allGood: false,
  });
  // const latestMsg = messages[uid]?.[messages[uid].length - 1];
   const latestMsg = messages[uid];
 
  // reusable update function   
  const updateStatus = useCallback(() => {
    if (!uid) return;
    
    ssh(uid)
    const is_active = cstat[uid] === "open";
    const is_master = latestMsg?.sockets?.[uid]?.includes("master") ?? false;
    const has_slave = latestMsg?.sockets?.[uid]?.includes("slave") ?? false;
    const allGood = is_active && is_master && has_slave;

    setStatus({ is_active, is_master, has_slave, allGood });
  }, [uid, messages, cstat]);

useEffect(() => {
  if (isOpen) {
    ssh(uid)
    updateStatus();
  }
}, [isOpen, uid, cstat]); 

  if (!isOpen) return null;

  return (
    <dialog open className="modal modal-middle">
      <form
        method="dialog"
        className="modal-box max-w-md p-6 bg-white shadow-2xl rounded-2xl border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 text-center flex-1">
            WebSocket Status
          </h3>
          {/* refresh button */}
          <button
            type="button"
            onClick={updateStatus}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            title="Refresh"
          >
            <ArrowPathIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {status.allGood ? (
          <div className="flex flex-col items-center justify-center bg-green-50 p-6 rounded-xl shadow-md">
            <span className="text-lg font-semibold text-green-700">
              ✅ User {uid} is Active (Master + Slave connected)
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col bg-indigo-50 p-4 rounded-xl">
              <span className="text-sm text-gray-500">User ID</span>
              <span className="font-semibold text-gray-900">{uid}</span>
            </div>
            <div className="flex flex-col bg-green-50 p-4 rounded-xl">
              <span className="text-sm text-gray-500">Active</span>
              <span
                className={`font-semibold ${
                  status.is_active ? "text-green-600" : "text-red-500"
                }`}
              >
                {status.is_active ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex flex-col bg-yellow-50 p-4 rounded-xl">
              <span className="text-sm text-gray-500">Is Master</span>
              <span
                className={`font-semibold ${
                  status.is_master ? "text-yellow-600" : "text-gray-400"
                }`}
              >
                {status.is_master ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex flex-col bg-purple-50 p-4 rounded-xl">
              <span className="text-sm text-gray-500">Has Slave</span>
              <span
                className={`font-semibold ${
                  status.has_slave ? "text-purple-600" : "text-gray-400"
                }`}
              >
                {status.has_slave ? "Yes" : "No"}
              </span>
            </div>
          </div>
        )}

        <div className="modal-action justify-center">
          <button
            type="button"
            className="btn btn-primary btn-wide rounded-full"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </form>
    </dialog>
  );
};
export default memo(WebSocketStatusModal)