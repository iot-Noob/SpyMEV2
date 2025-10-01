import React,{useEffect} from "react";

export const useAutoRtcStatus = (id, update_rtc_status, interval = 1000) => {
  useEffect(() => {
    if (!id) return;

    const timer = setInterval(() => { 
      update_rtc_status(id);
    }, interval);

    return () => clearInterval(timer);
  }, [id, update_rtc_status, interval]); // only re-run if id or function changes
};

export const useAutoWsStatus = (id, wssa = {}, delay = 1000) => {
  try{
    
    if(  Object.keys(wssa).filter((v)=>v===id)){
      console.log(wssa[id])
    }
  }catch(err){
    console.error("Error auto get statsu of sock due to ",err)
  }
};