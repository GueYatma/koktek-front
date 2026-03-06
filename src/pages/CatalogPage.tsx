import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Undo2, X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import PriceRangeSlider from "../components/PriceRangeSlider";
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

  // États du filtre
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();


  // Calcul des bornes de prix maximales et minimales de l'inventaire complet
  const { minBound, maxBound } = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return { minBound: 0, maxBound: 1000 };
    const prices = allProducts.map(p => p.prix_calcule ?? p.retail_price ?? 0);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    return {
      minBound: Math.floor(minP),
      maxBound: maxP > 0 ? Math.ceil(maxP) : 1000,
    };
  }, [allProducts]);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [hasInitRange, setHasInitRange] = useState(false);

  // Initialisation du curseur de prix au chargement des produits
  useEffect(() => {
    if (!hasInitRange && allProducts.length > 0) {
      setPriceRange([minBound, maxBound]);
      setHasInitRange(true);
    }
  }, [allProducts, minBound, maxBound, hasInitRange]);

  // Bloquer le scroll derrière le modal
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

  // Open categories filter modal from URL
  useEffect(() => {
    if (searchParams.get("categories") === "open") {
      setIsFilterOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("categories");
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate]);

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
  }, [searchParams, resolveCategorySelection, allCategories]);

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
      // 1. Check Prix (fourchette de filtrage entre min et max slider)
      // On se base sur le prix final affiché (prix_calcule en priorité s'il existe)
      const rPrice = product.prix_calcule ?? product.retail_price ?? 0;
      if (rPrice < priceRange[0] || rPrice > priceRange[1]) {
        return false;
      }

      // 2. Check Category
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

      // 3. Check Brand
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

      // 4. Check Search — each token must appear in (title + variant texts)
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
  }, [allProducts, selectedCategory, selectedBrand, categoryNameById, searchParams, priceRange]);



  return (
    <div className="mx-auto max-w-6xl w-full pb-24 pt-2 sm:pb-28 md:pt-4">


      {/* Desktop sticky action bar */}
      <div className="sticky top-[64px] z-30 hidden md:block px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 rounded-full border border-zinc-700/50 bg-[#333333]/90 px-3 py-2 shadow-lg backdrop-blur-md transition-all">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-zinc-600 bg-zinc-700 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-600 hover:text-white"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Retour à l’accueil</span>
          </button>
          
          <div className="flex flex-1 items-center justify-center w-full px-2 sm:px-6">
             <div className="flex w-full items-center gap-2">
               <span className="text-[11px] font-bold text-gray-400 w-8 text-right shrink-0">{priceRange[0]} €</span>
               <div className="relative flex-1 group pl-1.5 pr-1.5">
                 <PriceRangeSlider 
                   min={minBound} 
                   max={maxBound > minBound ? maxBound : minBound + 1} 
                   value={priceRange} 
                   onChange={setPriceRange} 
                 />
               </div>
               <span className="text-[11px] font-bold text-white w-10 text-left shrink-0">{priceRange[1]} €</span>
               {/* RESET BUTTON */}
               {(priceRange[0] > minBound || priceRange[1] < maxBound) && (
                 <button
                   onClick={() => setPriceRange([minBound, maxBound > minBound ? maxBound : minBound + 1])}
                   className="flex items-center justify-center p-1.5 ml-1 flex-shrink-0 rounded-full bg-gray-50 text-red-600 shadow-sm transition-all hover:bg-red-50 hover:text-red-700 hover:shadow"
                   title="Réinitialiser les prix"
                 >
                   <X className="w-3.5 h-3.5" strokeWidth={3} />
                 </button>
               )}
             </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-bold text-gray-900 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            Catégorie
          </button>
        </div>
      </div>

      {/* --- GRILLE --- */}
      <div className="mt-2 md:mt-6 px-4 sm:px-6">
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

      {/* --- MENU CATÉGORIES (PANNEAU FLOTTANT PREMIUM) --- */}
      {/* Overlay sombre léger */}
      <div
        className={`fixed inset-0 z-50 bg-black/10 transition-opacity duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] dark:bg-black/30 ${
          isFilterOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsFilterOpen(false)}
      />

      {/* Le Panneau - Plus court, plus transparent, flottant à droite */}
      <div
        className={`fixed right-3 sm:right-6 top-1/2 z-50 w-max min-w-[220px] max-w-[280px] -translate-y-1/2 transform rounded-[24px] border border-white/20 bg-white/40 backdrop-blur-md shadow-[0_15px_40px_-5px_rgba(0,0,0,0.1)] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col dark:border-gray-700/30 dark:bg-gray-900/40 dark:shadow-[0_15px_40px_-5px_rgba(0,0,0,0.4)] ${
          isFilterOpen ? "translate-x-0 opacity-100 scale-100 pointer-events-auto" : "translate-x-8 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Header minimaliste */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
              Menu
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsFilterOpen(false)}
            className="group flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-gray-500 transition-all hover:bg-white/80 hover:text-gray-900 active:scale-95 dark:bg-gray-800/40 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
          </button>
        </div>

        {/* Liste des catégories en bandelettes */}
        <div className="flex flex-col gap-1.5 px-3 pb-5 overflow-y-auto max-h-[65vh] custom-scrollbar hide-scrollbar">
          {/* Le bouton "Toutes" */}
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedBrand("all");
              setIsFilterOpen(false);
            }}
            className={`group relative flex w-full items-center rounded-[14px] px-4 py-3 text-left transition-all duration-300 ease-out active:scale-[0.98] ${
              selectedCategory === "all"
                ? "bg-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:bg-gray-800/80"
                : "bg-transparent hover:bg-white/30 dark:hover:bg-gray-800/30"
            }`}
          >
            {/* L'indicateur de flèche dynamique (actif ou hover) */}
            <div
              className={`absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full transition-all duration-300 ease-out ${
                selectedCategory === "all"
                  ? "translate-x-0 opacity-100 bg-gray-900 dark:bg-white"
                  : "translate-x-[-100%] opacity-0 bg-gray-300 group-hover:translate-x-0 group-hover:opacity-100 dark:bg-gray-600"
              }`}
            />

            {/* Le Texte de la bandelette */}
            <span
              className={`relative z-10 text-[14px] font-medium transition-all duration-300 ease-out ${
                selectedCategory === "all"
                  ? "translate-x-2 text-gray-900 font-semibold dark:text-white"
                  : "text-gray-600 group-hover:translate-x-1.5 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-200"
              }`}
            >
              Toutes
            </span>
            
            {/* Petit point discret si actif */}
            {selectedCategory === "all" && (
              <div className="absolute right-4 z-10 h-1.5 w-1.5 rounded-full bg-gray-900 dark:bg-white opacity-40 shadow-[0_0_8px_currentColor]" />
            )}
          </button>

          {/* Les catégories de la BDD */}
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
                className={`group relative flex w-full items-center rounded-[14px] px-4 py-3 text-left transition-all duration-300 ease-out active:scale-[0.98] ${
                  isActive
                    ? "bg-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:bg-gray-800/80"
                    : "bg-transparent hover:bg-white/30 dark:hover:bg-gray-800/30"
                }`}
              >
                {/* Flèche dynamique légère */}
                <div
                  className={`absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full transition-all duration-300 ease-out ${
                    isActive
                      ? "translate-x-0 opacity-100 bg-gray-900 dark:bg-white"
                      : "translate-x-[-100%] opacity-0 bg-gray-300 group-hover:translate-x-0 group-hover:opacity-100 dark:bg-gray-600"
                  }`}
                />

                {/* Texte */}
                <span
                  className={`relative z-10 text-[14px] font-medium transition-all duration-300 ease-out ${
                    isActive
                      ? "translate-x-2 text-gray-900 font-semibold dark:text-white"
                      : "text-gray-600 group-hover:translate-x-1.5 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-200"
                  }`}
                >
                  {category.name}
                </span>
                
                {/* Point discret si actif */}
                {isActive && (
                  <div className="absolute right-4 z-10 h-1.5 w-1.5 rounded-full bg-gray-900 dark:bg-white opacity-40 shadow-[0_0_8px_currentColor]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
