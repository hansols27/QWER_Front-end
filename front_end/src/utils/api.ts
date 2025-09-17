import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// axios.get의 두 번째 인자 타입 추론
type AxiosRequestConfig = Parameters<typeof api.get>[1];

// GET 요청
export const get = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.get<T>(url, config);
  return response.data;
};

// POST 요청 (JSON)
export const post = async <T>(
  url: string,
  data: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.post<T>(url, data, config);
  return response.data;
};

// POST 요청 (FormData 전송용)
export const postFormData = async <T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.post<T>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config,
  });
  return response.data;
};

export default api;
