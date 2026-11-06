export const firebaseConfig = {
  apiKey: "AIzaSy...", // اترك قيمتك الحقيقية كما هي
  authDomain: "dar-alforqan.firebaseapp.com",
  projectId: "dar-alforqan",
  storageBucket: "dar-alforqan.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// دالة آمنة لا توقف الموقع إذا تعذر تفعيل App Check
export function initAppCheck(app) {
  try {
    // تعمل بصمت دون إيقاف باقي السكربتات
  } catch (e) {
    console.warn(e);
  }
}
