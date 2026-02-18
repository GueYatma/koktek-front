import type { Category, Product, Variant } from "../types";
import { resolveImageUrl } from "../utils/image";

const DIRECTUS_BASE_URL = "http://82.29.173.57:8055";
const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN as
  | string
  | undefined;

type DirectusListResponse<T> = {
  data: T[];
};

type VariantWithImage = Variant & {
  image_url?: string;
};

const toStringValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
};

const toNumberValue = (value: unknown) => {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const extractId = (value: unknown): string => {
  if (Array.isArray(value) && value.length > 0) {
    return extractId(value[0]);
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value && typeof value === "object" && "id" in value) {
    return toStringValue((value as { id?: unknown }).id);
  }
  return "";
};

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const extractImageValues = (value: unknown): string[] => {
  if (!value) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractImageValues(parsed);
      } catch {
        return [trimmed];
      }
    }
    if (trimmed.includes(",")) {
      return trimmed
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }
    return [trimmed];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractImageValues(entry));
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return extractImageValues(record.data);
    }
    if (typeof record.url === "string") return [record.url];
    if (typeof record.path === "string") return [record.path];
    if (typeof record.id === "string" || typeof record.id === "number") {
      return [String(record.id)];
    }
  }
  return [];
};

const fetchDirectusItems = async <T>(
  collection: string,
  params: Record<string, string> = {},
): Promise<T[]> => {
  const endpoint = new URL(`/items/${collection}`, DIRECTUS_BASE_URL);
  endpoint.searchParams.set("limit", "-1");
  endpoint.searchParams.set("fields", "*");
  Object.entries(params).forEach(([key, value]) => {
    endpoint.searchParams.set(key, value);
  });

  const response = await fetch(endpoint.toString(), {
    headers: DIRECTUS_TOKEN
      ? {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        }
      : undefined,
  });
  if (!response.ok) {
    throw new Error(`Directus ${collection} error: ${response.status}`);
  }

  const payload = (await response.json()) as DirectusListResponse<T>;
  return Array.isArray(payload.data) ? payload.data : [];
};

const mapCategory = (row: Record<string, unknown>): Category => {
  const name = toStringValue(
    row.name ?? row.Name ?? row.title ?? row.Title ?? row.nom ?? row.Nom,
  );
  const slug =
    toStringValue(row.slug ?? row.Slug) || createSlug(name) || extractId(row.id);
  const id =
    extractId(
      row.id ?? row.ID ?? row.Id ?? row.category_id ?? row.categoryId,
    ) || slug;

  return {
    id,
    name,
    slug,
    image_url: toStringValue(row.image_url ?? row.imageUrl ?? row.image),
  };
};

const mapVariant = (row: Record<string, unknown>): VariantWithImage => {
  return {
    id: extractId(row.id ?? row.ID ?? row.Id),
    product_id: extractId(
      row.product_id ??
        row.productId ??
        row.products_id ??
        row.productsId ??
        row.product ??
        row.products,
    ),
    sku: toStringValue(row.sku ?? row.SKU),
    option1_name: toStringValue(
      row.option1_name ?? row.optionName ?? row.option,
    ),
    option1_value: toStringValue(
      row.option1_value ?? row.optionValue ?? row.value,
    ),
    price: toNumberValue(row.price ?? row.Price ?? row.base_price),
    stock_quantity: toNumberValue(
      row.stock_quantity ?? row.stockQuantity ?? row.quantity,
    ),
    cj_vid: toStringValue(row.cj_vid ?? row.cjVid ?? row.vendor_id),
    image_url: toStringValue(row.image_url ?? row.imageUrl ?? row.image),
  };
};

const mapProduct = (
  row: Record<string, unknown>,
  categoriesById: Map<string, Category>,
  variantsByProductId: Map<string, VariantWithImage[]>,
): Product => {
  const title = toStringValue(row.title ?? row.name);
  const slug =
    toStringValue(row.slug) || createSlug(title) || extractId(row.id);
  const id = extractId(row.id ?? row.ID ?? row.Id) || slug;

  const categoryId = extractId(
    row.categories_id ??
      row.categoriesId ??
      row.category_id ??
      row.categoryId ??
      row.categorie_id ??
      row.categorieId ??
      row.category ??
      row.categories,
  );

  const categoryFromMap = categoryId
    ? categoriesById.get(String(categoryId))
    : undefined;
  const categoryFallback = (row.category ?? row.categories) as
    | Record<string, unknown>
    | undefined;

  const categoriesValue =
    categoryFromMap ?? categoryFallback ?? toStringValue(row.category_name);

  const brand = toStringValue(
    row.brand ?? row.Brand ?? row.marque ?? row.Marque,
  ).trim();

  const rawImage = toStringValue(
    row.image ?? row.image_url ?? row.imageUrl ?? row.Image,
  );
  const imagesRaw = extractImageValues(
    row.images ?? row.image_urls ?? row.gallery ?? row.Images,
  );
  const resolvedImages = imagesRaw
    .map((entry) => resolveImageUrl(entry, ""))
    .filter((entry) => entry.length > 0);
  const fallbackImage = resolveImageUrl(rawImage);
  const images =
    resolvedImages.length > 0 ? resolvedImages : fallbackImage ? [fallbackImage] : [];
  const imageUrl = images[0] ?? fallbackImage;

  const productVariants = variantsByProductId.get(id) ?? [];

  return {
    id,
    title,
    slug,
    description: toStringValue(row.description),
    base_price: toNumberValue(
      row.base_price ?? row.basePrice ?? row.price ?? row.Price,
    ),
    retail_price: toNumberValue(
      row.retail_price ??
        row.retailPrice ??
        row.retail ??
        row.RetailPrice ??
        row.base_price ??
        row.basePrice ??
        row.price ??
        row.Price,
    ),
    status: toStringValue(
      row.status ?? row.Status ?? row.STATUS ?? row.state ?? row.State ?? row.STATE,
    ),
    category_id: categoryId ? String(categoryId) : "",
    categories: categoriesValue,
    product_variants: productVariants,
    image_url: imageUrl,
    images,
    brand: brand.length > 0 ? brand : "Générique",
  };
};

export const getAllProducts = async (): Promise<{
  products: Product[];
  categories: Category[];
  variants: Variant[];
}> => {
  const data = await fetchDirectusItems<Record<string, unknown>>("products");

  console.log("RAW DATA PRODUCT:", data[0]);

  const fetchCategories = async (): Promise<Record<string, unknown>[]> => {
    try {
      const rows = await fetchDirectusItems<Record<string, unknown>>(
        "categories",
      );
      if (rows.length > 0) return rows;
    } catch (error) {
      console.error("Directus categories error", error);
    }
    try {
      const rows = await fetchDirectusItems<Record<string, unknown>>(
        "Categories",
      );
      return rows;
    } catch (error) {
      console.error("Directus Categories error", error);
      return [];
    }
  };

  const [categoriesResult, variantsResult] = await Promise.allSettled([
    fetchCategories(),
    fetchDirectusItems<Record<string, unknown>>("product_variants"),
  ]);

  if (variantsResult.status === "rejected") {
    console.error("Directus product_variants error", variantsResult.reason);
  }

  const categoriesRaw =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const variantsRaw =
    variantsResult.status === "fulfilled" ? variantsResult.value : [];

  const categories = categoriesRaw
    .map(mapCategory)
    .filter((category) => category.id && category.name);

  const categoriesById = new Map(
    categories.map((category) => [String(category.id), category]),
  );

  const variants = variantsRaw
    .map(mapVariant)
    .filter((variant) => variant.id && variant.product_id);

  const variantsByProductId = new Map<string, VariantWithImage[]>();
  variants.forEach((variant) => {
    const productId = String(variant.product_id);
    const next = variantsByProductId.get(productId) ?? [];
    next.push(variant);
    variantsByProductId.set(productId, next);
  });

  const products = data
    .map((row) => mapProduct(row, categoriesById, variantsByProductId))
    .filter((product) => {
      const statusValue = (product.status ?? "").trim();
      if (!statusValue) return true;
      return statusValue.toLowerCase() === "published";
    });

  return {
    products,
    categories,
    variants,
  };
};
