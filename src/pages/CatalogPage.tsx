import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { getAllProducts } from "../lib/directusApi";
import type { Category, Product } from "../types";

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

const CatalogPage = () => {
  const [loading, setLoading] = useState(true);

  // État du filtre
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchParams] = useSearchParams();
  const location = useLocation(); // Added useLocation

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

  const resolveCategorySelection = useCallback(
    (value: string | null) => {
      if (!value) return "all";
      const normalized = normalizeKey(value);
      const match = allCategories.find((category) => { // Changed categories to allCategories
        const key = normalizeKey(category.slug || category.name);
        return key === normalized || category.id === value;
      });
      return match?.id ?? "all";
    },
    [allCategories], // Changed categories to allCategories
  );

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const payload = await getAllProducts();
        if (!isMounted) return;
        setAllProducts(payload.products);
        
        // Define explicit sort order
        const sortOrder = [
          "Coques & Protections",
          "Charge & Énergie",
          "Audio",
          "Saison",
          "Support & Fixation",
          "Décoration & Goodies",
          "Autre"
        ];
        
        const sortedCategories = [...payload.categories].sort((a, b) => {
          const indexA = sortOrder.indexOf(a.name);
          const indexB = sortOrder.indexOf(b.name);
          // If both are in the array, sort by array index
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          // If only one is in the array, it comes first
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          // If neither is in the array, sort alphabetically
          return a.name.localeCompare(b.name);
        });
        
        setAllCategories(sortedCategories);
      } catch (error) {
        console.error("Erreur lors du chargement du catalogue", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

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
  }, [searchParams, resolveCategorySelection, allCategories]); // Added allCategories to dependencies

  const categoryNameById = useMemo(
    () =>
      new Map(allCategories.map((category) => [String(category.id), category.name])),
    [allCategories],
  );

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // 1. Check Category
      let matchesCategory = true;
      if (selectedCategory !== "all") {
        const catLabel = categoryNameById.get(selectedCategory);
        // On récupère la catégorie du produit. NocoDB renvoie parfois du JSON ou du string dans category_id / categories
        const productCategoryName = 
          categoryNameById.get(String(product.category_id ?? "")) || 
          getCategoryString(product.categories) || 
          product.category_id || 
          "";
        
        // On teste via le label exact, car la DB stocke les noms en texte brut
        if (catLabel) {
           matchesCategory = productCategoryName === catLabel;
        } else {
           matchesCategory = false; // Category requested doesn't exist
        }
      }

      // 2. Check Brand
      let matchesBrand = true;
      if (selectedBrand !== "all") {
        const fallbackBrand = product.brand || GENERIC_BRAND;
        const normalizedProductBrand =
          fallbackBrand.toLowerCase() === "generic" ||
          fallbackBrand.toLowerCase() === "aucune"
            ? GENERIC_BRAND
            : fallbackBrand;
        matchesBrand = normalizedProductBrand === selectedBrand;
      }

      return matchesCategory && matchesBrand;
    });
  }, [allProducts, selectedCategory, selectedBrand, categoryNameById]);



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
            {allCategories.map((category) => { // Changed categories to allCategories
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
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
        ) : filteredProducts.length === 0 ? (
          <div className="mt-12 text-center text-gray-500">
            <p>Aucun produit ne correspond à ces critères.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {filteredProducts.map((product) => {
              const categoryLabel =
                categoryNameById.get(String(product.category_id ?? "")) ||
                getCategoryString(product.categories) ||
                product.category_id ||
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
      </div>
    </div>
  );
};

export default CatalogPage;
