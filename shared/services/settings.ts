import { SettingsData } from "@shared/types/settings";
import { get, postFormData } from "@api/api";

// 설정 불러오기
export const getSettings = async (): Promise<SettingsData> => {
  return get<SettingsData>("/settings"); // GET /api/settings
};

// 설정 저장
export const saveSettings = async (formData: FormData): Promise<SettingsData> => {
  return postFormData<SettingsData>("/settings", formData); // POST /api/settings
};
