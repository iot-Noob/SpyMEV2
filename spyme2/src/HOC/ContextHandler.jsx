// withRtcSock.js
import React from "react";
import RtcSockContext from "../Context/RtcSockContext";

export function withRtcSock(WrappedComponent, handlers = {},stun={}) {
  return function RtcSockWrapper(props) {
    return (
      <RtcSockContext handlers={handlers} stun={stun}>
        <WrappedComponent {...props} />
      </RtcSockContext>
    );
  };
}
