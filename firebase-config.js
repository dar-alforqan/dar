import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

export const firebaseConfig = {
  apiKey: "AIzaSy...", // اترك بياناتك الحالية كما هي
  authDomain: "dar-alforqan.firebaseapp.com",
  projectId: "dar-alforqan",
  storageBucket: "dar-alforqan.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// تفعيل نظام الحماية App Check
export function initAppCheck(app) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6Lee_hMuAAAAABxP3np15AOJsAMDdIp6UUIdJeZ2'),
      isTokenAutoRefreshEnabled: true
    });
  } catch (e) {
    console.warn("App Check:", e);
  }
}
