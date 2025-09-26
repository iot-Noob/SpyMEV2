import React, { useState, useContext } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { UserContext } from "../Context/RtcSockContext";

// HOC for showing RTC details directly from context
export const withRtcEditor = (Component) => {
  const Wrapper = (props) => {
    const { rtc_contxt_data } = useContext(UserContext);
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const handle_editor_modal = (id) => {
      setSelectedId(id);
      setOpen(true);
    };

    // Helper to render JSON keys only if they exist
    const renderJson = (data, keys) => {
      if (!data) return <p className="italic text-gray-500">No data</p>;
      const filtered = {};
      keys.forEach((k) => {
        if (data[k] !== undefined) filtered[k] = data[k];
      });
      if (Object.keys(filtered).length === 0)
        return <p className="italic text-gray-500">No data</p>;
      return (
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
          {JSON.stringify(filtered, null, 2)}
        </pre>
      );
    };

    const selectedRtc = selectedId ? rtc_contxt_data[selectedId] : null;

    return (
      <>
        {/* Component can trigger modal */}
        <Component {...props} handle_rtc_modal={handle_editor_modal} />

        {/* Modal */}
        {open && (
          <dialog open className="modal">
            <div className="modal-box relative max-w-2xl">
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-center">
                RTC Details (User: {selectedId})
              </h2>

              <div className="py-4 text-sm space-y-4">
                <button className="">create sock</button>
                {!selectedRtc ? (
                  <p className="text-gray-500 italic">No RTC data available</p>
                ) : (
                  <>
                    {renderJson(selectedRtc, ["sdp", "ice", "answer_sdp", "answer_ice"])}
                  </>
                )}
              </div>
            </div>

            {/* Overlay */}
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
