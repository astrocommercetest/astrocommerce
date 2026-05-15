export type CatalogueProduct = {
  id: string;
  name: string;
  slug: string;
  gender: string | null;
  brandId: string;
  collectionIds: string[];
  activity: string[];
  price: number;
  imageId: string | null;
};

export type ActiveFilters = {
  collection: string | null;
  gender: string | null;
  activity: string | null;
  brand: string | null;
};

export type FilterOption = {
  id: string;
  label: string;
};

export const ACTIVITIES: FilterOption[] = [
  { id: "alpinismo",    label: "Alpinismo" },
  { id: "scialpinismo", label: "Scialpinismo" },
  { id: "trekking",     label: "Trekking" },
  { id: "hiking",       label: "Hiking" },
  { id: "arrampicata",  label: "Arrampicata" },
  { id: "trail-running", label: "Trail running" },
];

export const GENDERS: FilterOption[] = [
  { id: "M", label: "Uomo" },
  { id: "W", label: "Donna" },
  { id: "U", label: "Unisex" },
];

export type PaginationInfo = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
};
