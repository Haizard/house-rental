import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "Nyumba Nearby <notifications@haizard.com>";

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

// ─── Lead Notification (to Agent) ─────────────────────────────

export async function sendLeadAlert(params: {
  agentEmail: string;
  agentName: string;
  studentName: string;
  listingTitle: string;
  listingUrl: string;
}): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Email not configured" };

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: params.agentEmail,
      subject: `🏠 New lead: ${params.studentName} is interested in ${params.listingTitle}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0d9488;">New Lead Received</h2>
          <p>Hi ${params.agentName},</p>
          <p><strong>${params.studentName}</strong> is interested in your listing <strong>${params.listingTitle}</strong>.</p>
          <a href="${params.listingUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">View Lead</a>
          <p style="color: #6b7280; font-size: 14px;">Log in to your dashboard to respond quickly — fast responses lead to more bookings!</p>
        </div>
      `,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id || "" };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─── Viewing Confirmation (to Student) ────────────────────────

export async function sendViewingConfirmation(params: {
  studentEmail: string;
  studentName: string;
  agentName: string;
  listingTitle: string;
  scheduledAt: string;
  chatUrl: string;
}): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Email not configured" };

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: params.studentEmail,
      subject: `📅 Viewing confirmed: ${params.listingTitle}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0d9488;">Viewing Confirmed</h2>
          <p>Hi ${params.studentName},</p>
          <p>Your viewing of <strong>${params.listingTitle}</strong> with <strong>${params.agentName}</strong> has been confirmed.</p>
          <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0;"><strong>When:</strong> ${params.scheduledAt}</p>
            <p style="margin: 4px 0 0;"><strong>Agent:</strong> ${params.agentName}</p>
          </div>
          <a href="${params.chatUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Open Chat</a>
        </div>
      `,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id || "" };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─── Subscription Receipt (to Agent) ──────────────────────────

export async function sendSubscriptionReceipt(params: {
  agentEmail: string;
  agentName: string;
  planName: string;
  amount: number;
  expiresAt: string;
}): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Email not configured" };

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: params.agentEmail,
      subject: `✅ ${params.planName} Subscription Activated`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0d9488;">Welcome to ${params.planName}!</h2>
          <p>Hi ${params.agentName},</p>
          <p>Your <strong>${params.planName}</strong> subscription is now active.</p>
          <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0;"><strong>Plan:</strong> ${params.planName}</p>
            <p style="margin: 4px 0 0;"><strong>Amount:</strong> TZS ${params.amount.toLocaleString()}</p>
            <p style="margin: 4px 0 0;"><strong>Renews:</strong> ${params.expiresAt}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Thank you for supporting Nyumba Nearby!</p>
        </div>
      `,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id || "" };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─── Verification Update (to Agent) ───────────────────────────

export async function sendVerificationUpdate(params: {
  agentEmail: string;
  agentName: string;
  status: "APPROVED" | "REJECTED";
  notes?: string;
}): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Email not configured" };

  const isApproved = params.status === "APPROVED";
  const title = isApproved ? "✅ Verification Approved" : "❌ Verification Update";

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: params.agentEmail,
      subject: title,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: ${isApproved ? "#0d9488" : "#dc2626"};">${title}</h2>
          <p>Hi ${params.agentName},</p>
          <p>${isApproved
            ? "Your identity verification has been approved. Your listings will now show a verified badge."
            : "Your verification requires additional information."}</p>
          ${params.notes ? `<p style="color: #6b7280;"><strong>Notes:</strong> ${params.notes}</p>` : ""}
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://nyumbanearby.com"}/agent/profile" style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">View Profile</a>
        </div>
      `,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id || "" };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─── Contact Reveal Notification (to Student) ─────────────────

export async function sendContactRevealed(params: {
  studentEmail: string;
  studentName: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  listingTitle: string;
}): Promise<EmailResult> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Email not configured" };

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: params.studentEmail,
      subject: `📞 Contact info revealed for ${params.listingTitle}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0d9488;">Contact Info Revealed</h2>
          <p>Hi ${params.studentName},</p>
          <p>The agent for <strong>${params.listingTitle}</strong> has revealed their contact information.</p>
          <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0;"><strong>Agent:</strong> ${params.agentName}</p>
            <p style="margin: 4px 0 0;"><strong>Phone:</strong> ${params.agentPhone}</p>
            <p style="margin: 4px 0 0;"><strong>Email:</strong> ${params.agentEmail}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Please save this information for your records.</p>
        </div>
      `,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id || "" };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
