import type { Collections, Brands } from "astro:db";
import type { MenuItem, TopLevelItem } from "./types";

type CollectionRow = typeof Collections.$inferSelect;
type BrandRow = typeof Brands.$inferSelect;

function buildSection(
  rows: CollectionRow[],
  section: string,
  rootId: string,
): TopLevelItem {
  const subset = rows.filter((r) => r.section === section);
  const root = subset.find((r) => r.id === rootId);

  const items: MenuItem[] = subset
    .filter((r) => r.parentId === rootId)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((r) => ({
      label: r.label,
      href: `/catalogue?collection=${r.id}`,
    }));

  return {
    label: root?.label ?? rootId,
    href: `/catalogue?collection=${rootId}`,
    columns: [items],
  };
}

export function buildMenu(rows: CollectionRow[], brands: BrandRow[]): TopLevelItem[] {
  const brandItems: MenuItem[] = [...brands]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((b) => ({ label: b.name, href: `/catalogue?brand=${b.slug}` }));

  return [
    buildSection(rows, "abbigliamento", "abbigliamento"),
    buildSection(rows, "scarpe", "calzature"),
    buildSection(rows, "attrezzatura", "attrezzatura"),
    buildSection(rows, "accessori", "accessori"),
    { label: "Marchi", href: "/brands", columns: [] },
  ];
}
