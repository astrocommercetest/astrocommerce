import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/admin-auth";

export const GET: APIRoute = async ({ request }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) return Response.json({ available: false });

  const url = new URL(request.url);
  const emailId = url.searchParams.get("emailId");
  if (!emailId) return Response.json({ error: "emailId mancante." }, { status: 400 });

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey as string);
  const { data, error } = await resend.emails.get(emailId);

  if (error) return Response.json({ error: error.message }, { status: 502 });

  return Response.json({
    available: true,
    status: (data as { last_event?: string } | null)?.last_event ?? "unknown",
    to: (data as { to?: string[] } | null)?.to,
    subject: (data as { subject?: string } | null)?.subject,
    createdAt: (data as { created_at?: string } | null)?.created_at,
  });
};
