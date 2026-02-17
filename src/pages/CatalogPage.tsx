import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";
import type { Category } from "../types";

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

  // --- FILTRAGE ---
  const filteredProducts = useMemo(() => {
    let nextProducts = products;

    // Filtre par Catégorie
    if (selectedCategory !== "all") {
      nextProducts = nextProducts.filter(
        (product) => getCategoryString(product.categories) === selectedCategory,
      );
    }

    // Filtre par Marque
    if (selectedBrand !== "all") {
      nextProducts = nextProducts.filter((p) => p.brand === selectedBrand);
    }

    return nextProducts;
  }, [products, selectedCategory, selectedBrand, getCategoryString]);

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
      setSelectedCategory(categoryParam);
    } else if (!brandParam) {
      setSelectedCategory("all");
    }
  }, [searchParams]);

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
            {FIXED_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.name);
                  setSelectedBrand("all");
                }}
                className={`pb-2 text-sm font-semibold transition ${
                  selectedCategory === category.name
                    ? "border-b-2 border-gray-900 text-gray-900"
                    : "border-b-2 border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {category.name}
              </button>
            ))}
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
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={getCategoryString(product.categories) || undefined}
              />
            ))}
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
