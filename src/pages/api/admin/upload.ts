import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/admin-auth";

export const POST: APIRoute = async ({ request }) => {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "File mancante." }, { status: 400 });

  const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;
  const folder = import.meta.env.CLOUDINARY_FOLDER ?? "dev";

  if (!cloudName || !apiKey || !apiSecret) {
    return Response.json({ error: "Cloudinary non configurato." }, { status: 500 });
  }

  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
    });
    return Response.json({ publicId: result.public_id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload fallito.";
    return Response.json({ error: msg }, { status: 502 });
  }
};
