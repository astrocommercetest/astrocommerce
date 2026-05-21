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
      await resend.emails.send({
        from: "AstroCommerce <onboarding@resend.dev>",
        to,
        subject,
        text,
      });
    } else {
      const { createTransport } = await import("nodemailer");
      const transporter = createTransport({ host: "localhost", port: 1025, secure: false });
      await transporter.sendMail({
        from: '"AstroCommerce" <noreply@astrocommerce.dev>',
        to,
        subject,
        text,
      });
    }
    console.log(`[email] sent "${subject}" to ${to}`);
  } catch (err) {
    console.error("[email] failed to send:", err);
  }
}
