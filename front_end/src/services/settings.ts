import api from "../utils/api"; 
import { SettingsData } from "../../../shared/types/settings";

export const getSettings = async (): Promise<SettingsData> => {
  const { data } = await api.get("/api/settings");
  return data;
};

export const saveSettings = async (formData: FormData) => {
  const { data } = await api.post("/api/settings", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
