import React from "react";
import { ArrowPathIcon, PlusCircleIcon ,TrashIcon} from "@heroicons/react/24/solid";

const UserTableHeader = ({
  searchTerm,
  setSearchTerm,
  rowsPerPage,
  setRowsPerPage,
  openModal,
  refreshApi,
  clear_all_data,
  dam
}) => {
  return (
    <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
      {/* Search */}
      <input
        type="text"
        placeholder="Search username..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input input-sm input-bordered w-full md:w-1/3"
      />

      {/* Rows per page + actions */}
      <div className="flex gap-2 items-center flex-wrap">
        <select
          className="select select-sm w-full md:w-auto"
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
        <button
          className="btn btn-sm btn-outline flex items-center gap-1"
          title="Refresh table"
          onClick={()=>{refreshApi()}}
        >
          <ArrowPathIcon className="w-5 h-5" /> Refresh
        </button>
        <button
          className="btn btn-sm btn-outline flex items-center gap-1"
          title="Add new user"
          onClick={openModal}
        >
          <PlusCircleIcon className="w-5 h-5" /> Add User
        </button>
         <button
          className="btn btn-sm btn-outline flex items-center gap-1"
          title="Add new user"
          onClick={()=>{
            clear_all_data({});
            dam()
        
        }}
        >
          <TrashIcon className="w-5 h-5" /> Remove all sdp ice data
        </button>
      </div>
    </div>
  );
};

export default UserTableHeader;
