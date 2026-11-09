export const firebaseConfig = {
  apiKey: "مفتاحك_الحقيقي_هنا",
  authDomain: "dar-alforqan.firebaseapp.com",
  projectId: "dar-alforqan",
  storageBucket: "dar-alforqan.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// دالة حماية App Check الآمنة التي تستوردها جميع الصفحات
export function initAppCheck(app) {
  try {
    // يمكنك تفعيلها لاحقاً أو تركها فارغة هكذا لضمان عمل الموقع بكفاءة وثبات
  } catch (e) {
    console.warn("App Check:", e);
  }
}
