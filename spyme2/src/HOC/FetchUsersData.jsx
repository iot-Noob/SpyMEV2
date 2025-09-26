import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getUsers } from "../helper/apiClient";
import { showToast } from "../helper/Toasts";

export const FetchUsers = (Component) => {
  return function Wrapper(props) {
    const cv = useSelector((state) => state.trigger.value);
    const [api_data,setApiData]=useState({})
    useEffect(() => {
      const get_user_data = async () => {
        try {
          const api_data = await getUsers();
          setApiData(api_data)
        } catch (err) {
          showToast.error(`Error fetching data: ${err.message}`);
        }
      };

      const tot = setTimeout(get_user_data, 500);
      return () => clearTimeout(tot);
    }, [cv]);

    return <Component {...props} data={api_data} />;
  };
};
