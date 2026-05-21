export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  try {
    if (import.meta.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(import.meta.env.RESEND_API_KEY as string);
      const result = await resend.emails.send({
        from: "AstroCommerce <onboarding@resend.dev>",
        to,
        subject,
        text,
      });
      if (result.error) throw new Error(result.error.message);
      console.log(`[email] sent via Resend "${subject}" to ${to}`, result.data?.id);
    } else {
      console.warn("[email] RESEND_API_KEY not set — skipping email in production");
    }
  } catch (err) {
    console.error("[email] failed to send:", err);
  }
}
