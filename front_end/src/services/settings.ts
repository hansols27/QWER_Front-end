import api from "../utils/api";
import { SettingsData } from "../../../shared/types/settings";

export const getSettings = async (): Promise<SettingsData> => {
  const { data } = await api.get<SettingsData>("/settings");
  return data;
};

export const saveSettings = async (formData: FormData): Promise<SettingsData> => {
  const { data } = await api.post<SettingsData>("/settings", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
