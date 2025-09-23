import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTrigger } from '../store/TestSlice';
import { useUserActions } from '../helper/useUserActions';
export const Actions = (Component) => {
  const Wrapper = (props) => {
   const {addUser,getRtcDetails,handleCall,handleDelete,handleEdit,refreshApi,refreshRtc,websocInfo}=useUserActions()
 
    return (
      <Component
        {...props}
        handle_delete={handleDelete}
        refresh_api={refreshApi}
        handle_edit={handleEdit}
        refresh_rtc={refreshRtc}
        websoc_info={websocInfo}
        get_rtc_details={getRtcDetails}
         handle_call={handleCall}
        add_new_user={addUser}
      />
    );
  };

  return Wrapper;
};
