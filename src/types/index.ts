export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  base_price: number;
  retail_price: number;
  status?: string;

  // Champ "officiel" attendu par ton front
  category_id: string;

  // Colonne "categories" (peut être string, objet ou tableau selon NocoDB)
  categories?: unknown;

  // Variantes imbriquées (NocoDB nested)
  product_variants?: Variant[];

  image_url: string;
  brand: string;
  images?: string[];
};

export type Variant = {
  id: string;
  product_id: string;
  sku: string;
  option1_name: string;
  option1_value: string;
  price: number;
  stock_quantity: number;
  cj_vid: string;
};

export type CartItem = {
  product: Product;
  variant: Variant;
  quantity: number;
};
