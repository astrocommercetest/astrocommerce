import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type OrderItem = {
  skuId: string;
  variantId: string;
  productName: string;
  color: string | null;
  size: number | null;
  unitPrice: number;
  qty: number;
};

type Order = {
  id: string;
  status: string;
  subtotal: number;
  items: OrderItem[];
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZip: string;
  shippingProvince: string;
  shippingPhone: string;
  notes: string | null;
  email: string | null;
  paymentRef: string | null;
  emailId: string | null;
  paidAt: string | null;
  createdAt: string;
};

type EmailStatus = {
  available: boolean;
  status?: string;
  to?: string[];
  createdAt?: string;
};

const statusLabel: Record<string, { label: string; color: string }> = {
  sent:      { label: "Inviata",    color: "bg-blue-100 text-blue-700" },
  delivered: { label: "Consegnata", color: "bg-green-100 text-green-700" },
  opened:    { label: "Aperta",     color: "bg-green-100 text-green-700" },
  clicked:   { label: "Link cliccato", color: "bg-green-100 text-green-700" },
  bounced:   { label: "Rimbalzata", color: "bg-red-100 text-red-700" },
  complained:{ label: "Spam",       color: "bg-red-100 text-red-700" },
  unknown:   { label: "Sconosciuto",color: "bg-gray-100 text-gray-500" },
};

export default function OrderDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: ["admin", "orders", id],
    queryFn: () => fetch(`/api/admin/orders/${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const { data: emailStatus, isFetching: emailFetching } = useQuery<EmailStatus>({
    queryKey: ["admin", "orders", id, "email-status"],
    queryFn: () => fetch(`/api/admin/orders/email-status?emailId=${order!.emailId}`).then((r) => r.json()),
    enabled: !!order?.emailId,
    staleTime: 30_000,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  if (isError || !order) return <p className="text-sm text-destructive">Ordine non trovato.</p>;

  const shortId = order.id.slice(0, 8).toUpperCase();
  const date = new Date(order.createdAt).toLocaleDateString("it-IT", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground" onClick={() => navigate({ to: "/orders" })}>
          ← Ordini
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Ordine #{shortId}</h1>
          {order.status === "paid"
            ? <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Pagato</Badge>
            : <Badge variant="secondary">{order.status}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{date}</p>
      </div>

      {/* Products */}
      <section className="flex flex-col gap-3 mb-6">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Articoli</h2>
        <div className="rounded-md border">
          {order.items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-3 text-sm ${i > 0 ? "border-t border-border" : ""}`}>
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-muted-foreground text-xs">
                  {[item.color, item.size != null ? `EU ${item.size}` : null].filter(Boolean).join(" · ")}
                  {" · "}qty {item.qty}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">€{(item.unitPrice * item.qty).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">€{item.unitPrice.toFixed(2)} cad.</p>
              </div>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 border-t border-border font-semibold text-sm">
            <span>Totale</span>
            <span>€{order.subtotal.toFixed(2)}</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-6">
        {/* Shipping */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Spedizione</h2>
          <address className="text-sm not-italic leading-6 text-foreground">
            <p className="font-medium">{order.shippingName}</p>
            <p>{order.shippingAddress}</p>
            <p>{order.shippingZip} {order.shippingCity} ({order.shippingProvince})</p>
            <p className="text-muted-foreground">{order.shippingPhone}</p>
            {order.notes && <p className="text-muted-foreground mt-1">Note: {order.notes}</p>}
          </address>
        </section>

        {/* Customer */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Cliente</h2>
          <div className="text-sm leading-6">
            <p>{order.email ?? "—"}</p>
            {order.paymentRef && (
              <p className="text-xs text-muted-foreground font-mono mt-2 break-all">
                Ref: {order.paymentRef.slice(0, 24)}…
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Email status — production only (visible when emailId is stored) */}
      {order.emailId && (
        <>
          <Separator className="my-6" />
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Email di conferma</h2>
              <button
                type="button"
                onClick={() => qc.invalidateQueries({ queryKey: ["admin", "orders", id, "email-status"] })}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${emailFetching ? "animate-spin" : ""}`} />
              </button>
            </div>

            {!emailStatus && emailFetching && (
              <p className="text-xs text-muted-foreground">Caricamento...</p>
            )}

            {emailStatus?.available === false && (
              <p className="text-xs text-muted-foreground">Resend non configurato in questo ambiente.</p>
            )}

            {emailStatus?.available && emailStatus.status && (
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(statusLabel[emailStatus.status] ?? statusLabel.unknown).color}`}>
                  {(statusLabel[emailStatus.status] ?? statusLabel.unknown).label}
                </span>
                <span className="text-xs text-muted-foreground font-mono">{order.emailId}</span>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
