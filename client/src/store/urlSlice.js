import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  shortUrl: null,
  loading: false,
  error: null,
};

const urlSlice = createSlice({
  name: "url",
  initialState,
  reducers: {
    shortenStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    shortenSuccess: (state, action) => {
      state.loading = false;
      state.shortUrl = action.payload;
    },
    shortenFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetUrl: (state) => {
      state.shortUrl = null;
      state.error = null;
    },
  },
});

export const {
  shortenStart,
  shortenSuccess,
  shortenFailure,
  resetUrl,
} = urlSlice.actions;

export default urlSlice.reducer;
