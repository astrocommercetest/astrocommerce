import { useEffect, useRef, useState } from "react";
import { toast } from "@/features/toasts/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import RichTextEditor from "./RichTextEditor";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { cloudinaryImagePath } from "@/lib/cloudinary";

type Brand = { id: string; name: string };
type Collection = {
  id: string;
  label: string;
  section: string | null;
  parentId: string | null;
};

type SkuDraft = { size: string; price: string; stockQty: string };
type VariantDraft = {
  color: string;
  imageIds: string[];
  uploading: boolean;
  skus: SkuDraft[];
  open: boolean;
};

type ProductData = {
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  gender: string;
  brandId: string;
  activity: string[];
  collectionIds: string[];
  variants: VariantDraft[];
  defaultSkuId: string;
  published: boolean;
};

const ACTIVITIES = [
  "alpinismo",
  "scialpinismo",
  "trekking",
  "arrampicata",
  "running",
  "ciclismo",
];

const EMPTY_SKU: SkuDraft = { size: "", price: "", stockQty: "" };
const EMPTY_VARIANT: VariantDraft = {
  color: "",
  imageIds: [],
  uploading: false,
  skus: [{ ...EMPTY_SKU }],
  open: true,
};

const EMPTY: ProductData = {
  name: "",
  slug: "",
  description: "",
  longDescription: "",
  gender: "",
  brandId: "",
  activity: [],
  collectionIds: [],
  variants: [{ ...EMPTY_VARIANT }],
  defaultSkuId: "",
  published: true,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function useSlugCheck(slug: string, excludeId?: string) {
  const [status, setStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!slug) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const params = new URLSearchParams({ slug });
      if (excludeId) params.set("excludeId", excludeId);
      const res = await fetch(`/api/admin/products/check-slug?${params}`);
      const data = await res.json();
      setStatus(data.available ? "available" : "taken");
    }, 500);
    return () => clearTimeout(timer.current);
  }, [slug, excludeId]);

  return status;
}

export default function ProductForm() {
  const params = useParams({ strict: false }) as { id?: string };
  const id = params.id;
  const isEdit = !!id && id !== "new";

  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [form, setForm] = useState<ProductData>(EMPTY);
  const [slugLocked, setSlugLocked] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [collectionParent, setCollectionParent] = useState("");

  const slugStatus = useSlugCheck(form.slug, isEdit ? id : undefined);

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["admin", "brands"],
    queryFn: () => fetch("/api/admin/brands").then((r) => r.json()),
  });

  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["admin", "collections"],
    queryFn: () => fetch("/api/admin/collections").then((r) => r.json()),
  });

  const { data: existing } = useQuery({
    queryKey: ["admin", "products", id],
    queryFn: () => fetch(`/api/admin/products/${id}`).then((r) => r.json()),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing || !collections.length || !brands.length) return;

    const childId = (existing.collectionIds as string[])?.[0];
    const child = collections.find((c) => c.id === childId);
    const isActualChild = !!child?.parentId;
    setCollectionParent(isActualChild ? (child!.parentId as string) : (childId ?? ""));

    // Map DB defaultSkuId → position key "vi-si" for the select
    let defaultSkuKey = "";
    (existing.variants ?? []).forEach(
      (v: { skus?: { id: string }[] }, vi: number) => {
        (v.skus ?? []).forEach((s, si) => {
          if (s.id === existing.defaultSkuId) defaultSkuKey = `${vi}-${si}`;
        });
      },
    );

    setForm({
      name: existing.name ?? "",
      slug: existing.slug ?? "",
      description: existing.description ?? "",
      longDescription: existing.longDescription ?? "",
      gender: existing.gender ?? "",
      brandId: existing.brandId ?? "",
      activity: (existing.activity as string[]) ?? [],
      collectionIds: isActualChild
        ? ((existing.collectionIds as string[]) ?? [])
        : [],
      defaultSkuId: defaultSkuKey,
      published: existing.published ?? true,
      variants: (existing.variants ?? []).map(
        (v: {
          color: string | null;
          imageIds: unknown;
          skus: { size: number | null; price: number; stockQty: number }[];
        }) => ({
          color: v.color ?? "",
          imageIds: (v.imageIds as string[]) ?? [],
          uploading: false,
          open: false,
          skus: (v.skus ?? []).map((s) => ({
            size: s.size != null ? String(s.size) : "",
            price: String(s.price),
            stockQty: String(s.stockQty),
          })),
        }),
      ),
    });
  }, [existing, collections, brands]);

  const mutation = useMutation({
    mutationFn: (data: ProductData) => {
      const url = isEdit ? `/api/admin/products/${id}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";
      const payload = {
        ...data,
        variants: data.variants.map(({ uploading: _u, open: _o, ...v }) => v),
      };
      return fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Errore");
        return r.json();
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success(isEdit ? "Prodotto aggiornato" : "Prodotto creato");
    },
    onError: (e: Error) => setError(e.message),
  });

  // --- helpers ---
  function setField<K extends keyof ProductData>(k: K, v: ProductData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugLocked ? f.slug : slugify(name) }));
  }

  function updateVariant(vi: number, patch: Partial<VariantDraft>) {
    setForm((f) => {
      const variants = [...f.variants];
      variants[vi] = { ...variants[vi], ...patch };
      return { ...f, variants };
    });
  }

  function removeVariant(vi: number) {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== vi) }));
  }

  function addVariant() {
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { ...EMPTY_VARIANT, open: true }],
    }));
  }

  function updateSku(vi: number, si: number, patch: Partial<SkuDraft>) {
    setForm((f) => {
      const variants = [...f.variants];
      const skus = [...variants[vi].skus];
      skus[si] = { ...skus[si], ...patch };
      variants[vi] = { ...variants[vi], skus };
      return { ...f, variants };
    });
  }

  function addSku(vi: number) {
    setForm((f) => {
      const variants = [...f.variants];
      variants[vi] = {
        ...variants[vi],
        skus: [...variants[vi].skus, { ...EMPTY_SKU }],
      };
      return { ...f, variants };
    });
  }

  function removeSku(vi: number, si: number) {
    setForm((f) => {
      const variants = [...f.variants];
      variants[vi] = {
        ...variants[vi],
        skus: variants[vi].skus.filter((_, i) => i !== si),
      };
      return { ...f, variants };
    });
  }

  async function handleImageUpload(vi: number, file: File) {
    updateVariant(vi, { uploading: true });
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => {
        const variants = [...f.variants];
        variants[vi] = {
          ...variants[vi],
          imageIds: [...variants[vi].imageIds, data.publicId],
          uploading: false,
        };
        return { ...f, variants };
      });
    } catch {
      updateVariant(vi, { uploading: false });
    }
  }

  function setCoverImage(vi: number, imgIdx: number) {
    if (imgIdx === 0) return;
    setForm((f) => {
      const variants = [...f.variants];
      const imageIds = [...variants[vi].imageIds];
      const [picked] = imageIds.splice(imgIdx, 1);
      imageIds.unshift(picked);
      variants[vi] = { ...variants[vi], imageIds };
      return { ...f, variants };
    });
  }

  function removeImage(vi: number, imgIdx: number) {
    setForm((f) => {
      const variants = [...f.variants];
      variants[vi] = {
        ...variants[vi],
        imageIds: variants[vi].imageIds.filter((_, i) => i !== imgIdx),
      };
      return { ...f, variants };
    });
  }


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.slug) {
      setError("Nome e slug obbligatori.");
      return;
    }
    if (slugStatus === "taken") {
      setError("Slug già in uso.");
      return;
    }
    mutation.mutate(form);
  }

  // Derived
  const allSkus = form.variants.flatMap((v, vi) =>
    v.skus.map((s, si) => ({
      label: `${v.color || `Variante ${vi + 1}`} — EU ${s.size || "?"}`,
      key: `${vi}-${si}`,
    })),
  );

  const parentCollections = collections.filter((c) => !c.parentId);
  const childCollections = collections.filter(
    (c) => c.parentId === collectionParent,
  );
  const selectedChildId = form.collectionIds[0] ?? "";

  const defaultThumb = (() => {
    const [vi] = form.defaultSkuId.split("-").map(Number);
    return !isNaN(vi) ? (form.variants[vi]?.imageIds[0] ?? null) : null;
  })();

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2 text-muted-foreground"
          onClick={() => navigate({ to: "/products" })}
        >
          ← Prodotti
        </Button>
        <div className="flex items-center gap-4">
          {isEdit && defaultThumb && (
            <img
              src={cloudinaryImagePath(
                "w_64,h_64,c_fill,q_auto,f_auto",
                defaultThumb,
              )}
              alt=""
              className="w-16 h-16 object-cover rounded-md border border-border shrink-0"
            />
          )}
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit && form.name ? form.name : "Nuovo prodotto"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* --- Dati base --- */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Dati base
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slug">Slug</Label>
              <div className="relative">
                <Input
                  id="slug"
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setSlugLocked(true);
                    setField("slug", e.target.value);
                  }}
                  className="pr-8"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {slugStatus === "checking" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {slugStatus === "available" && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {slugStatus === "taken" && (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </span>
              </div>
              {slugLocked ? (
                <button
                  type="button"
                  onClick={() => setSlugLocked(false)}
                  className="text-xs text-muted-foreground underline self-start"
                >
                  Rigenera da nome
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Generato automaticamente dal nome
                </p>
              )}
            </div>
          </div>

          <div className="flex  gap-4 max-w-56">
            <div className="flex flex-col gap-1.5">
              <Label>Genere</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => setField("gender", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Uomo</SelectItem>
                  <SelectItem value="W">Donna</SelectItem>
                  <SelectItem value="U">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Brand</Label>
              <Select
                value={form.brandId}
                onValueChange={(v) => setField("brandId", v ?? "")}
              >
                <SelectTrigger>
                  <span className={form.brandId ? "" : "text-muted-foreground"}>
                    {brands.find((b) => b.id === form.brandId)?.name ??
                      "Seleziona…"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrizione breve</Label>
            <Textarea
              id="description"
              rows={2}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Descrizione lunga</Label>
            <RichTextEditor
              value={form.longDescription}
              onChange={(html) => setField("longDescription", html)}
            />
          </div>
        </section>

        <Separator />

        {/* --- Attività --- */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Attività
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {ACTIVITIES.map((a) => (
              <div key={a} className="flex items-center gap-2">
                <Checkbox
                  id={`act-${a}`}
                  checked={form.activity.includes(a)}
                  onCheckedChange={(checked) =>
                    setField(
                      "activity",
                      checked
                        ? [...form.activity, a]
                        : form.activity.filter((x) => x !== a),
                    )
                  }
                />
                <label htmlFor={`act-${a}`} className="text-sm cursor-pointer">
                  {a}
                </label>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* --- Collezioni --- */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Collezioni
          </h2>
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 ">
              <Label>Categoria padre</Label>
              <Select
                value={collectionParent}
                onValueChange={(v) => {
                  setCollectionParent(v ?? "");
                  setField("collectionIds", []);
                }}
              >
                <SelectTrigger>
                  <span
                    className={collectionParent ? "" : "text-muted-foreground"}
                  >
                    {parentCollections.find((c) => c.id === collectionParent)
                      ?.label ?? "Seleziona…"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {parentCollections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Categoria figlio</Label>
              <Select
                value={selectedChildId}
                onValueChange={(v) => setField("collectionIds", v ? [v] : [])}
                disabled={!collectionParent || childCollections.length === 0}
              >
                <SelectTrigger>
                  <span
                    className={selectedChildId ? "" : "text-muted-foreground"}
                  >
                    {childCollections.find((c) => c.id === selectedChildId)
                      ?.label ?? "Seleziona…"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {childCollections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <Separator />

        {/* --- Varianti --- */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Varianti
          </h2>

          {form.variants.map((variant, vi) => (
            <Collapsible
              key={vi}
              open={variant.open}
              onOpenChange={(open) => updateVariant(vi, { open })}
              className="border border-border rounded-lg"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 cursor-pointer hover:bg-accent/50 rounded-lg transition-colors text-left">
                <div className="flex items-center gap-2.5 text-sm font-medium">
                  {variant.open ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  {variant.imageIds[0] && (
                    <img
                      src={cloudinaryImagePath(
                        "w_32,h_32,c_fill,q_auto,f_auto",
                        variant.imageIds[0],
                      )}
                      alt=""
                      className="w-8 h-8 rounded object-cover border border-border shrink-0"
                    />
                  )}
                  {variant.color || `Variante ${vi + 1}`}
                  {variant.skus.length > 0 && (
                    <span className="text-xs text-muted-foreground font-normal">
                      · {variant.skus.length} taglie
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeVariant(vi);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-4 pb-4 flex flex-col gap-4 border-t border-border pt-4">
                  <div className="flex flex-col gap-1.5">
                    <Label>Colore</Label>
                    <Input
                      placeholder="es. Rosso, Nero/Giallo…"
                      value={variant.color}
                      onChange={(e) =>
                        updateVariant(vi, { color: e.target.value })
                      }
                    />
                  </div>

                  {/* Images */}
                  <div className="flex flex-col gap-2">
                    <Label>Immagini</Label>
                    <div className="flex flex-wrap gap-2 items-start">
                      {variant.imageIds.map((pid, imgIdx) => (
                        <div
                          key={pid}
                          className="relative group w-20 h-20 shrink-0"
                        >
                          <img
                            src={cloudinaryImagePath(
                              "w_80,h_80,c_fill,q_auto,f_auto",
                              pid,
                            )}
                            alt=""
                            className={cn(
                              "w-20 h-20 object-cover rounded-md border",
                              imgIdx === 0 ? "border-primary" : "border-border",
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(vi, imgIdx)}
                            className="absolute -top-1.5 -right-1.5 hidden group-hover:flex bg-background border border-border rounded-full w-5 h-5 items-center justify-center"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {imgIdx === 0 ? (
                            <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                              Cover
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCoverImage(vi, imgIdx)}
                              className="absolute bottom-1 left-1 hidden group-hover:block text-[10px] bg-black/60 text-white px-1 rounded hover:bg-black/80"
                            >
                              Imposta cover
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[vi]?.click()}
                        disabled={variant.uploading}
                        className="w-20 h-20 border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        {variant.uploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            <span className="text-[10px]">Aggiungi</span>
                          </>
                        )}
                      </button>
                      <input
                        ref={(el) => {
                          fileInputRefs.current[vi] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(vi, file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>

                  {/* SKUs */}
                  <div className="flex flex-col gap-2">
                    <Label>Taglie / Prezzi</Label>
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground px-1">
                        <span>Taglia (EU)</span>
                        <span>Prezzo (€)</span>
                        <span>Magazzino</span>
                        <span />
                      </div>
                      {variant.skus.map((sku, si) => (
                        <div
                          key={si}
                          className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center"
                        >
                          <Input
                            type="number"
                            placeholder="42"
                            value={sku.size}
                            onChange={(e) =>
                              updateSku(vi, si, { size: e.target.value })
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={sku.price}
                            onChange={(e) =>
                              updateSku(vi, si, { price: e.target.value })
                            }
                          />
                          <Input
                            type="number"
                            placeholder="0"
                            value={sku.stockQty}
                            onChange={(e) =>
                              updateSku(vi, si, { stockQty: e.target.value })
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSku(vi, si)}
                            disabled={variant.skus.length === 1}
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSku(vi)}
                        className="self-start"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Aggiungi taglia
                      </Button>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addVariant}
            className="self-start"
          >
            <Plus className="h-4 w-4 mr-1" /> Aggiungi variante
          </Button>
        </section>

        {/* --- Default SKU --- */}
        {allSkus.length > 0 && (
          <>
            <Separator />
            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                SKU predefinito
              </h2>
              <p className="text-xs text-muted-foreground">
                Determina il prezzo e l'immagine mostrati nel catalogo.
              </p>
              <Select
                value={form.defaultSkuId}
                onValueChange={(v) => setField("defaultSkuId", v ?? "")}
              >
                <SelectTrigger className="max-w-sm">
                  <span
                    className={form.defaultSkuId ? "" : "text-muted-foreground"}
                  >
                    {allSkus.find((s) => s.key === form.defaultSkuId)?.label ??
                      "Seleziona…"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {allSkus.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
          </>
        )}

        <Separator />

        {/* --- Pubblicato --- */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="published" className="text-sm font-medium">Pubblicato</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {form.published ? "Visibile nel negozio" : "Non visibile nel negozio"}
            </p>
          </div>
          <Switch
            id="published"
            checked={form.published}
            onCheckedChange={(v) => setField("published", v)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={mutation.isPending || slugStatus === "taken"}
          >
            {mutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isEdit ? "Salva modifiche" : "Crea prodotto"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: "/products" })}
          >
            Annulla
          </Button>
        </div>
      </form>
    </div>
  );
}
