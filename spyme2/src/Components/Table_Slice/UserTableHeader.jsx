import React from "react";
import { ArrowPathIcon, PlusCircleIcon, TrashIcon } from "@heroicons/react/24/solid";

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
      <div className="flex-1 w-full md:w-1/3">
        <input
          type="text"
          placeholder="Search username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-sm input-bordered w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Rows per page + actions */}
      <div className="flex gap-2 items-center flex-wrap mt-2 md:mt-0">
        <select
          className="select select-sm w-full md:w-auto border-gray-300 focus:ring-1 focus:ring-indigo-400"
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>

        {/* Icon-only buttons for a cleaner UI */}
        <button
          className="btn btn-sm btn-ghost p-2 tooltip tooltip-bottom"
          data-tip="Refresh Table"
          onClick={refreshApi}
        >
          <ArrowPathIcon className="w-5 h-5 text-indigo-500" />
        </button>

        <button
          className="btn btn-sm btn-ghost p-2 tooltip tooltip-bottom"
          data-tip="Add New User"
          onClick={openModal}
        >
          <PlusCircleIcon className="w-5 h-5 text-green-500" />
        </button>

        <button
          className="btn btn-sm btn-ghost p-2 tooltip tooltip-bottom"
          data-tip="Clear All SDP/ICE Data"
          onClick={() => { clear_all_data({}); dam(); }}
        >
          <TrashIcon className="w-5 h-5 text-red-500" />
        </button>
      </div>
    </div>
  );
};

export default UserTableHeader;
