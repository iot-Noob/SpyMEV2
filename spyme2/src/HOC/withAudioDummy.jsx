import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

// HOC: dummy audio modal (no getUserMedia, just a friendly mock)
export const withAudio = (Component) => {
  const Wrapper = (props) => {
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const handle_audio_modal = (id) => {
      setSelectedId(id);
      setOpen(true);
    };

    const closeModal = () => {
      setOpen(false);
      setSelectedId(null);
    };

    return (
      <>
        {/* Injected component can call handle_audio_modal */}
        <Component {...props} handle_audio_modal={handle_audio_modal} />

        {/* Modal */}
        {open && (
          <dialog open className="modal">
            <div className="modal-box relative max-w-lg">
              {/* Close button */}
              <button
                onClick={closeModal}
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                aria-label="Close audio modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-center">
                Audio Test (Dummy) — ID: {selectedId}
              </h2>

              <div className="py-4 text-sm">
                <p className="text-gray-600">
                  This is a dummy modal for audio testing. No microphone is accessed — it’s just a mock UI.
                </p>

                <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-500">
                  Use this modal to simulate opening an audio listener UI in your app.
                </div>
              </div>

              <div className="modal-action">
                <button className="btn btn-sm" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>

            {/* Overlay/backdrop */}
            <form method="dialog" className="modal-backdrop" onClick={closeModal}>
              <button style={{ display: "none" }}>close</button>
            </form>
          </dialog>
        )}
      </>
    );
  };

  return Wrapper;
};
