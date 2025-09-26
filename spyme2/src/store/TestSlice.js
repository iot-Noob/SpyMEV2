import { createSlice } from "@reduxjs/toolkit";

const triggerSlice = createSlice({
  name: "trigger",
  initialState: {
    value: false,
  },
  reducers: {
    setTrigger: (state, action) => {
      state.value = action.payload; // true or false from dispatch
    },
  },
});

export const { setTrigger } = triggerSlice.actions;
export default triggerSlice.reducer;
