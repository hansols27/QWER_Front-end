import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Next.js API 라우트 기준
});

export default api;
