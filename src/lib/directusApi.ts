import type {
  Category,
  Product,
  ShippingOption,
  ShippingOptions,
  Variant,
} from "../types";
import { DIRECTUS_BASE_URL } from "../utils/directus";
import { resolveImageUrl } from "../utils/image";
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

const toShippingOption = (value: unknown): ShippingOption | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name =
    typeof record.name === "string"
      ? record.name
      : typeof record.label === "string"
        ? record.label
        : undefined;
  const price =
    record.price !== undefined ? toNumberValue(record.price) : undefined;
  const days = record.days !== undefined ? toNumberValue(record.days) : undefined;

  if (!name && price === undefined && days === undefined) return null;
  return { name, price, days };
};

const normalizeShippingOptions = (value: unknown): ShippingOptions | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normalizeShippingOptions(parsed);
    } catch {
      return undefined;
    }
  }
  if (Array.isArray(value)) {
    const list = value
      .map((entry) => toShippingOption(entry))
      .filter((entry): entry is ShippingOption => Boolean(entry));
    return list.length > 0 ? { list } : undefined;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const listValue =
      record.list ?? record.options ?? record.items ?? record.shipping_options;
    if (Array.isArray(listValue)) {
      const list = listValue
        .map((entry) => toShippingOption(entry))
        .filter((entry): entry is ShippingOption => Boolean(entry));
      return list.length > 0 ? { list } : undefined;
    }
    const single = toShippingOption(record);
    return single ? { list: [single] } : undefined;
  }
  return undefined;
};

const fetchDirectusItems = async <T>(
  collection: string,
  params: Record<string, string> = {},
): Promise<T[]> => {
  const endpoint = new URL(`/items/${collection}`, DIRECTUS_BASE_URL);
  if (!("limit" in params)) {
    endpoint.searchParams.set("limit", "-1");
  }
  if (!("fields" in params)) {
    endpoint.searchParams.set("fields", "*");
  }
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
      row.option1_value_factorized ??
        row.option1_value ??
        row.optionValue ??
        row.value,
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
  const expertStarsRaw =
    row.expert_score ??
    row.expertScore ??
    row.expert_stars ??
    row.expertStars ??
    row.ai_stars ??
    row.aiStars ??
    row.expert_rating ??
    row.expertRating;
  const expertReviewRaw =
    row.expert_review ??
    row.expertReview ??
    row.ai_review ??
    row.aiReview ??
    row.expert_verdict ??
    row.expertVerdict;
  const shippingOptionsRaw =
    row.shipping_options ?? row.shippingOptions ?? row.shipping;
  const shippingOptions = normalizeShippingOptions(shippingOptionsRaw);

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
    expert_stars:
      typeof expertStarsRaw === "number" ||
      typeof expertStarsRaw === "string"
        ? expertStarsRaw
        : undefined,
    expert_review:
      typeof expertReviewRaw === "string" ? expertReviewRaw : undefined,
    shipping_options: shippingOptions,
  };
};

const fetchCategoriesRaw = async (): Promise<Record<string, unknown>[]> => {
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

export const getAllCategories = async (): Promise<Category[]> => {
  const rows = await fetchCategoriesRaw();
  return rows
    .map(mapCategory)
    .filter((category) => category.id && category.name);
};

export const getCatalogProducts = async (input: {
  categoryId?: string;
  brand?: string;
  limit?: number;
  categories?: Category[];
}): Promise<{
  products: Product[];
  categories: Category[];
  variants: Variant[];
}> => {
  const limitValue = input.limit ?? 50;
  const params: Record<string, string> = {
    limit: String(limitValue),
    fields: "*",
  };

  let andIndex = 0;
  const addOrFilter = (fields: string[], value: string) => {
    fields.forEach((field, index) => {
      params[`filter[_and][${andIndex}][_or][${index}][${field}][_eq]`] =
        value;
    });
    andIndex += 1;
  };

  const categories =
    input.categories && input.categories.length > 0
      ? input.categories
      : await getAllCategories();

  if (input.categoryId) {
    // Le front-end envoie l'UUID, mais en base la colonne categories_id contient le nom (ex: "Coques & Protections").
    // On doit donc retrouver le nom de la catégorie pour filtrer correctement.
    const matchingCategory = categories.find((c) => String(c.id) === String(input.categoryId));
    const filterValue = matchingCategory ? matchingCategory.name : input.categoryId;
    addOrFilter(["categories_id", "category_id"], filterValue);
  }

  if (input.brand) {
    addOrFilter(["brand", "marque"], input.brand);
  }

  const productsRaw = await fetchDirectusItems<Record<string, unknown>>("products", params);

  const productIds = productsRaw
    .map((row) => extractId(row.id ?? row.ID ?? row.Id))
    .filter(Boolean);

  const variantsRaw =
    productIds.length > 0
      ? await fetchDirectusItems<Record<string, unknown>>("product_variants", {
          "filter[product_id][_in]": productIds.join(","),
        })
      : [];

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

  const products = productsRaw
    .map((row) => mapProduct(row, categoriesById, variantsByProductId))
    .filter((product) => {
      const statusValue = (product.status ?? "").trim();
      if (!statusValue) return true;
      return statusValue.toLowerCase() === "published";
    });

  return { products, categories, variants };
};

export const getAllProducts = async (): Promise<{
  products: Product[];
  categories: Category[];
  variants: Variant[];
}> => {
  const data = await fetchDirectusItems<Record<string, unknown>>("products");

  console.log("RAW DATA PRODUCT:", data[0]);

  const [categoriesResult, variantsResult] = await Promise.allSettled([
    fetchCategoriesRaw(),
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
