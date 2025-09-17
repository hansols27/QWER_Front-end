import axios, { AxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: "/api", // 필요에 따라 실제 API 경로로 변경
  headers: {
    "Content-Type": "application/json",
  },
});

// GET 요청
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.get<T>(url, config);
  return response.data;
};

// POST 요청 (JSON)
export const post = async <T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.post<T>(url, data, config);
  return response.data;
};

// POST 요청 (FormData 전송용)
export const postFormData = async <T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.post<T>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    ...config,
  });
  return response.data;
};

export default api;
