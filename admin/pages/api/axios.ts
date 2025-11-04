import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL,
  withCredentials: false,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API 요청 실패:", err.response?.status, err.message);
    return Promise.reject(err);
  }
);
