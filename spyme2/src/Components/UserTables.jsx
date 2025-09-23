import React, { useState, useMemo } from 'react';
import { 
  ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon, 
  TrashIcon, ArrowPathIcon, BoltIcon, EyeIcon, PencilIcon, 
  PhoneArrowDownLeftIcon,
  PhoneIcon,
  PlusCircleIcon
} from '@heroicons/react/24/solid';
import { useSelector, useDispatch } from 'react-redux';
import { setTrigger } from '../store/TestSlice';

const UserTables = ({ data = {} ,handle_delete,refresh_api,handle_edit,refresh_rtc,websoc_info,get_rtc_details,handle_call,add_new_user}) => {
  const users = Object.entries(data);

  // --- Pagination & State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  const selector = useSelector((state) => state.trigger);
  const dispatch = useDispatch();

  // --- Filtered & Sorted Users ---
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(([id, user]) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortKey) {
      filtered.sort(([idA, userA], [idB, userB]) => {
        const valA = userA[sortKey] ?? '';
        const valB = userB[sortKey] ?? '';
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [users, searchTerm, sortKey, sortAsc]);

  // --- Pagination Slice ---
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // --- Handlers ---
  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const getSortIcon = (key) => {
    if (sortKey !== key) return null;
    return sortAsc ? (
      <ArrowUpIcon className="inline w-4 h-4 ml-1" />
    ) : (
      <ArrowDownIcon className="inline w-4 h-4 ml-1" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-base-content/10 bg-base-100 p-4 w-full">
      {/* Search & Rows per Page */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <input
          type="text"
          placeholder="Search username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-sm input-bordered w-full md:w-1/3"
        />
        <div className="flex gap-2 items-center">
          <select
            className="select select-sm w-full md:w-auto"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </select>
          <button className="btn btn-sm btn-outline" title="Refresh table" onClick={()=>{refresh_api()}}>
            <ArrowPathIcon className="w-5 h-5" />
          </button>
             <button className="btn btn-sm btn-outline" title="Refresh table" onClick={()=>{add_new_user()}}>
            <PlusCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <table className="table w-full text-sm md:text-base">
        <thead className="bg-gray-100">
          <tr>
            <th onClick={() => handleSort('username')} className="cursor-pointer">
              Username {getSortIcon('username')}
            </th>
            <th onClick={() => handleSort('created_at')} className="cursor-pointer">
              Created At {getSortIcon('created_at')}
            </th>
            <th onClick={() => handleSort('updated_at')} className="cursor-pointer">
              Updated At {getSortIcon('updated_at')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-2">
                No users found
              </td>
            </tr>
          ) : (
            currentUsers.map(([id, user]) => (
              <tr key={id} className="hover:bg-gray-50">
                <td>{user?.username}</td>
                <td>{user?.created_at}</td>
                <td>{user?.updated_at || '-'}</td>
                <td className="flex flex-wrap gap-2">
                  <button className="btn btn-sm btn-primary" title="Edit" onClick={()=>{handle_edit(id)}}>
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={()=>{handle_delete(id)}} className="btn btn-sm btn-error" title="Delete">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <button className="btn btn-sm btn-outline" title="Refresh row" onClick={()=>{refresh_rtc(id)}}>
                    <ArrowPathIcon className="w-4 h-4" />
                  </button>
                  <button className="btn btn-sm btn-outline" title="Trigger WebSocket" onClick={()=>{websoc_info(id)}}>
                    <BoltIcon className="w-4 h-4" />
                  </button>
                  <button className="btn btn-sm btn-outline" title="View details" onClick={()=>{get_rtc_details(id)}}>
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button className="btn btn-sm btn-outline" title="View details" onClick={()=>{handle_call(id)}}>
                    <PhoneIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-center items-center gap-2">
        <button
          className="btn btn-sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <span className="text-sm">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          className="btn btn-sm"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default UserTables;
