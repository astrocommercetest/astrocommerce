import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cloudinaryImagePath } from "@/lib/cloudinary";

type Product = {
  id: string;
  name: string;
  slug: string;
  gender: string | null;
  brandName: string | null;
  variantCount: number;
  published: boolean;
  deletedAt: string | null;
  thumb: string | null;
};

export default function ProductList() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: products = [], isLoading, isError } = useQuery<Product[]>({
    queryKey: ["admin", "products"],
    queryFn: () => fetch("/api/admin/products").then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Caricamento...</p>;
  if (isError) return <p className="text-sm text-destructive">Errore nel caricamento.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Prodotti</h1>
        <Button onClick={() => navigate({ to: "/products/new" })}>
          Nuovo prodotto
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Nome</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Genere</TableHead>
              <TableHead>Varianti</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  Nessun prodotto trovato.
                </TableCell>
              </TableRow>
            )}
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pr-0">
                  {p.thumb ? (
                    <img
                      src={cloudinaryImagePath("w_40,h_40,c_fill,q_auto,f_auto", p.thumb)}
                      alt=""
                      className="w-10 h-10 rounded object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded border border-border bg-muted" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.brandName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{p.gender ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{p.variantCount}</TableCell>
                <TableCell>
                  {p.deletedAt ? (
                    <Badge variant="destructive">Eliminato</Badge>
                  ) : p.published ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Pubblicato</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">Bozza</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate({ to: "/products/$id", params: { id: p.id } })}
                    >
                      Modifica
                    </Button>
                    {!p.deletedAt && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">Elimina</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminare il prodotto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{p.name}" verrà nascosto dal catalogo. Puoi ripristinarlo in seguito.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(p.id)}
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
