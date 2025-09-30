import React, { useState } from "react";

const Dropdown = ({ cid, Scid, data, hid, rfad }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (id) => {
    Scid(id);          // ✅ set selected user id
    setOpen(false);    // ✅ close dropdown after select
    rfad()
  };

  return (
    <>
      {
        !hid && (
          <div className="flex justify-center items-center h-screen">
            <div className="dropdown relative">
              <button
                className="btn m-1"
                onClick={() => {
                  setOpen((prev) => !prev); // toggle dropdown
                  rfad();                   // call refetch
                }}
              >
                {cid ? data[cid]?.username : "open or close"}
              </button>

              {open && (
                <ul className="menu dropdown-content bg-base-100 rounded-box w-52 p-2 shadow-lg absolute">
                  {Object.entries(data).map(([id, user]) => (
                    <li key={id}>
                      <button onClick={() => handleSelect(id)}>
                        {user.username}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )
      }
    </>
  );
};

export default Dropdown;
