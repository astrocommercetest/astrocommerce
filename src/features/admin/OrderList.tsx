import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Order = {
  id: string;
  status: string;
  subtotal: number;
  email: string | null;
  shippingName: string;
  itemCount: number;
  paidAt: string | null;
  createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "paid")
    return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Pagato</Badge>;
  return <Badge variant="secondary" className="text-muted-foreground">{status}</Badge>;
}

export default function OrderList() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading, isError } = useQuery<Order[]>({
    queryKey: ["admin", "orders"],
    queryFn: () => fetch("/api/admin/orders").then((r) => r.json()),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  if (isError) return <p className="text-sm text-destructive">Errore nel caricamento.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Ordini</h1>
        <span className="text-sm text-muted-foreground">{orders.length} ordini totali</span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ordine</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Articoli</TableHead>
              <TableHead>Totale</TableHead>
              <TableHead>Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Nessun ordine.
                </TableCell>
              </TableRow>
            )}
            {orders.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer"
                onClick={() => navigate({ to: "/orders/$id", params: { id: o.id } })}
              >
                <TableCell className="font-mono text-xs">
                  #{o.id.slice(0, 8).toUpperCase()}
                </TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{o.shippingName}</p>
                  <p className="text-xs text-muted-foreground">{o.email ?? "—"}</p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(o.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
                </TableCell>
                <TableCell className="text-muted-foreground">{o.itemCount}</TableCell>
                <TableCell className="font-medium">€{o.subtotal.toFixed(2)}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
