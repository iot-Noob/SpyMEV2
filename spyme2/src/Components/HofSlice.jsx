import React from 'react'
import { FetchUsers } from '../HOC/FetchUsersData'
import UserTables from './UserTables'
import { AddData } from '../HOC/AddData'
import { RtcSockContext } from '../Context/RtcSockContext'

// ✅ HOC chaining at module scope (not inside the component)
const EnhancedUserTables = AddData(FetchUsers(UserTables));
const Aet = RtcSockContext(EnhancedUserTables);

function HofSlice() {
  return (
    <>
      <Aet />  {/* just render once */}
    </>
  );
}

export default HofSlice;
