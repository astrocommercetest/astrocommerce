import { useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { cartItems, cartTotal } from "@/features/cart/cartStore";
import { cloudinaryImagePath } from "@/lib/cloudinary";

const stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

type SavedShipping = { address: string; city: string; zip: string; province: string; phone: string };

interface Props {
  userId: string | null;
  initialName: string;
  initialEmail: string;
  savedShipping: SavedShipping | null;
}

// --- Inner Stripe payment step ---
interface PaymentStepProps {
  userId: string | null;
  email: string;
  itemsPayload: () => { skuId: string; variantId: string; qty: number }[];
  shippingPayload: () => { name: string; address: string; city: string; zip: string; province: string; phone: string; notes: string };
  onBack: () => void;
}

function StripePaymentForm({ userId, email, itemsPayload, shippingPayload, onBack }: PaymentStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setLoading(true);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: window.location.href },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Pagamento non completato.");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      const res = await fetch("/api/stripe/confirm-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          userId,
          guestEmail: userId ? undefined : email,
          items: itemsPayload(),
          shipping: shippingPayload(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Errore durante la conferma."); setLoading(false); return; }
      window.location.href = `/ordine/${data.orderId}`;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <button type="button" onClick={onBack} className="text-sm underline text-gray-500">
          ← Modifica spedizione
        </button>
        <h2 className="text-lg font-semibold">Pagamento</h2>
      </div>

      <PaymentElement />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading || !stripe} className="button">
        {loading ? "Elaborazione..." : "Conferma e paga"}
      </button>
    </form>
  );
}

// --- Main checkout form ---
export default function CheckoutForm({ userId, initialName, initialEmail, savedShipping }: Props) {
  const items = useStore(cartItems);
  const total = useStore(cartTotal);
  const entries = Object.values(items);

  const [step, setStep] = useState<"auth-choice" | "shipping" | "payment">(userId ? "shipping" : "auth-choice");
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [address, setAddress] = useState(savedShipping?.address ?? "");
  const [city, setCity] = useState(savedShipping?.city ?? "");
  const [zip, setZip] = useState(savedShipping?.zip ?? "");
  const [province, setProvince] = useState(savedShipping?.province ?? "");
  const [phone, setPhone] = useState(savedShipping?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const formValid =
    name.trim() !== "" && address.trim() !== "" && city.trim() !== "" &&
    zip.trim() !== "" && province.trim() !== "" && phone.trim() !== "" &&
    (!!userId || email.trim() !== "");

  const shippingPayload = () => ({ name, address, city, zip, province, phone, notes });
  const itemsPayload = () => entries.map(({ sku, variant, qty }) => ({ skuId: sku.id, variantId: variant.id, qty }));

  if (entries.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-12 text-center">
        Il carrello è vuoto.{" "}
        <a href="/" className="underline">Continua lo shopping</a>
      </div>
    );
  }

  if (step === "auth-choice") {
    return (
      <div className="max-w-sm">
        <h2 className="text-lg font-semibold mb-1">Hai già un account?</h2>
        <p className="text-sm text-gray-500 mb-6">Accedi per salvare i dati di spedizione e accedere allo storico ordini.</p>
        <div className="flex flex-col gap-3">
          <a href="/login?redirect=/checkout" className="button text-center w-full">Accedi</a>
          <a href="/register?redirect=/checkout" className="button text-center w-full">Crea un account</a>
          <button onClick={() => setStep("shipping")} className="text-sm underline text-center">
            Continua come ospite
          </button>
        </div>
      </div>
    );
  }

  const inputClass = "border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 w-full";

  async function handleProceedToPayment(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!formRef.current?.reportValidity()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, guestEmail: userId ? undefined : email, items: itemsPayload(), shipping: shippingPayload() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Errore."); setLoading(false); return; }
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setStep("payment");
    } catch {
      setError("Errore di rete. Riprova.");
    }
    setLoading(false);
  }

  // Order summary (shared)
  const orderSummary = (
    <div className="flex-1">
      <h2 className="text-lg font-semibold mb-4">Riepilogo ordine</h2>
      <div className="flex flex-col gap-4">
        {entries.map(({ sku, variant, qty }) => (
          <div key={sku.id} className="flex gap-3 items-start text-sm">
            <img src={cloudinaryImagePath("w_64,h_64,c_fill,q_auto,f_auto", (variant.imageIds as string[] | null)?.[0])} alt="" className="w-16 h-16 object-cover shrink-0" />
            <div>
              <p className="font-medium">{variant.color} — EU {sku.size}</p>
              <p className="text-gray-500">{qty} × €{sku.price.toFixed(2)}</p>
            </div>
            <p className="ml-auto font-medium">€{(sku.price * qty).toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-semibold">
        <span>Totale</span>
        <span>€{total.toFixed(2)}</span>
      </div>
    </div>
  );

  if (step === "payment" && clientSecret && paymentIntentId) {
    return (
      <div className="flex flex-col md:flex-row gap-12">
        {orderSummary}
        <div className="flex-2">
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
            <StripePaymentForm
              userId={userId}
              email={email}
              itemsPayload={itemsPayload}
              shippingPayload={shippingPayload}
              onBack={() => setStep("shipping")}
            />
          </Elements>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-12">
      {orderSummary}

      <form ref={formRef} onSubmit={handleProceedToPayment} className="flex-2 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Dati di spedizione</h2>

        {!userId && (
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">Nome completo</label>
          <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="address" className="text-sm font-medium">Indirizzo</label>
          <input id="address" type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="city" className="text-sm font-medium">Città</label>
            <input id="city" type="text" required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="zip" className="text-sm font-medium">CAP</label>
            <input id="zip" type="text" required value={zip} onChange={(e) => setZip(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="province" className="text-sm font-medium">Provincia</label>
            <input id="province" type="text" required maxLength={2} value={province} onChange={(e) => setProvince(e.target.value.toUpperCase())} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-sm font-medium">Telefono</label>
            <input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="text-sm font-medium">Note (opzionale)</label>
          <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading || !formValid} className="button">
          {loading ? "Caricamento..." : "Procedi al pagamento →"}
        </button>

        {!userId && (
          <p className="text-xs text-gray-500 text-center">
            Hai un account?{" "}
            <a href="/login?redirect=/checkout" className="underline">Accedi</a>{" "}o{" "}
            <a href="/register?redirect=/checkout" className="underline">crea un account</a>{" "}
            per salvare i dati di spedizione.
          </p>
        )}
      </form>
    </div>
  );
}
