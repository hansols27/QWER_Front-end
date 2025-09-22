// shared/services/settings.ts
import type { SettingsData } from "@shared/types/settings";

const API_URL = "http://localhost:4000"; // back_end 주소

/**
 * 설정 불러오기
 */
export async function getSettings(): Promise<SettingsData> {
  const res = await fetch(`${API_URL}/settings`);
  if (!res.ok) throw new Error("설정 불러오기 실패");
  return (await res.json()) as SettingsData;
}

/**
 * 설정 저장 (메인 이미지 + SNS 링크)
 */
export async function saveSettings(formData: FormData): Promise<void> {
  const res = await fetch(`${API_URL}/settings`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("설정 저장 실패");
}
