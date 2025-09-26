import React, { useState, useContext, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { UserContext } from "../Context/RtcSockContext";
import { createSignalingSocket } from "../helper/apiClient";

export const withWsEditor = (Component) => {
  const Wrapper = (props) => {
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const {managers,setCuid} = useContext(UserContext); 

    
const get_sock_data = (id) => {
  const cm = managers[id];
  if (!cm) return console.log("No manager found for", id);

  const ws = cm.wsoc;
  if (!ws) return console.log("No WebSocket open for", id);

   

  if (ws.readyState === WebSocket.OPEN) {
    ws.send_user_data("rec_data", JSON.stringify({}))
  }
  else ws.addEventListener("open", sendData, { once: true });
};


useEffect(()=>{
      get_sock_data(selectedId)

},[selectedId])
    const handle_editor_modal = (id) => {
      setSelectedId(id);
      setOpen(true);
  
    };
     
    
    return (
      <>
        <Component {...props} handle_editor_modal={handle_editor_modal} />

        {open && (
          <dialog open className="modal">
            <div className="modal-box relative">
              <button
                onClick={() => setOpen(false)}
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-center">
                WebSocket + WebRTC Info
              </h2>

            
            </div>

            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setOpen(false)}>close</button>
            </form>
          </dialog>
        )}
      </>
    );
  };

  return Wrapper;
};
