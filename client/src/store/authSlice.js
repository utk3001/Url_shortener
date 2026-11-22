import { createSlice } from "@reduxjs/toolkit";

const storedToken = localStorage.getItem("token");
let storedUser = null;
try {
  storedUser = JSON.parse(localStorage.getItem("user"));
} catch (e) {
  storedUser = null;
}

const initialState = {
  token: storedToken || null,
  user: storedUser || null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
