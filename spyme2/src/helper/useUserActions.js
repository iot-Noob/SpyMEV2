import { useDispatch, useSelector } from 'react-redux';
import { setTrigger } from '../store/TestSlice';

export const useUserActions = () => {
  const dispatch = useDispatch();
  const trigger = useSelector((state) => state.trigger.value);

  // --- Delete user ---
  const handleDelete = (id) => {
    console.log("Request made to delete id:", id);
    refreshApi();
  };

  // --- Refresh API ---
  const refreshApi = () => {
    dispatch(setTrigger(!trigger));
    console.log("API refresh triggered");
  };

  // --- Edit user ---
  const handleEdit = async (id) => {
    console.log("Edit request for id:", id);
  };

  // --- RTC SDP/ICE refresh ---
  const refreshRtc = async (id) => {
    console.log("RTC SDP/ICE refresh request for id:", id);
  };

  // --- WebSocket info ---
  const websocInfo = async (id) => {
    console.log("WebSocket info request for id:", id);
  };

  // --- Get RTC details ---
  const getRtcDetails = async (id) => {
    console.log("RTC SDP/ICE details request for id:", id);
  };

  // --- Handle call ---
  const handleCall = async (id) => {
    console.log("Call request for id:", id);
  };

  // --- Add new user ---
  const addUser = async () => {
    console.log("Add new user request");
  };

  return {
    handleDelete,
    refreshApi,
    handleEdit,
    refreshRtc,
    websocInfo,
    getRtcDetails,
    handleCall,
    addUser,
  };
};
