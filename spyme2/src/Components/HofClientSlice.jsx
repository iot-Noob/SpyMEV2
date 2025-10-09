import React from 'react'
import { FetchUsers } from '../HOC/FetchUsersData'
import ClientMain from './ClientMain'
let EhnanceComp=FetchUsers(ClientMain)
const HofClientSlice = () => {
  return (
     <>
     <EhnanceComp/>
     </>
  )
}

export default HofClientSlice
