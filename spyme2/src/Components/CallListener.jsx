import React, { useEffect, useRef } from "react";

const CallListener = ({ crtc, uid, isOpen, onClose }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!crtc || !isOpen) return;

    // get remote stream directly from manager
    const remoteStream = crtc?.getRemoteStream?.();
    console.log("remote_stream:::",remoteStream)
    if (remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
    }

    return () => {
      // cleanup
      const stream = audioRef.current?.srcObject;
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    };
  }, [crtc, isOpen]);

  if (!isOpen) return null;

  return (
<div className="modal modal-open">
  <div className="modal-box relative max-w-lg w-full">
    <button
      className="btn btn-sm btn-circle absolute right-2 top-2"
      aria-label="Close"
      onClick={onClose}
    >
      ✕
    </button>

    <h3 className="font-bold text-lg mb-4">
      Listening to User #{uid}
    </h3>

    <audio ref={audioRef} autoPlay controls className="w-full rounded" />

    <p className="mt-2 text-sm text-gray-500">
      Remote audio will play automatically if available.
    </p>
  </div>
</div>

  );
};

export default CallListener;
