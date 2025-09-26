import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { registerUser } from '../helper/apiClient';
import { showToast } from '../helper/Toasts';
 import { useDispatch,useSelector } from "react-redux";
import { setTrigger } from '../store/TestSlice';
export const AddData = (Component) => {
  return (props) => {
    
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const dialogRef = useRef(null);
    let api_rr=useSelector((state)=>state.trigger.value)
    let dispatch=useDispatch()
      let refresh_api=()=>{
    dispatch(setTrigger(!api_rr))
  }
  
    const openModal = () => {
      setUsername('');
      setError('');
      dialogRef.current?.showModal();
    };

    const closeModal = () => {
      dialogRef.current?.close();
    };
const handleSubmit = async () => {
  if (!username.trim()) {
    setError("Username is required");
    return;
  }

  try {
    const res = await registerUser(username);

    if (res.status === 200) {
      showToast.success(res.data.success || "User added successfully");
 
      props.addUser?.(username);
      refresh_api()
    } else if (res.status === 409) {
      showToast.error(res.data.detail || "User already exists");
    } else {
      showToast.error(res.data.detail || "Unknown error occurred");
    }
  } catch (err) {
    if (err.response) {
      const detail = err.response.data?.detail || "Unknown error";
      showToast.error(`Error adding user: ${detail}`);
    } else {
      showToast.error(`Network error: ${err.message || err}`);
    }
  } finally {
    closeModal();
  }
};

 

    // Ensure modal closes when clicking outside
    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const handleCancel = (e) => {
        e.preventDefault();
        closeModal();
      };

      dialog.addEventListener('cancel', handleCancel);
      return () => dialog.removeEventListener('cancel', handleCancel);
    }, []);

    return (
      <>
        {/* Pass openModal to wrapped component */}
        <Component {...props} openModal={openModal} closeModal={closeModal}/>

        {/* Modal using <dialog> */}
        <dialog
          ref={dialogRef}
           className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
             rounded-xl p-6 w-11/12 max-w-md border-none shadow-xl z-50 bg-white"
        >
          <button
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            onClick={closeModal}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          <h2 className="text-xl font-semibold mb-4">Add User</h2>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              className={`input input-bordered w-full ${error ? 'input-error' : ''}`}
            />
            {error && <p className="text-error text-sm">{error}</p>}

            <div className="flex justify-end gap-2 mt-2">
              <button className="btn btn-sm btn-outline" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn btn-sm btn-primary" onClick={handleSubmit}>
                Add
              </button>
            </div>
          </div>
        </dialog>
      </>
    );
  };
};
