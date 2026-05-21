import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: "localhost",
  port: 1025,
  secure: false,
});

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
    await transporter.sendMail({
      from: '"AstroCommerce" <noreply@astrocommerce.dev>',
      to,
      subject,
      text,
    });
    console.log(`[email] sent "${subject}" to ${to}`);
  } catch (err) {
    console.error("[email] failed to send:", err);
  }
}
