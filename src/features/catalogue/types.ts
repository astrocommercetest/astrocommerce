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
  gender: string[];
  activity: string[];
  brand: string[];
};

export type FilterOption = {
  id: string;
  label: string;
};


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
