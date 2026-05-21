import React from "react";
import { cloudinaryImagePath } from "../../lib/cloudinary";
import type { Products, Variants, Skus, Brands } from "astro:db";
import { addToCart } from "../cart/cartStore";
import { toast } from "../toasts/toast";

type Product = typeof Products.$inferSelect;
type Variant = typeof Variants.$inferSelect;
type Sku = typeof Skus.$inferSelect;
type Brand = typeof Brands.$inferSelect;

export type VariantWithSkus = Variant & { skus: Sku[] };

interface Props {
  product: Product;
  variants: VariantWithSkus[];
  brand: Brand | null;
}

export default function Product({ product, variants, brand }: Props) {
  const { variant: defaultV, sku: defaultS } = findDefault(
    variants,
    product.defaultSkuId,
  );

  const [variant, setVariant] = React.useState<VariantWithSkus>(defaultV);
  const [sku, setSku] = React.useState<Sku>(defaultS);

  const imageIds = (variant.imageIds as string[] | null) ?? [];
  const [activeImageId, setActiveImageId] = React.useState<string | null>(
    imageIds[0] ?? null,
  );

  // Sizes come only from the active color variant
  const uniqueSizes = [
    ...new Set(
      variant.skus.map((s) => s.size).filter((s): s is number => s != null),
    ),
  ];

  const isSizeDisabled = (size: number) =>
    !variant.skus.some((s) => s.size === size && s.stockQty > 0);

  const selectVariant = (v: VariantWithSkus) => {
    const nextSku =
      v.skus.find((s) => s.size === sku.size && s.stockQty > 0) ||
      v.skus.find((s) => s.stockQty > 0) ||
      v.skus[0];
    const nextImages = (v.imageIds as string[] | null) ?? [];
    setVariant(v);
    setSku(nextSku);
    setActiveImageId(nextImages[0] ?? null);
  };

  const selectSize = (size: number) => {
    const nextSku = variant.skus.find((s) => s.size === size);
    if (nextSku) setSku(nextSku);
  };

  return (
    <div className="flex flex-col md:flex-row gap-16 max-w-290 mx-auto">
      <article className="order-2">
        <header>
          <h1 className="text-4xl font-extrabold">{product.name}</h1>
          {brand && <p className="text-sm text-gray-500">{brand.name}</p>}
        </header>
        <p className="mt-4 text-balance">{product.description}</p>
        <div className="mt-8">
          <p className="text-2xl font-bold">€{sku.price.toFixed(2)}</p>
          <p className="text-sm text-gray-500">
            {sku.stockQty > 0 ? `${sku.stockQty} in stock` : "Out of stock"}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {variants.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                Color:{" "}
                <span className="font-normal text-gray-500">
                  {variant.color}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const isActive = variant.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      title={v.color ?? undefined}
                      onClick={() => selectVariant(v)}
                      className={[
                        "relative w-12 h-12 rounded overflow-hidden border-2 transition cursor-pointer",
                        isActive
                          ? "border-gray-900 ring-2 ring-gray-900 ring-offset-1"
                          : "border-gray-200 hover:border-gray-500",
                      ].join(" ")}
                    >
                      <img
                        src={cloudinaryImagePath(
                          "w_48,h_48,c_fill,q_auto,f_auto",
                          (v.imageIds as string[] | null)?.[0],
                        )}
                        alt={v.color ?? ""}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {uniqueSizes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Size</p>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size) => {
                  const isActive = sku.size === size;
                  const disabled = isSizeDisabled(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectSize(size)}
                      className={[
                        "relative min-w-12 h-10 px-3 rounded border text-sm font-medium transition overflow-hidden",
                        isActive
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-900",
                        disabled
                          ? "text-gray-300 border-gray-200 cursor-not-allowed"
                          : "cursor-pointer",
                      ].join(" ")}
                    >
                      {size}
                      {disabled && <DiagonalStrike />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            className="button"
            onClick={() => {
              addToCart(sku, variant);
              toast.success("Added to cart");
            }}
            disabled={sku.stockQty === 0}
          >
            Add to Cart
          </button>
        </div>
      </article>

      <aside className="order-1 flex flex-col gap-3">
        <img
          src={cloudinaryImagePath(
            "w_400,h_400,c_fill,q_auto,f_auto",
            activeImageId,
          )}
          alt={product.name}
          className="w-96 h-96 object-cover rounded"
        />
        {imageIds.length > 1 && (
          <div className="flex gap-2">
            {imageIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveImageId(id)}
                className={[
                  "w-16 h-16 rounded overflow-hidden border-2 transition cursor-pointer",
                  activeImageId === id
                    ? "border-gray-900"
                    : "border-transparent hover:border-gray-400",
                ].join(" ")}
              >
                <img
                  src={cloudinaryImagePath(
                    "w_64,h_64,c_fill,q_auto,f_auto",
                    id,
                  )}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

function DiagonalStrike() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
    >
      <line
        x1="0"
        y1="100%"
        x2="100%"
        y2="0"
        stroke="#d1d5db"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function findDefault(variants: VariantWithSkus[], defaultSkuId: string) {
  for (const v of variants) {
    const sku = v.skus.find((s) => s.id === defaultSkuId);
    if (sku) return { variant: v, sku };
  }
  return { variant: variants[0], sku: variants[0].skus[0] };
}
