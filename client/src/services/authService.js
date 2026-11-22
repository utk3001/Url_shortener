import apiClient from "./apiClient";

export const loginUser = (email, password) => {
  return apiClient.post("/auth/login", { email, password });
};

export const registerUser = (email, password) => {
  return apiClient.post("/auth/register", { email, password });
};

export const getProfile = () => {
  return apiClient.get("/auth/me");
};
