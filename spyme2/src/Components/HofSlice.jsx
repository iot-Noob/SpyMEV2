import React from 'react'
import { FetchUsers } from '../HOC/FetchUsersData'
import UserTables from './UserTables'
 
import { AddData } from '../HOC/AddData'
 import { withRtcSock } from '../HOC/ContextHandler'
const EnhancedUserTables = AddData(FetchUsers(UserTables));
const UltraENhanceTable=withRtcSock(React.memo(EnhancedUserTables))
function HofSlice() {
  return (
    <>
       
        <UltraENhanceTable/>
      
    </>
  )
}

export default HofSlice
