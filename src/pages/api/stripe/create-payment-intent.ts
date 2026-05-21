import type { APIRoute } from "astro";
import { db, Skus, eq } from "astro:db";
import { stripe } from "@/lib/stripe";

interface OrderItem { skuId: string; variantId: string; qty: number }
interface Shipping { name: string; address: string; city: string; zip: string; province: string; phone: string; notes?: string }

interface Body {
  userId?: string | null;
  guestEmail?: string;
  items: OrderItem[];
  shipping: Shipping;
}

export const POST: APIRoute = async ({ request }) => {
  let body: Body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }

  const { userId, guestEmail, items, shipping } = body;

  if (!items?.length) return Response.json({ error: "Il carrello è vuoto." }, { status: 400 });
  if (!shipping?.name || !shipping?.address || !shipping?.city || !shipping?.zip || !shipping?.province || !shipping?.phone)
    return Response.json({ error: "Dati di spedizione incompleti." }, { status: 400 });
  if (!userId && !guestEmail) return Response.json({ error: "Email obbligatoria per gli ospiti." }, { status: 400 });

  let subtotal = 0;
  for (const item of items) {
    const [sku] = await db.select().from(Skus).where(eq(Skus.id, item.skuId));
    if (!sku) return Response.json({ error: `Prodotto non trovato: ${item.skuId}` }, { status: 400 });
    if (sku.stockQty < item.qty)
      return Response.json({ error: `Scorte insufficienti per la taglia ${sku.size ?? ""}. Disponibili: ${sku.stockQty}.` }, { status: 400 });
    subtotal += sku.price * item.qty;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(subtotal * 100),
    currency: "eur",
    automatic_payment_methods: { enabled: true },
  });

  return Response.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
};
