import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { getAllProducts } from "../lib/directusApi";
import type { Category, Product } from "../types";

const GENERIC_BRAND = "Générique";


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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    const body = document.body;
    if (isFilterOpen) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
    } else {
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.touchAction = "";
    }
    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.touchAction = "";
    };
  }, [isFilterOpen]);

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

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

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
    const searchQuery = searchParams.get("search");
    const normalizedQuery = searchQuery ? normalizeKey(searchQuery) : "";

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

      // 3. Check Search
      let matchesSearch = true;
      if (normalizedQuery) {
        const titleMatch = normalizeKey(product.title).includes(normalizedQuery);
        const variantMatch = product.product_variants?.some((v) => 
          normalizeKey(v.option1_name).includes(normalizedQuery) ||
          normalizeKey(v.option1_value).includes(normalizedQuery) ||
          normalizeKey(v.sku).includes(normalizedQuery)
        ) ?? false;
        matchesSearch = titleMatch || variantMatch;
      }

      return matchesCategory && matchesBrand && matchesSearch;
    });
  }, [allProducts, selectedCategory, selectedBrand, categoryNameById, searchParams]);



  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6 sm:pb-28 sm:pt-8">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-fit rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-900 hover:text-gray-900 md:hidden"
          >
            ← Retour
          </button>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Catalogue
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            Accessoires premium
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
        >
          Catégorie
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="rounded-full border border-gray-200 px-3 py-1">
          {selectedCategory === "all"
            ? "Toutes catégories"
            : categoryNameById.get(selectedCategory) || "Catégorie"}
        </span>
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
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

      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">
                  Catégories
                </p>
                <h2 className="text-base font-semibold text-gray-900">
                  Choisir une catégorie
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
              <div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedBrand("all");
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      selectedCategory === "all"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    Toutes
                  </button>
                  {allCategories.map((category) => {
                    const isActive = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setSelectedBrand("all");
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedBrand("all");
                }}
                className="text-xs font-semibold text-gray-500 transition hover:text-gray-900"
              >
                Toutes les catégories
              </button>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
