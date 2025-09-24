// src/firebaseConfig.ts
import admin from "firebase-admin";

// 환경 변수가 없는 경우 오류를 던져 안전하게 처리
function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable ${key}`);
  return key === "FB_PRIVATE_KEY" ? value.replace(/\\n/g, "\n") : value;
}

// 최소 필수 필드만 사용해서 ServiceAccount 생성
const serviceAccount: admin.ServiceAccount = {
  projectId: getEnv("FB_PROJECT_ID"),
  privateKey: getEnv("FB_PRIVATE_KEY"),
  clientEmail: getEnv("FB_CLIENT_EMAIL"),
};

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "qwer-fansite.appspot.com", // 실제 버킷 이름으로 변경
  });
}

// Firestore와 Storage export
export const db = admin.firestore();
export const bucket = admin.storage().bucket();
