import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Undo2, X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";
import type { Category } from "../types";

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
  const { products: allProducts, categories: rawCategories, loading } = useProducts();

  // État du filtre
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();
  const actionButtonClass =
    "inline-flex h-9 w-[92px] items-center justify-center whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-800 shadow-sm transition hover:border-gray-900 hover:text-gray-900";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    const body = document.body;
    if (isFilterOpen) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
      body.classList.add("filter-open");
    } else {
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.touchAction = "";
      body.classList.remove("filter-open");
    }
    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.touchAction = "";
      body.classList.remove("filter-open");
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

  // Sort categories with explicit order
  const allCategories = useMemo(() => {
    const sortOrder = [
      "Coques & Protections",
      "Charge & Énergie",
      "Audio & Son",
      "Audio",
      "Support & Fixations",
      "Support & Fixation",
      "Décoration & Goodies",
      "Autres",
      "Autre"
    ];

    return [...rawCategories].sort((a, b) => {
      const indexA = sortOrder.indexOf(a.name);
      const indexB = sortOrder.indexOf(b.name);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [rawCategories]);

  const resolveCategorySelection = useCallback(
    (value: string | null) => {
      if (!value) return "all";
      const normalized = normalizeKey(value);
      const match = allCategories.find((category) => {
        const key = normalizeKey(category.slug || category.name);
        return key === normalized || category.id === value;
      });
      return match?.id ?? "all";
    },
    [allCategories],
  );

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

  const orderedCategories = useMemo(() => {
    const byKey = new Map<string, Category[]>();
    allCategories.forEach((category) => {
      const key = normalizeKey(category.name);
      const list = byKey.get(key) ?? [];
      list.push(category);
      byKey.set(key, list);
    });

    const desiredOrder = [
      "coques protections",
      "charge energie",
      "audio son",
      "support fixation",
      "supports fixations",
      "decoration goodies",
      "autres",
      "autre",
    ];

    const ordered: Category[] = [];
    desiredOrder.forEach((key) => {
      const list = byKey.get(key);
      if (list && list.length > 0) {
        ordered.push(...list);
        byKey.delete(key);
      }
    });

    const remaining = Array.from(byKey.values()).flat();
    return [...ordered, ...remaining];
  }, [allCategories]);

  const filteredProducts = useMemo(() => {
    const searchQuery = searchParams.get("search");
    const normalizedQuery = searchQuery ? normalizeKey(searchQuery) : "";

    const result = allProducts.filter((product) => {
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

      // 3. Check Search — each token must appear in (title + variant texts)
      let matchesSearch = true;
      if (normalizedQuery) {
        const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
        // Build a combined text corpus: title + all variant fields
        const variantTexts = (product.product_variants ?? [])
          .map((v) => [v.option1_name, v.option1_value, v.sku].join(" "))
          .join(" ");
        const corpus = normalizeKey(product.title + " " + product.brand + " " + variantTexts);
        matchesSearch = tokens.every((token) => corpus.includes(token));
      }

      return matchesCategory && matchesBrand && matchesSearch;
    });

    return result.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [allProducts, selectedCategory, selectedBrand, categoryNameById, searchParams]);



  return (
    <div className="mx-auto max-w-6xl pb-24 pt-4 sm:pb-28 md:pt-4">
      {/* Mobile action bar */}
      <div className="md:hidden px-4 sm:px-6">
        <div className="fixed left-0 right-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-30 border-b border-gray-200 bg-gray-50/95 shadow-sm backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2.5">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={actionButtonClass}
              >
                ← Retour
              </button>
              <span className="inline-flex h-8 items-center justify-center rounded-md bg-gray-900 px-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
                CATALOGUE
              </span>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(true)}
                  className={actionButtonClass}
                >
                  Catégorie
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sticky action bar */}
      <div className="sticky top-[72px] z-30 hidden md:block px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 rounded-full border border-gray-800 bg-[#1c1c1c]/95 px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-700 bg-[#2a2a2a] px-4 text-xs font-semibold text-gray-200 shadow-sm transition hover:bg-gray-700 hover:text-white"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Retour à l’accueil</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-bold text-gray-900 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            Catégorie
          </button>
        </div>
      </div>

      {/* --- GRILLE --- */}
      <div className="mt-6 px-4 sm:px-6">
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
            className="absolute inset-0 bg-black/20"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
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
                className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
              <div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedBrand("all");
                      setIsFilterOpen(false);
                    }}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      selectedCategory === "all"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    Toutes
                  </button>
                  {orderedCategories.map((category) => {
                    const isActive = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setSelectedBrand("all");
                          setIsFilterOpen(false);
                        }}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
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
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
