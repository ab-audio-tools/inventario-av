// src/lib/mailer.ts
import nodemailer from "nodemailer";

function emailsEnabled() {
  return Boolean(process.env.EMAIL_HOST); // invia solo se hai configurato un host reale
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!emailsEnabled()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

export async function sendNotification(subject: string, html: string) {
  if (!emailsEnabled()) {
    console.log("[mailer] Email disabilitate (nessun EMAIL_HOST). Skip.");
    return;
  }
  const tx = getTransporter();
  if (!tx) return;
  await tx.sendMail({
    from: process.env.EMAIL_FROM || "Inventario <noreply@example.com>",
    to: process.env.EMAIL_NOTIFY || "test@example.com",
    subject,
    html,
  });
}
