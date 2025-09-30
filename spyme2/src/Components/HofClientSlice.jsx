import React from 'react'
import { FetchUsers } from '../HOC/FetchUsersData'
import { withRtcSock } from '../HOC/ContextHandler'
import ClientMain from './ClientMain'
let EhnanceComp=FetchUsers(withRtcSock(ClientMain))
const HofClientSlice = () => {
  return (
     <>
     <EhnanceComp/>
     </>
  )
}

export default HofClientSlice
