import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

const UserTablePagination = ({ currentPage, totalPages, setCurrentPage }) => {
  return (
    <div className="mt-4 flex justify-center items-center gap-2">
      {/* Previous */}
      <button
        className="btn btn-sm btn-ghost p-2 hover:bg-gray-100 disabled:opacity-50"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((p) => p - 1)}
        title="Previous Page"
      >
        <ChevronLeftIcon className="w-5 h-5 text-indigo-500" />
      </button>

      {/* Current Page / Total */}
      <span className="text-sm text-gray-700 px-2 py-1 border border-gray-200 rounded-lg">
        Page <strong>{currentPage}</strong> of <strong>{totalPages || 1}</strong>
      </span>

      {/* Next */}
      <button
        className="btn btn-sm btn-ghost p-2 hover:bg-gray-100 disabled:opacity-50"
        disabled={currentPage === totalPages || totalPages === 0}
        onClick={() => setCurrentPage((p) => p + 1)}
        title="Next Page"
      >
        <ChevronRightIcon className="w-5 h-5 text-indigo-500" />
      </button>
    </div>
  );
};

export default UserTablePagination;
