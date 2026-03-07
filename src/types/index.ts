export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string;
};

export type ShippingOption = {
  name?: string;
  price?: number;
  days?: string | number;
};

export type ShippingOptions = {
  list: ShippingOption[];
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  base_price: number;
  retail_price: number;
  prix_calcule?: number;
  status?: string;
  expert_stars?: number | string;
  expert_review?: string;
  shipping_options?: ShippingOptions;

  // Champ "officiel" attendu par ton front
  category_id: string;

  // Colonne "categories" (peut être string, objet ou tableau selon NocoDB)
  categories?: unknown;

  // Variantes imbriquées (NocoDB nested)
  product_variants?: Variant[];

  image_url: string;
  brand: string;
  images?: string[];
  created_at?: string;
};

export type Variant = {
  id: string;
  product_id: string;
  sku: string;
  option1_name: string;
  option1_value: string;
  price: number;
  prix_calcule?: number;
  stock_quantity: number;
  cj_vid: string;
  weight_grams?: number;
  image_url?: string | null;
};

export type CartItem = {
  product: Product;
  variant: Variant;
  quantity: number;
  shippingOption?: ShippingOption;
};
