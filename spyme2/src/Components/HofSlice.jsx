import React from 'react'
import { FetchUsers } from '../HOC/FetchUsersData'
import UserTables from './UserTables'
 
import { AddData } from '../HOC/AddData'
import { withWsEditor } from '../HOC/WsEditor'
import { withRtcEditor } from '../HOC/withRtcEditor'
import { withAudio } from '../HOC/withAudioDummy'
 import { withRtcSock } from '../HOC/ContextHandler'
const EnhancedUserTables = AddData(FetchUsers(withWsEditor(withRtcEditor(withAudio((UserTables))))));
const UltraENhanceTable=withRtcSock(React.memo(EnhancedUserTables))
function HofSlice() {
  return (
    <>
       
        <UltraENhanceTable/>
      
    </>
  )
}

export default HofSlice
