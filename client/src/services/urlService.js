import apiClient from "./apiClient";

export const shortenUrl = (long, ttl) => {
  return apiClient.post("/shorten", {
    long,
    ttl: ttl ? Number(ttl) : undefined,
  });
};
