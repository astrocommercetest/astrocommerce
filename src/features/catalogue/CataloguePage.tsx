import React from "react";
import { cloudinaryImagePath } from "../../lib/cloudinary";
import type {
  CatalogueProduct,
  ActiveFilters,
  FilterOption,
  PaginationInfo,
} from "./types";
import { ACTIVITIES, GENDERS } from "./types";

type Collection = {
  id: string;
  label: string;
  parentId: string | null;
  section: string | null;
  position: number | null;
};

type Crumb = { label: string; href: string };

interface Props {
  products: CatalogueProduct[];
  subcollections: Collection[];
  brandOptions: FilterOption[];
  activeFilters: ActiveFilters;
  breadcrumb: Crumb[];
  pagination: PaginationInfo;
}

export default function CataloguePage({
  products,
  subcollections,
  brandOptions,
  activeFilters,
  breadcrumb,
  pagination,
}: Props) {
  const [pending, setPending] = React.useState<ActiveFilters>({
    ...activeFilters,
  });

  const toggle = (key: keyof ActiveFilters, value: string) =>
    setPending((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));

  const isDirty =
    pending.gender !== activeFilters.gender ||
    pending.activity !== activeFilters.activity ||
    pending.brand !== activeFilters.brand;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">
        {breadcrumb[breadcrumb.length - 1]?.label ?? "Catalogo"}
      </h1>
      {/* Breadcrumb */}
      {breadcrumb.length > 1 && (
        <div className="border-b border-gray-200 pb-2 mb-8 text-gray-400 flex items-center gap-2 text-sm">
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={crumb.href}>
              {i > 0 && <span>/</span>}

              <a href={crumb.href} className="hover:text-gray-700">
                {crumb.label}
              </a>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex gap-10">
        {/* Filter sidebar */}
        <aside className="w-48 shrink-0 flex flex-col gap-6">
          {/* Subcategory chips — navigate immediately, no Apply needed */}
          {subcollections.length > 0 && (
            <Section>
              <SectionTitle>Sottocategorie</SectionTitle>
              {subcollections.map((sub) => (
                <a
                  key={sub.id}
                  href={buildUrl({ ...activeFilters, collection: sub.id })}
                  className="text-sm"
                >
                  {sub.label}
                </a>
              ))}
            </Section>
          )}
          <FilterSection
            title="Genere"
            options={GENDERS}
            activeId={pending.gender}
            onToggle={(id) => toggle("gender", id)}
          />
          <FilterSection
            title="Attività"
            options={ACTIVITIES}
            activeId={pending.activity}
            onToggle={(id) => toggle("activity", id)}
          />
          {brandOptions.length > 0 && (
            <FilterSection
              title="Marchio"
              options={brandOptions}
              activeId={pending.brand}
              onToggle={(id) => toggle("brand", id)}
            />
          )}

          <a
            href={buildUrl(pending)}
            className={[
              "button text-center",
              !isDirty ? "opacity-40 pointer-events-none" : "",
            ].join(" ")}
          >
            Applica filtri
          </a>

          {(activeFilters.gender ||
            activeFilters.activity ||
            activeFilters.brand) && (
            <a
              href={buildUrl({
                ...activeFilters,
                gender: null,
                activity: null,
                brand: null,
              })}
              className="text-xs text-center text-gray-400 hover:text-gray-700 underline"
            >
              Rimuovi filtri
            </a>
          )}
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <p className="text-sm text-gray-500 mt-4">
              Nessun prodotto trovato.
            </p>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                {products.map((product) => (
                  <li key={product.id}>
                    <a
                      href={`/products/${product.slug}`}
                      className="group block"
                    >
                      <img
                        src={cloudinaryImagePath(
                          "w_400,h_400,c_fill,q_auto,f_auto",
                          product.imageId,
                        )}
                        alt={product.name}
                        className="w-full aspect-square object-cover rounded"
                      />
                      <div className="mt-2">
                        <p className="text-sm font-medium group-hover:underline">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          €{product.price.toFixed(2)}
                        </p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>

              {pagination.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {pagination.total} prodotti · pagina {pagination.page} di{" "}
                    {pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    {pagination.page > 1 && (
                      <a
                        href={buildUrl(activeFilters, pagination.page - 1)}
                        className="px-4 py-2 border border-gray-300 rounded hover:border-gray-900 transition"
                      >
                        ← Precedente
                      </a>
                    )}
                    {pagination.page < pagination.totalPages && (
                      <a
                        href={buildUrl(activeFilters, pagination.page + 1)}
                        className="px-4 py-2 border border-gray-300 rounded hover:border-gray-900 transition"
                      >
                        Successiva →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  options,
  activeId,
  onToggle,
}: {
  title: string;
  options: FilterOption[];
  activeId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <Section>
      <SectionTitle>{title}</SectionTitle>
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => (
          <label
            key={opt.id}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={activeId === opt.id}
              onChange={() => onToggle(opt.id)}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 cursor-pointer accent-gray-900"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </Section>
  );
}

function buildUrl(filters: ActiveFilters, page?: number): string {
  const params = new URLSearchParams();
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.activity) params.set("activity", filters.activity);
  if (filters.brand) params.set("brand", filters.brand);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/catalogue?${qs}` : "/catalogue";
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
      {children}
    </h2>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className=" border-b border-gray-200 pb-6 flex flex-col gap-2">
      {children}
    </div>
  );
}
