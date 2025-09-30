import React, { useState, useMemo, useContext, useRef, useEffect } from "react";
import { UserContext } from "../Context/RtcSockContext";
import UserTableHeader from "./Table_Slice/UserTableHeader";
import UserTableRow from "./Table_Slice/UserTableRow";
import UserTablePagination from "./Table_Slice/UserTablePagination";
import { useDispatch, useSelector } from "react-redux";
import { deleteUser } from "../helper/apiClient";
import { showToast } from "../helper/Toasts";
import toast from "daisyui/components/toast";
import { setTrigger } from "../store/TestSlice";
import { addLocalMedia } from "../helper/LocalStreamer";
import WebSocketStatusModal from "./WebSocketStatusModal";
import WebRtcViewerModal from "./WebRtcViewerModal";
import CallListener from "./CallListener";
const UserTables = ({ openModal, closeModal, data = {}, handlers = {} }) => {
 const { 
  cuid, setCuid, addManager, managers, destroy_manager, 
   destroy_all_managers, rtc_contxt_data, set_rtc_contxt, 
   soc_contxt, soc_states, messge, rtc_status, update_rtc_status,
   setManagers, setSocState 
 } = useContext(UserContext);
  const users = Object.entries(data);
  let dispatch = useDispatch()
  let api_rr = useSelector((state) => state.trigger.value)
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [om, Som] = useState(false)
  let [rtcV, setRtcV] = useState(false)
  let [id, cid] = useState()
  let [rtcData, setRtcData] = useState({})
  let [callMOdal,setCallModal]=useState(false)
  const update_all_rtc_data = () => {
    Object.keys(data).forEach(update_rtc_status);
  };
  useEffect(() => {
    destroy_all_managers()

  }, [])

  useEffect(() => {
    const msg = messge?.[cuid];

    if (msg?.type === "slave" && msg?.payload) {
      console.log("✅ Answer candidate received", msg);

      setRtcData((prev) => {
        const existing = prev[cuid] || {};

        return {
          ...prev,
          [cuid]: {
            ...existing,
            // update only if present
            answer_sdp: msg.payload.answer_sdp ?? existing.answer_sdp,
            answer_ice: Array.isArray(msg.payload.answer_ice)
              ? msg.payload.answer_ice
              : existing.answer_ice || [],
          },
        };
      });
    }
  }, [messge, cuid]);



  let refresh_api = () => {
    dispatch(setTrigger(!api_rr))
    update_all_rtc_data()

  }

  let handle_delete = async (id) => {
    try {
      const res = await deleteUser(Number(id));

      if (res.status === 200) {
        showToast.success("User deleted successfully");
        refresh_api()
      } else {
        showToast.error(res.data?.detail || "Failed to delete user");
      }
    } catch (err) {
      if (err.response) {
        const detail = err.response.data?.detail;
        const message = typeof detail === "string"
          ? detail
          : JSON.stringify(detail); // 👈 handles objects/arrays
        showToast.error(`Error: ${message}`);
      } else if (err.message) {
        showToast.error(`Network error: ${err.message}`);
      } else {
        showToast.error("Unknown error occurred while deleting user");
      }
    }
  };

  let create_offer = async (id) => {
    console.log("Creating offer for user:", id);
    setCuid(id);

    // Ensure manager + socket exists
    let cusc = soc_contxt[id];
    if (!cusc || cusc.readyState !== WebSocket.OPEN) {
      addManager(id, "master");
      cusc = soc_contxt[id];

      // Wait for socket to open
      await new Promise((resolve) => {
        if (cusc.readyState === WebSocket.OPEN) return resolve();
        cusc.addEventListener("open", () => resolve(), { once: true });
      });
    }

    // Now safe to access manager
    const manager = managers[id];
    if (!manager || !manager.wrtc) return;

    try {
      manager.wrtc.createPeer(true)
      // 1️⃣ Attach local media before creating offer
      const localStream = await addLocalMedia(manager.wrtc.peer, { audio: true, video: false });
      console.log("Local media ready:", localStream);


      // 2️⃣ Create WebRTC offer
      const offer = await manager.wrtc.createOffer();
      const iceStrings = manager.wrtc.iceCandidates.map(c => c.candidate);
      setRtcData(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          sdp: offer.sdp,        // just keep sdp string
          ice: iceStrings || []
        }
      }));
      // 3️⃣ Send offer + ICE to peer
      cusc.send(JSON.stringify({
        action: "send_data",
        payload: { sdp: offer.sdp, ice: iceStrings }
      }));
    } catch (err) {
      console.error("Failed to attach local media or create offer:", err);
    }
  };

  let open_ws_conn = async (id) => {
    console.log("Establishing WebSocket connection for user ID:", id);

    // Check if socket already exists and is open
    let ws = soc_contxt[id];
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log("WebSocket already open for user", id);
      return ws;
    }

    // If not, create and store it
    addManager(id, "master"); // assumes this creates manager + socket
    ws = soc_contxt[id];

    if (!ws) {
      console.error("Failed to create WebSocket for user", id);
      return null;
    }

    // Wait until socket is open
    await new Promise((resolve, reject) => {
      if (ws.readyState === WebSocket.OPEN) return resolve();

      ws.addEventListener("open", () => {
        console.log("WebSocket open for user", id);
        resolve();
      }, { once: true });

      ws.addEventListener("error", (err) => reject(err), { once: true });
    });

    return ws;
  };
  let close_ws_connection = (id) => {
    destroy_manager(id)
  };

  let hcm = () => {
    Som(false)
  }

  let handle_soc_stats = (id) => {
    const managerObj = managers[id];
    if (!managerObj) return;

    // Check if socket is open
    if (soc_states[id] === "open") {
      const wrtc = managerObj.wrtc;
      managerObj.send_user_data("get_socks")
      let msgs = messge[id]?.[messge[id].length - 1]

      cid(id)
      return msgs ? msgs : {}
    }
  };

  // Filtering & sorting
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

  let rtc_vc = () => {
    if (rtcV) {
      setRtcV(false)
    }

  }
  let handle_call = async (id) => {
    console.log("handle call for id:", id);

    const manag = managers[id];
    if (!manag || !manag.wrtc) return;

    const rtcEntry = rtc_status.find(v => v.userId === id); // find first match
    const pcs = rtcEntry?.status?.peerConnectionState;

    if (pcs !== "connected") {
      const asdp = messge[id]?.payload?.answer_sdp;
      const aice = messge[id]?.payload?.answer_ice;

      if (!asdp || !aice || aice.length === 0) {
        console.warn("No remote SDP or ICE available for user:", id);
        return;
      }

      try {
        const answer = await manag.wrtc.createAnswer(
          { type: "offer", sdp: asdp }, // remote offer
          aice                        // remote ICE candidates
        );
        console.log("✅ Answer generated for user:", id, answer);
      } catch (err) {
        showToast.error(`Error occur create answer ${err}`)
        console.error("Failed to create answer for user:", id, err);
      }
    }
    if (pcs === "connected") {
      manag.wrtc.close()
      manag.wrtc.destroy()
    }
  };


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
            openModal={openModal}
            refreshApi={refresh_api}
            dam={destroy_all_managers}
            clear_all_data={setRtcData}
          />

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="table w-full text-sm md:text-base border border-gray-200 rounded-lg">
              <thead className="bg-indigo-100 text-gray-700 uppercase">
                <tr>
                  <th onClick={() => handleSort("username")} className="cursor-pointer px-4 py-2">
                    Username
                  </th>
                  <th onClick={() => handleSort("created_at")} className="cursor-pointer px-4 py-2">
                    Created At
                  </th>
                  <th onClick={() => handleSort("updated_at")} className="cursor-pointer px-4 py-2">
                    Updated At
                  </th>
                  <th onClick={() => handleSort("updated_at")} className="cursor-pointer px-4 py-2">
                    RTC Stauts
                  </th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  currentUsers.map(([id, user]) => (
                    <UserTableRow
                      rtc_status={rtc_status}
                      key={id}
                      id={id}
                      user={user}
                      setCuid={setCuid}
                      cuid={cuid}
                      refreshRtc={() => { create_offer(id) }}
                      main_refresh={refresh_api}
                      handle_del={handle_delete}
                      establish_ws_conn={open_ws_conn}
                      css={soc_states}
                      close_conn={close_ws_connection}
                      open_wss_modal={() => {
                        Som(true);
                        handle_soc_stats(id)
                      }}

                      refresh_rtc={update_rtc_status}
                      setRtcView={setRtcV}
                      scuid={setCuid}
                      rtc_fix_data={rtcData}
                      call_handler={handle_call}
                       ici={()=>{setCallModal(true);setCuid(id)}}

                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <UserTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>

      </div>

      <WebSocketStatusModal
        isOpen={om}
        onClose={hcm}
        uid={cuid}   // use cuid directly
        messages={messge} // pass all ws messages
        cstat={soc_states}
        ssh={handle_soc_stats}
      />
      <WebRtcViewerModal
        isOpen={rtcV}
        onClose={rtc_vc}
        rtc_sdp_data={rtcData}
        cid={cuid}
        rtc_statuses={rtc_status}

      />
      <CallListener
      crtc={managers[cuid]?.wrtc}
      uid={cuid}
      isOpen={callMOdal}
      onClose={()=>{setCallModal(false);}}
      />
    </>
  );
};

export default UserTables;
