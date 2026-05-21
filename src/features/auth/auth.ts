import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, User, Session, Account, Verification } from "astro:db";
import { sendEmail } from "@/lib/email";

export const auth = betterAuth({
  baseURL: import.meta.env.BETTER_AUTH_URL,
  secret: import.meta.env.BETTER_AUTH_SECRET,
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
        input: false,
      },
      shippingAddress: { type: "string", required: false, input: false },
      shippingCity: { type: "string", required: false, input: false },
      shippingZip: { type: "string", required: false, input: false },
      shippingProvince: { type: "string", required: false, input: false },
      shippingPhone: { type: "string", required: false, input: false },
    },
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: User,
      session: Session,
      account: Account,
      verification: Verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Reimposta la tua password",
        text: `Clicca il link per reimpostare la password:\n${url}\n\nIl link scade tra 1 ora.`,
      });
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Verifica il tuo indirizzo email",
        text: `Clicca il link per verificare la tua email: ${url}`,
      });
    },
  },
});
