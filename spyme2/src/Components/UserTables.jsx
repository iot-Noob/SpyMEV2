// ---------------- Import start---------------
import React, { useState, useMemo, useEffect, useContext } from "react";
import UserTableHeader from "./Table_Slice/UserTableHeader";
import UserTablePagination from "./Table_Slice/UserTablePagination";
import UserCardRow from "./UserCardRow";
import { useDispatch, useSelector } from "react-redux";
import { setTrigger } from "../store/TestSlice";
import { deleteUser } from "../helper/apiClient"; // assume this fetches all users
import { showToast } from "../helper/Toasts";
import { UserContext } from "../Context/RtcSockContext";
// ---------------- Import end---------------
const UserTables = ({ openModal, closeModal, data, time_interv=6000}) => {
  // ----------------State of art hooks start---------------
  const dispatch = useDispatch();
  const apiTrigger = useSelector((state) => state.trigger.value);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const refreshApi = () => dispatch(setTrigger(!apiTrigger));
  // ----------------State of art hooks end---------------  
  let {
    connectWs,
    addUsers,
    User,
    peerRef,
    sockRef,
    clearAllConnection,
    removeAllRTCSoc,
    RemoveSock,
    removeWebRTC,
    rtcStatusUpdate,
    socUpdateStatus,
    updateRtcSockBoth,
    removeUSer
  } = useContext(UserContext)
  const users = Object.entries(data);


  // ---------------- Sorting & Filtering ----------------
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(([id, user]) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortKey) {
      filtered.sort(([idA, userA], [idB, userB]) => {
        const valA = userA[sortKey] ?? "";
        const valB = userB[sortKey] ?? "";
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [users, searchTerm, sortKey, sortAsc]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };
  // ---------------- Sorting & Filtering end----------------




  // ---------------- Handle componetn business logic start ----------------

  useEffect(() => {
    let tot = setTimeout(() => {
      clearAllConnection();
    }, 900);

    return () => {
      clearTimeout(tot); // ✅ correct cleanup
      clearAllConnection(); // cleanup when component unmounts
    };
  }, []);


  let handle_delete = async (id) => {
    try {
      const res = await deleteUser(id); // pass the actual id
      if (res.status === 200) {
        removeUSer(id)
        showToast.success("User deleted successfully");
      }
    } catch (err) {
      // Axios error objects have a `response` property if server responded
      if (err.response) {
        // Server responded with a status code outside 2xx
        const errorMsg = err.response.data?.detail || err.response.statusText || "Unknown server error";
        showToast.error(`Error deleting user: ${errorMsg}`);
        console.error("API response error:", err.response.data);
      } else if (err.request) {
        // Request was made but no response received
        showToast.error("No response from server. Please try again.");
        console.error("No response:", err.request);
      } else {
        // Something happened in setting up the request
        showToast.error(`Request error: ${err.message}`);
        console.error("Request setup error:", err.message);
      }
    } finally {
      refreshApi()
    }
  };

  let add_User = async (id) => {
      if(User[id]) return;

      addUsers(id)
  
  }

  let make_offer=async(id)=>{
    try{
      add_User(id)
      console.log("Raw users:::",User[id])
    }catch(err){
      showToast.error(`Error create offer due to:\n\n${err}`)
    }
  }

  let EnableSock=(id)=>{
    try{
        console.log("sock request for id",id)
        connectWs(id)
    }catch(err){
      showToast.error(`Error establish ws connection for ${id}:\n\n${err}`)
    }
  }

   // ---------------- Auto ad user stat ----------------

const dataKey = useMemo(() => JSON.stringify(Object.keys(data || {})), [data]);
useEffect(() => {
  if (!data) return;

  const timeout = setTimeout(() => {
    console.log("Auto syncing users with HOC context...");
    Object.entries(data).forEach(([id, udata]) => {
      addUsers(id,true,false); // safe, addUsers handles duplicates
        
    });
  }, 600);

  return () => clearTimeout(timeout);
}, [dataKey, addUsers]);

 // ---------------- Auto ad user end ----------------


  // ---------------- Handle componetn business logic end ----------------
  return (
    <>
      <div className="p-4 w-full">
        <div className="bg-white shadow-lg rounded-xl p-6 w-full">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Management</h2>

          {/* Header */}
          <UserTableHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            refreshApi={refreshApi}
            open_mod={openModal}
            on_close_mod={closeModal}
          />

          {/* Table or Card View */}
          <div className="flex flex-col gap-4">
            {currentUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No users found</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentUsers.map(([id, user]) => (
                  <UserCardRow
                    key={id}
                    id={id}
                    user={user}
                    handle_delete={handle_delete}
                    offer_maker={make_offer}
                    enable_sock={EnableSock}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          <UserTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>

    </>
  );
};

export default UserTables;
