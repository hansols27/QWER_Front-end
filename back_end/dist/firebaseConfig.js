"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bucket = exports.db = void 0;
// src/firebaseConfig.ts
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// 환경 변수가 없는 경우 오류를 던져 안전하게 처리
function getEnv(key) {
    const value = process.env[key];
    if (!value)
        throw new Error(`Missing environment variable ${key}`);
    return key === "NEXT_PUBLIC_PRIVATE_KEY" ? value.replace(/\\n/g, "\n") : value;
}
// 최소 필수 필드만 사용해서 ServiceAccount 생성
const serviceAccount = {
    projectId: getEnv("NEXT_PUBLIC_PROJECT_ID"),
    privateKey: getEnv("NEXT_PUBLIC_PRIVATE_KEY"),
    clientEmail: getEnv("NEXT_PUBLIC_CLIENT_EMAIL"),
};
// Firebase Admin 초기화
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
        storageBucket: "qwer-fansite.appspot.com", // 실제 버킷 이름으로 변경
    });
}
// Firestore와 Storage export
exports.db = firebase_admin_1.default.firestore();
exports.bucket = firebase_admin_1.default.storage().bucket();
