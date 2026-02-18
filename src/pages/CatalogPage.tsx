import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";
import type { Category, Product } from "../types";

// 🚨 TEMPORAIRE : Configuration "En Dur" pour débloquer l'affichage
const FIXED_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Coques & Protections",
    slug: "coques-protections",
    image_url: "",
  },
  { id: "2", name: "Charge & Énergie", slug: "charge-energie", image_url: "" },
  { id: "3", name: "Audio & Son", slug: "audio-son", image_url: "" },
  {
    id: "4",
    name: "Supports & Fixations",
    slug: "supports-fixations",
    image_url: "",
  },
  {
    id: "5",
    name: "Décoration & Goodies",
    slug: "decoration-goodies",
    image_url: "",
  },
  { id: "6", name: "Autres", slug: "autres", image_url: "" },
];

const GENERIC_BRAND = "Générique";
const BRAND_FILTERS = [
  "Toutes",
  "Apple",
  "Samsung",
  "Xiaomi",
  "Redmi",
  "Huawei",
  "Honor",
  "Google Pixel",
  "Oppo",
  "Sony",
  "Autres",
];

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const CATEGORY_ID_BY_KEY = new Map<string, string>([
  [normalizeKey("Coques & Protections"), "3e40840a-5111-44ef-b264-a75b836b9138"],
  [normalizeKey("coques-protections"), "3e40840a-5111-44ef-b264-a75b836b9138"],
  [normalizeKey("Charge & Énergie"), "81c1a551-4ce4-40f7-a096-e85fc9f74a71"],
  [normalizeKey("charge-energie"), "81c1a551-4ce4-40f7-a096-e85fc9f74a71"],
  [normalizeKey("Audio & Son"), "64900192-a354-41c1-8f35-a1d13299352e"],
  [normalizeKey("audio-son"), "64900192-a354-41c1-8f35-a1d13299352e"],
  [normalizeKey("Supports & Fixations"), "46484275-e161-4bef-8a71-f67d51cb639f"],
  [normalizeKey("supports-fixations"), "46484275-e161-4bef-8a71-f67d51cb639f"],
  [normalizeKey("Décoration & Goodies"), "2070f06d-c3e0-4253-947d-374f8f46368a"],
  [normalizeKey("decoration-goodies"), "2070f06d-c3e0-4253-947d-374f8f46368a"],
  [normalizeKey("Autres"), "7167a98a-60dd-4f78-9a56-e206813d4a3c"],
  [normalizeKey("autres"), "7167a98a-60dd-4f78-9a56-e206813d4a3c"],
]);

const CATEGORY_NAME_BY_ID = new Map<string, string>([
  ["3e40840a-5111-44ef-b264-a75b836b9138", "Coques & Protections"],
  ["81c1a551-4ce4-40f7-a096-e85fc9f74a71", "Charge & Énergie"],
  ["64900192-a354-41c1-8f35-a1d13299352e", "Audio & Son"],
  ["46484275-e161-4bef-8a71-f67d51cb639f", "Supports & Fixations"],
  ["2070f06d-c3e0-4253-947d-374f8f46368a", "Décoration & Goodies"],
  ["7167a98a-60dd-4f78-9a56-e206813d4a3c", "Autres"],
]);

const getProductCategoryId = (product: Product): string => {
  const productRecord = product as Record<string, unknown>;
  const rawCategory =
    productRecord.categories_id ?? product.category_id ?? productRecord.category_id;
  if (rawCategory && typeof rawCategory === "object") {
    if ("id" in (rawCategory as { id?: unknown })) {
      return String((rawCategory as { id?: unknown }).id ?? "");
    }
  }
  if (rawCategory) return String(rawCategory);
  return "";
};

const CatalogPage = () => {
  const { products, loading } = useProducts();

  // État du filtre
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchParams] = useSearchParams();

  const getCategoryString = (categoryData: unknown) => {
    if (!categoryData) return "";
    if (typeof categoryData === "string") return categoryData;
    if (Array.isArray(categoryData) && categoryData.length > 0) {
      const first = categoryData[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object") {
        const candidate = first as { title?: string; name?: string; valeur?: string };
        return candidate.title || candidate.name || candidate.valeur || "";
      }
      return "";
    }
    if (typeof categoryData === "object") {
      const candidate = categoryData as { title?: string; name?: string; valeur?: string };
      return candidate.title || candidate.name || candidate.valeur || "";
    }
    return "";
  };

  const resolveCategorySelection = useCallback((value: string | null) => {
    if (!value) return "all";
    const normalized = normalizeKey(value);
    return CATEGORY_ID_BY_KEY.get(normalized) ?? "all";
  }, []);

  // --- FILTRAGE ---
  const filteredProducts = useMemo(() => {
    let nextProducts = products;

    // Filtre par Catégorie
    if (selectedCategory !== "all") {
      nextProducts = nextProducts.filter(
        (product) => getProductCategoryId(product) === selectedCategory,
      );
    }

    // Filtre par Marque
    if (selectedBrand !== "all") {
      nextProducts = nextProducts.filter((p) => p.brand === selectedBrand);
    }

    return nextProducts;
  }, [products, selectedCategory, selectedBrand]);

  // Sync URL -> State
  useEffect(() => {
    const brandParam = searchParams.get("brand");
    const categoryParam = searchParams.get("category");

    if (brandParam) {
      const normalizedBrand =
        brandParam === "Autres" ? GENERIC_BRAND : brandParam;
      setSelectedBrand(normalizedBrand);
    } else if (!categoryParam) {
      setSelectedBrand("all");
    }

    if (categoryParam) {
      setSelectedCategory(resolveCategorySelection(categoryParam));
    } else if (!brandParam) {
      setSelectedCategory("all");
    }
  }, [searchParams, resolveCategorySelection]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Catalogue
          </p>
          <h1 className="text-3xl font-semibold text-gray-900">
            Accessoires premium
          </h1>
        </div>
      </div>

      {/* --- MENU CATÉGORIES (FIXE) --- */}
      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
          Catégories
        </p>
        <div className="mt-3 -mx-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
          <div className="flex min-w-max items-end gap-6">
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedBrand("all");
              }}
              className={`pb-2 text-sm font-semibold transition ${
                selectedCategory === "all"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Toutes
            </button>
            {FIXED_CATEGORIES.map((category) => {
              const categoryKey = normalizeKey(category.slug || category.name);
              const categoryId = CATEGORY_ID_BY_KEY.get(categoryKey);
              const isActive =
                categoryId !== undefined && selectedCategory === categoryId;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(categoryId ?? "all");
                    setSelectedBrand("all");
                  }}
                  className={`pb-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-b-2 border-gray-900 text-gray-900"
                      : "border-b-2 border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- MENU MARQUES --- */}
      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
          Marques
        </p>
        <div className="mt-3 -mx-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
          <div className="flex min-w-max flex-nowrap gap-2">
            {BRAND_FILTERS.map((brand) => {
              const value =
                brand === "Toutes"
                  ? "all"
                  : brand === "Autres"
                    ? GENERIC_BRAND
                    : brand;
              const isActive = selectedBrand === value;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => {
                    setSelectedBrand(value);
                    setSelectedCategory("all");
                  }}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {brand}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- GRILLE --- */}
      <div className="mt-6">
        {loading ? (
          <p className="text-center text-sm text-gray-500">Chargement...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {filteredProducts.map((product) => {
              const categoryLabel =
                CATEGORY_NAME_BY_ID.get(getProductCategoryId(product)) ||
                getCategoryString(product.categories) ||
                undefined;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryName={categoryLabel}
                />
              );
            })}
          </div>
        )}
        {!loading && filteredProducts.length === 0 && (
          <p className="text-center mt-6 text-sm text-gray-500">
            Aucun produit trouvé.
          </p>
        )}
      </div>
    </div>
  );
};

export default CatalogPage;
