export type MenuItem = {
  label: string;
  href: string;
  children?: MenuItem[];
};

export type TopLevelItem = {
  label: string;
  href: string;
  columns: MenuItem[][];
};
