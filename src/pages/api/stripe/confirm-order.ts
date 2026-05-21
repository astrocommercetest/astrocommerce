import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { db, Orders, Skus, Variants, Products, User, eq } from "astro:db";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";

interface OrderItem { skuId: string; variantId: string; qty: number }
interface Shipping { name: string; address: string; city: string; zip: string; province: string; phone: string; notes?: string }

interface Body {
  paymentIntentId: string;
  userId?: string | null;
  guestEmail?: string;
  items: OrderItem[];
  shipping: Shipping;
}

export const POST: APIRoute = async ({ request }) => {
  let body: Body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Richiesta non valida." }, { status: 400 }); }

  const { paymentIntentId, userId, guestEmail, items, shipping } = body;

  if (!paymentIntentId) return Response.json({ error: "Payment intent mancante." }, { status: 400 });

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== "succeeded")
    return Response.json({ error: "Pagamento non completato." }, { status: 402 });

  type SnapshotItem = { skuId: string; variantId: string; productName: string; color: string | null; size: number | null; unitPrice: number; qty: number };
  const snapshots: SnapshotItem[] = [];
  let subtotal = 0;

  for (const item of items) {
    const [sku] = await db.select().from(Skus).where(eq(Skus.id, item.skuId));
    if (!sku) return Response.json({ error: `Prodotto non trovato: ${item.skuId}` }, { status: 400 });
    if (sku.stockQty < item.qty)
      return Response.json({ error: `Scorte insufficienti per la taglia ${sku.size ?? ""}.` }, { status: 400 });

    const [variant] = await db.select().from(Variants).where(eq(Variants.id, item.variantId));
    const [product] = await db.select().from(Products).where(eq(Products.id, variant?.productId ?? ""));

    snapshots.push({ skuId: sku.id, variantId: item.variantId, productName: product?.name ?? "Prodotto", color: variant?.color ?? null, size: sku.size ?? null, unitPrice: sku.price, qty: item.qty });
    subtotal += sku.price * item.qty;
  }

  const orderId = randomUUID();
  const now = new Date();

  await db.insert(Orders).values({
    id: orderId, userId: userId ?? null, guestEmail: guestEmail ?? null,
    status: "paid", subtotal, items: snapshots,
    shippingName: shipping.name, shippingAddress: shipping.address, shippingCity: shipping.city,
    shippingZip: shipping.zip, shippingProvince: shipping.province, shippingPhone: shipping.phone,
    notes: shipping.notes ?? null,
    paymentRef: paymentIntentId,
    paidAt: now, createdAt: now, updatedAt: now,
  });

  for (const { skuId, qty } of items) {
    const [sku] = await db.select().from(Skus).where(eq(Skus.id, skuId));
    if (sku) await db.update(Skus).set({ stockQty: sku.stockQty - qty }).where(eq(Skus.id, skuId));
  }

  if (userId) {
    await db.update(User).set({ shippingAddress: shipping.address, shippingCity: shipping.city, shippingZip: shipping.zip, shippingProvince: shipping.province, shippingPhone: shipping.phone }).where(eq(User.id, userId));
  }

  const recipientEmail = userId ? (await db.select().from(User).where(eq(User.id, userId)))[0]?.email : guestEmail;
  if (recipientEmail) {
    const itemLines = snapshots.map((s) => `- ${s.productName} (${s.color ?? ""}, EU ${s.size ?? ""}) × ${s.qty} — €${(s.unitPrice * s.qty).toFixed(2)}`).join("\n");
    sendEmail({ to: recipientEmail, subject: `Conferma ordine #${orderId.slice(0, 8).toUpperCase()}`, text: `Grazie per il tuo ordine!\n\nOrdine: #${orderId.slice(0, 8).toUpperCase()}\n\nArticoli:\n${itemLines}\n\nTotale: €${subtotal.toFixed(2)}\n\nSpedizione a:\n${shipping.name}\n${shipping.address}\n${shipping.zip} ${shipping.city} (${shipping.province})\nTel: ${shipping.phone}${shipping.notes ? `\nNote: ${shipping.notes}` : ""}` })
      .then((emailId) => {
        if (emailId) db.update(Orders).set({ emailId }).where(eq(Orders.id, orderId));
      });
  }

  return Response.json({ orderId });
};
