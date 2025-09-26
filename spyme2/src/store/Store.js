import { configureStore } from "@reduxjs/toolkit";
import triggerReducer from "./TestSlice";

export const store = configureStore({
  reducer: {
    trigger: triggerReducer,
  },
});
