import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

const UserTablePagination = ({ currentPage, totalPages, setCurrentPage }) => {
  return (
    <div className="mt-4 flex justify-center items-center gap-2">
      <button
        className="btn btn-sm"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((p) => p - 1)}
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      <span className="text-sm text-gray-700">
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
  );
};

export default UserTablePagination;
