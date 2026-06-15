import { Resend } from "resend";
import { db } from "@/lib/db";

/**
 * Dispatches an email to a user, falling back to simulated console logs if Resend is not configured.
 */
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const settings = await db.getSettings();
    const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
    const fromEmail = settings.resendSenderEmail || "onboarding@resend.dev";

    if (!apiKey) {
      console.log(`
=========================================
✉️ SIMULATING EMAIL DISPATCH (Resend API key missing)
To: ${to}
Subject: ${subject}
-----------------------------------------
Body Preview:
${html.substring(0, 300)}...
=========================================
      `);
      return { success: true, simulated: true };
    }

    const resend = new Resend(apiKey);
    const sender = fromEmail.includes("<") ? fromEmail : `Stack Shack Nutrition <${fromEmail}>`;
    
    console.log(`[Resend] Attempting to send email to: ${to} from: ${sender}`);
    const { data, error } = await resend.emails.send({
      from: sender,
      to,
      subject,
      html,
    });
    console.log(`[Resend] Response received:`, { data, error });

    if (error) {
      console.error("[Resend] Error from Resend API:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error("Resend failed to dispatch email:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
