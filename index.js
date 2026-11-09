// تنبيه بالبريد عند وصول طلب تسجيل أو استشارة جديدة (يعمل حتى لو لوحة الإدارة مغلقة)
// المتطلبات: خطة Blaze + تثبيت إضافة "Trigger Email from Firestore" (collection: mail)
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

const REGION = "us-central1"; // غيّره ليطابق موقع قاعدة Firestore عندك
const RECIPIENTS = ["daralforqan@gmail.com"];
const ADMIN_URL = "https://dar-alforqan.github.io/dar/admin.html";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function queueMail(subject, rows) {
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9">`
    + rows.map(([k, v]) => `<div><b>${esc(k)}:</b> ${esc(v)}</div>`).join("")
    + `<p><a href="${ADMIN_URL}">فتح لوحة الإدارة</a></p></div>`;
  return getFirestore().collection("mail").add({ to: RECIPIENTS, message: { subject, html } });
}

exports.notifyNewConsultation = onDocumentCreated(
  { document: "consultations/{id}", region: REGION },
  (event) => {
    const d = event.data && event.data.data();
    if (!d) return null;
    return queueMail("استشارة / تلاوة جديدة - دار الفرقان", [
      ["الطالب", d.studentName],
      ["الهاتف", d.phone || "غير مسجل"],
      ["الموضوع", d.topic],
      ["التفاصيل", String(d.notes || "").slice(0, 500)],
      ["تسجيل صوتي", d.audioUrl || d.audioData ? "نعم" : "لا"]
    ]);
  }
);

exports.notifyNewRegistration = onDocumentCreated(
  { document: "registrations/{id}", region: REGION },
  (event) => {
    const d = event.data && event.data.data();
    if (!d) return null;
    return queueMail("طلب تسجيل جديد - دار الفرقان", [
      ["الاسم", d.fullName],
      ["الهاتف", d.phone],
      ["البرنامج", d.program],
      ["ملاحظات", String(d.notes || "").slice(0, 500) || "لا توجد"]
    ]);
  }
);
