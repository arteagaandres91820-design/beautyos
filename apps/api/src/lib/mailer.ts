import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
  },
});

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  if (!process.env.SMTP_USER) return; // silently skip if not configured
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM ?? 'BeautyOS <noreply@beautyos.co>', ...opts });
  } catch (err) {
    console.warn('[mailer] failed to send email:', err);
  }
}

export function bookingConfirmedEmail(data: {
  clientName: string;
  salonName: string;
  date: string;
  startTime: string;
  services: string[];
  shareUrl?: string;
}): { subject: string; html: string } {
  const dateStr = new Date(data.date + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const firstName = data.clientName.split(' ')[0];
  const serviceList = data.services.length
    ? data.services.map(s => `<li style="margin:4px 0">${s}</li>`).join('')
    : '<li>Servicio por confirmar</li>';

  return {
    subject: `✅ Cita confirmada — ${data.salonName}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fafa;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(13,91,99,0.08)">
    <div style="background:linear-gradient(135deg,#2DC7B3,#0D5C63);padding:32px 32px 24px;text-align:center">
      <p style="margin:0 0 8px;font-size:28px">💅</p>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">¡Cita confirmada!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">${data.salonName}</p>
    </div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 20px;color:#374151;font-size:15px">Hola <strong>${firstName}</strong>, tu cita ha sido confirmada. Aquí están los detalles:</p>
      <div style="background:#f0fafa;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Fecha y hora</p>
        <p style="margin:0;font-size:16px;color:#0d1b2a;font-weight:700">${dateStr}</p>
        <p style="margin:4px 0 0;font-size:15px;color:#2DC7B3;font-weight:600">${data.startTime}</p>
      </div>
      <div style="background:#f0fafa;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Servicios</p>
        <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px">${serviceList}</ul>
      </div>
      ${data.shareUrl ? `
      <div style="text-align:center;margin-bottom:8px">
        <a href="${data.shareUrl}" style="display:inline-block;background:linear-gradient(135deg,#2DC7B3,#0D5C63);color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:700;font-size:14px">Ver propuesta de diseño →</a>
      </div>` : ''}
      <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;text-align:center">Si necesitas cancelar, hazlo con al menos 24 horas de anticipación.</p>
    </div>
  </div>
</body>
</html>`,
  };
}

export function bookingRequestReceivedEmail(data: {
  clientName: string;
  salonName: string;
  date: string;
  timeSlot: string;
}): { subject: string; html: string } {
  const dateStr = new Date(data.date + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const firstName = data.clientName.split(' ')[0];
  return {
    subject: `📩 Solicitud recibida — ${data.salonName}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0fafa;font-family:Arial,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(13,91,99,0.08)">
    <div style="background:linear-gradient(135deg,#2DC7B3,#0D5C63);padding:28px 32px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:20px">¡Solicitud recibida!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">${data.salonName}</p>
    </div>
    <div style="padding:28px 32px">
      <p style="color:#374151;font-size:15px">Hola <strong>${firstName}</strong>, recibimos tu solicitud para el <strong>${dateStr} a las ${data.timeSlot}</strong>.</p>
      <p style="color:#6b7280;font-size:14px">Te confirmaremos en breve. 💅</p>
    </div>
  </div>
</body>
</html>`,
  };
}

export function appointmentReminderEmail(data: {
  clientName: string;
  salonName: string;
  date: string;
  startTime: string;
  services: string[];
  whatsapp?: string | null;
}): { subject: string; html: string } {
  const dateStr = new Date(data.date + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const firstName = data.clientName.split(' ')[0];
  const serviceList = data.services.length
    ? data.services.map(s => `<li style="margin:4px 0">${s}</li>`).join('')
    : '<li>Servicio por confirmar</li>';
  const waLink = data.whatsapp
    ? `https://wa.me/${data.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${data.salonName}, confirmo mi cita de mañana ${dateStr} a las ${data.startTime}. ¡Nos vemos! 💅`)}`
    : null;

  return {
    subject: `⏰ Recordatorio — Tu cita mañana en ${data.salonName}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fafa;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(13,91,99,0.08)">
    <div style="background:linear-gradient(135deg,#2DC7B3,#0D5C63);padding:32px 32px 24px;text-align:center">
      <p style="margin:0 0 8px;font-size:32px">⏰</p>
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">Recordatorio de cita</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">${data.salonName}</p>
    </div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 20px;color:#374151;font-size:15px">Hola <strong>${firstName}</strong>, te recordamos que tienes una cita <strong>mañana</strong>:</p>
      <div style="background:#f0fafa;border-radius:12px;padding:16px 20px;margin-bottom:20px">
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Fecha</p>
        <p style="margin:0;font-size:16px;color:#0d1b2a;font-weight:700;text-transform:capitalize">${dateStr}</p>
        <p style="margin:4px 0 0;font-size:18px;color:#2DC7B3;font-weight:700">${data.startTime}</p>
      </div>
      <div style="background:#f0fafa;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Servicios</p>
        <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px">${serviceList}</ul>
      </div>
      ${waLink ? `<div style="text-align:center;margin-top:8px"><a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px">✅ Confirmar por WhatsApp</a></div>` : ''}
      <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;text-align:center">Si no puedes asistir, contáctanos con anticipación para reagendar.</p>
    </div>
  </div>
</body>
</html>`,
  };
}
