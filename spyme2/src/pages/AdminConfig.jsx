import React from 'react'
import { FetchUsers } from '../HOC/FetchUsersData';
import UserTables from '../Components/UserTables'
 import { Actions } from '../HOC/Actions';
const EnhancedUserTables = Actions(FetchUsers(UserTables));
const AdminConfig = () => {


  return (
    <>
      <h2>Admin Config</h2>
        <EnhancedUserTables/>
    </>
  );
};


export default AdminConfig
