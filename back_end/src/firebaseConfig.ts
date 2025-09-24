import admin from "firebase-admin";
import serviceAccountJson from "./firebase-service-key.json";

const serviceAccount = serviceAccountJson as admin.ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "qwer-fansite.appspot.com", // 실제 버킷 이름
});

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
