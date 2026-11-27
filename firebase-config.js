export const firebaseConfig = {
  apiKey: "AIzaSyB5cizmll8RnkBdAP8ij19LX-pXrW1D2Ow",
  authDomain: "dar-alforqan.firebaseapp.com",
  projectId: "dar-alforqan",
  storageBucket: "dar-alforqan.appspot.com",
  messagingSenderId: "52759865906",
  appId: "1:52759865906:web:b2306793069565334f622b"
};

// App Check: يحمي Firestore من الطلبات القادمة من خارج موقعك.
// المفتاح لازم يكون مفتاح reCAPTCHA Enterprise (من نوع score-based) يتعمل من Google Cloud Console
// (صفحة Fraud Defense) لمشروع dar-alforqan بدومين dar-alforqan.github.io.
// بعدها سجّل نفس المفتاح في Firebase Console > App Check > الويب > reCAPTCHA Enterprise
// ثم الصقه هنا. لو تُرك فارغًا يبقى App Check متوقف ولا يتأثر الموقع.
export const APP_CHECK_SITE_KEY = "";

export function initAppCheck(app) {
  if (!APP_CHECK_SITE_KEY) return; // متوقف: لا يُحمَّل أي ملف إضافي
  import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js")
    .then(({ initializeAppCheck, ReCaptchaEnterpriseProvider }) => {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
    })
    .catch((e) => console.warn("App Check لم يعمل:", e));
}
