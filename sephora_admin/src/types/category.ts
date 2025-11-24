export interface Category {
  category_id: number;
  category_name: string;
  parent?: Category | null;
  children?: Category[];
}
