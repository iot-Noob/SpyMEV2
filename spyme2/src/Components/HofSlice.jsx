import React from 'react'
import { FetchUsers } from '../HOC/FetchUsersData'
import UserTables from './UserTables'
import { AddData } from '../HOC/AddData'
import { RtcSockContext } from '../Context/RtcSockContext'


const EnhancedUserTables = AddData(FetchUsers(UserTables));
const Aet=RtcSockContext(EnhancedUserTables)
// const UltraENhanceTable=React.memo(EnhancedUserTables)
function HofSlice() {
  return (
    <>
       
        <Aet/>
      
    </>
  )
}

export default HofSlice
