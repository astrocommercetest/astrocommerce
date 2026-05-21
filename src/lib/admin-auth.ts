import { auth } from "@/features/auth/auth";

export async function requireAdmin(request: Request): Promise<Response | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return Response.json({ error: "Non autorizzato." }, { status: 403 });
  }
  return null;
}
