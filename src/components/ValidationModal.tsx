import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { DIRECTUS_BASE_URL } from "../utils/directus"; // URL backend
import { formatPrice } from "../utils/format"; // Formateur de prix
import { resolveImageUrl } from "../utils/image"; // Formateur d'image
import {
  getCustomerById,
  getOrderFullDetails,
  getOrderItemsByOrderId,
  type CustomerRecord,
  type OrderFullDetails,
  type OrderItemRecord,
} from "../lib/commerceApi"; // Imports SDK restants (markOrderPaid supprimé)

const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN as
  | string
  | undefined; // Token API
const N8N_WEBHOOK_URL =
  "https://n8n.srv747988.hstgr.cloud/webhook/versement-espece";
const N8N_CJ_WEBHOOK_URL =
  "https://n8n.srv747988.hstgr.cloud/webhook/export-cj-order";

type ProductSummary = { id: string; title: string; image_url?: string }; // Typage Produit
type VariantSummary = {
  id: string;
  sku?: string;
  option1_name?: string;
  option1_value?: string;
}; // Typage Variante

const extractOrderItems = (value: unknown): OrderItemRecord[] => {
  // Extrait sécurisé des lignes
  if (Array.isArray(value)) return value as OrderItemRecord[]; // Si déjà Array
  if (value && typeof value === "object") {
    // Si objet enveloppé
    const maybeData = (value as { data?: unknown }).data; // Regarde sous .data
    if (Array.isArray(maybeData)) return maybeData as OrderItemRecord[]; // Extrait l'array
  } // Fin condition
  return []; // Renvoie vide par défaut
}; // Fin extract

const buildHeaders = () => {
  // Constructeur de headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }; // Base JSON
  if (DIRECTUS_TOKEN) headers.Authorization = `Bearer ${DIRECTUS_TOKEN}`; // Ajoute l'Auth
  return headers; // Retourne l'objet
}; // Fin fonction

const normalizeId = (value: unknown): string => {
  // Nettoyeur d'ID relationnels
  if (typeof value === "string" || typeof value === "number")
    return String(value); // Direct
  if (value && typeof value === "object" && "id" in value) {
    // Relation imbriquée
    const nestedId = (value as { id?: unknown }).id; // Cherche .id
    if (typeof nestedId === "string" || typeof nestedId === "number")
      return String(nestedId); // Retourne .id
  } // Fin if
  return ""; // Défaut
}; // Fin fonction

const parseAmount = (value: unknown): number | null => {
  // Formateur mathématique
  if (value === null || value === undefined || value === "") return null; // Rejette vide
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN; // Cast
  return Number.isFinite(numeric) ? numeric : null; // Sécurité
}; // Fin fonction

const extractAssetId = (value: unknown): string => {
  // Extrait ID Fichier
  if (typeof value === "string" || typeof value === "number")
    return String(value); // Direct
  if (value && typeof value === "object" && "id" in value) {
    // Relation imbriquée
    const id = (value as { id?: unknown }).id; // Cherche .id
    if (typeof id === "string" || typeof id === "number") return String(id); // Retourne
  } // Fin if
  return ""; // Défaut
}; // Fin fonction

const extractProductSummary = (value: unknown): ProductSummary | null => {
  // Extrait résumé Produit
  if (!value || typeof value !== "object") return null; // Refuse vide
  const record = value as Record<string, unknown>; // Cast
  const id = normalizeId(record.id); // ID propre
  if (!id) return null; // Stop si pas ID
  const title =
    String(record.title ?? record.name ?? "").trim() || `Produit ${id}`; // Titre
  const rawImage =
    record.image_url ??
    record.image ??
    record.imageUrl ??
    record.image_id ??
    record.imageId ??
    ""; // Image source
  const image_url = extractAssetId(rawImage).trim(); // Image ID
  return { id, title, image_url }; // Retour objet
}; // Fin fonction

const extractVariantSummary = (value: unknown): VariantSummary | null => {
  // Extrait résumé Variante
  if (!value || typeof value !== "object") return null; // Refuse vide
  const record = value as Record<string, unknown>; // Cast
  const id = normalizeId(record.id); // ID propre
  if (!id) return null; // Stop
  const sku = String(record.sku ?? "").trim(); // SKU
  const option1_name = String(
    record.option1_name ?? record.option_name ?? "",
  ).trim(); // Option Nom
  const option1_value = String(
    record.option1_value ?? record.option_value ?? "",
  ).trim(); // Option Val
  return { id, sku, option1_name, option1_value }; // Retour
}; // Fin fonction

const fetchProductSummaries = async (ids: string[]) => {
  // Appelle API produits
  const uniqueIds = Array.from(new Set(ids.filter(Boolean))); // Dédoublonnage
  if (uniqueIds.length === 0) return {} as Record<string, ProductSummary>; // Sortie rapide

  const params = new URLSearchParams(); // Constructeur query
  params.set("filter[id][_in]", uniqueIds.join(",")); // Filtre Directus
  params.set("fields", "id,title,image"); // Champs réduits

  const response = await fetch(
    `${DIRECTUS_BASE_URL}/items/products?${params.toString()}`,
    { headers: buildHeaders() },
  ); // Appel GET

  if (!response.ok) {
    let errorText = "";
    try {
      errorText = await response.text();
    } catch {
      // ignore
    }
    throw new Error(`Products API HTML/JSON Error (${response.status}): ${errorText.substring(0, 100)}`);
  }

  const payload = (await response.json()) as {
    data?: Array<Record<string, unknown>>;
  }; // Parse

  const map: Record<string, ProductSummary> = {}; // Dictionnaire de sortie
  (payload.data ?? []).forEach((row) => {
    // Boucle items
    const summary = extractProductSummary(row); // Analyse item
    if (summary) map[summary.id] = summary; // Ajoute au dictionnaire
  }); // Fin boucle

  return map; // Retour final
}; // Fin fonction

type ValidationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedOrder: string | null;
};

const ValidationModal = ({ isOpen, onClose, selectedOrder }: ValidationModalProps) => {
  const activeQuery = selectedOrder || "";
  
  const [order, setOrder] = useState<OrderFullDetails | null>(null);
  const [productMap, setProductMap] = useState<Record<string, ProductSummary>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setOrder(null);
      setProductMap({});
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);


  const resolveOrderId = async (value: string) => {
    // Trouve l'UUID de la commande
    const normalized = value.trim(); // Trim
    if (!normalized) return ""; // Sortie
    if (!/^KOK-/i.test(normalized)) return normalized; // Bypass si déjà UUID

    const params = new URLSearchParams(); // Cherche par code KOK
    params.set("filter[order_number][_eq]", normalized); // Query Directus
    params.set("fields", "id"); // Optimise réponse
    params.set("limit", "1"); // 1 max

    const response = await fetch(
      `${DIRECTUS_BASE_URL}/items/orders?${params.toString()}`,
      { headers: buildHeaders() },
    ); // Fetch GET

    if (!response.ok) throw new Error("Impossible de récupérer la commande."); // Erreur HTTP

    const payload = (await response.json()) as {
      data?: Array<{ id?: string }>;
    }; // Parse JSON
    return payload.data?.[0]?.id ?? ""; // Retourne UUID
  }; // Fin fonction

  // Recherche supprimée car l'ID est fourni par la props

  useEffect(() => {
    // Moteur de chargement commande
    let isActive = true; // Anti race-condition

    const fetchOrder = async () => {
      // Worker async
      if (!activeQuery) {
        // Si requête vide
        setIsLoading(false); // Stop UI loading
        setOrder(null); // Nettoie state
        setProductMap({}); // Nettoie state
        return; // Sortie
      } // Fin if

      setIsLoading(true); // Démarre UI loading
      setError(null); // Nettoie UI erreur
      setSuccess(false); // Nettoie UI succès

      let attempt = 0;
      const maxAttempts = 3;
      let lastErrMessage = "";

      while (attempt < maxAttempts && isActive) {
        try {
          // Début chaine HTTP
          const resolvedId = await resolveOrderId(activeQuery); // Traduit KOK en UUID
          if (!resolvedId) throw new Error("Commande introuvable."); // Cas introuvable

          const details = await getOrderFullDetails(resolvedId); // Appel API
          if (!isActive) break; // Sécurité composant démonté

          const items = await getOrderItemsByOrderId(resolvedId); // Requête order_items
          if (!isActive) break; // Sécurité composant démonté

          // FETCH EXPLICITE POUR RAMENER L'ADRESSE ET LE NOM (car Directus les sépare)
          const deliveryParams = new URLSearchParams();
          deliveryParams.set("filter[order_id][_eq]", resolvedId);
          deliveryParams.set("limit", "1");
          const deliveryRes = await fetch(
            `${DIRECTUS_BASE_URL}/items/order_delivery?${deliveryParams.toString()}`,
            { headers: buildHeaders() }
          );
          let fetchedDelivery = null;
          if (deliveryRes.ok) {
            const dPayload = await deliveryRes.json();
            fetchedDelivery = dPayload?.data?.[0] || null;
          }

          const merged = {
            ...details,
            order_items: items,
            order_delivery: fetchedDelivery, // Injection de la livraison trouvée
          } as OrderFullDetails; // Fusion explicite

          setOrder(merged); // Stockage état React

          const itemIds = items
            .map((item) => normalizeId(item.product_id as unknown))
            .filter(Boolean); // Isole IDs

          if (itemIds.length > 0) {
            // S'il y a des produits
            const summaries = await fetchProductSummaries(itemIds); // Nomenclature
            if (isActive) setProductMap(summaries); // Met à jour state
          } // Fin if

          setError(null);
          break; // Succès complet, on sort de la boucle
        } catch (err) {
          attempt++;
          lastErrMessage = err instanceof Error ? err.message : String(err);
          if (attempt >= maxAttempts) {
            if (isActive) setError(`Erreur : ${lastErrMessage}`);
          } else {
            // Attente avant le prochain essai (contourne le lag de cache N8N)
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      } // Fin boucle

      if (isActive) setIsLoading(false); // UI Stop Loading
    }; // Fin worker

    void fetchOrder(); // Exécution

    return () => {
      isActive = false;
    };
  }, [activeQuery]);

  const customer = useMemo(() => {
    // Sélecteur client memoizé
    if (!order) return null; // Défaut
    const candidate =
      (order as { customer?: unknown }).customer ?? order.customer_id;
    if (candidate && typeof candidate === "object")
      return candidate as CustomerRecord; // Trouvé
    return null; // Défaut
  }, [order]); // Dép

  const [customerProfile, setCustomerProfile] = useState<CustomerRecord | null>(
    null,
  ); // Cache profil client

  useEffect(() => {
    // Charge client si seulement un ID est dispo
    let isActive = true;
    const candidate =
      (order as { customer?: unknown })?.customer ?? order?.customer_id;
    if (candidate && typeof candidate === "object") {
      setCustomerProfile(candidate as CustomerRecord);
      return () => {
        isActive = false;
      };
    }
    if (typeof candidate !== "string" || !candidate.trim()) {
      setCustomerProfile(null);
      return () => {
        isActive = false;
      };
    }
    void (async () => {
      try {
        const fetched = await getCustomerById(candidate.trim());
        if (isActive) {
          setCustomerProfile(fetched);
        }
      } catch {
        if (isActive) setCustomerProfile(null);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [order]);

  const delivery = order?.order_delivery ?? null; // Sélecteur adresse memoizé

  const lineItems = useMemo<OrderItemRecord[]>(() => {
    // Sélecteur lignes memoizé
    if (!order) return []; // Défaut
    return extractOrderItems((order as { order_items?: unknown }).order_items); // Trouvé
  }, [order]); // Dép

  const totals = useMemo(() => {
    // Calculatrice prix
    if (!order) return { subtotal: 0, shipping: 0, total: 0 }; // Défaut
    const subtotal =
      parseAmount(order.total_products_price) ??
      parseAmount(order.subtotal) ??
      lineItems.reduce((sum, item) => {
        // Agg HT
        const unit = parseAmount(item.unit_price) ?? 0; // unitaire
        const line =
          parseAmount(item.line_total) ?? unit * (item.quantity ?? 0); // total ligne
        return sum + line; // somme
      }, 0); // reduce init
    const shipping = parseAmount(order.shipping_price) ?? 0; // Agg FDP
    const total =
      parseAmount(order.total_price) ??
      parseAmount(order.total) ??
      subtotal + shipping; // Agg Total
    return { subtotal, shipping, total }; // Renvoi obj
  }, [order, lineItems]); // Dép

  const vatRate = 0.2; // Taux TVA France
  const totalTtc = Number.isFinite(totals.total) ? totals.total : 0; // TTC
  const vatAmount = totalTtc - totalTtc / (1 + vatRate); // Rétrocalcul TVA

  const resolvedCustomer = customerProfile ?? customer; // Priorité au fetch

  const firstName = String(
    resolvedCustomer?.first_name ??
      (resolvedCustomer as { firstName?: string })?.firstName ??
      "",
  ).trim(); // Info client prenom
  const lastName = String(
    resolvedCustomer?.last_name ??
      (resolvedCustomer as { lastName?: string })?.lastName ??
      "",
  ).trim(); // Info client nom
  
  const rawFullName = [firstName, lastName].filter(Boolean).join(" "); // Info complet

  const isAnonymousClient = (name: string) => {
    if (!name) return true;
    const lower = name.toLowerCase().trim();
    return lower === "client" || lower === "client " || lower === "customer";
  };

  const nameCandidates = [
    rawFullName,
    resolvedCustomer?.name,
    (resolvedCustomer as { full_name?: string })?.full_name,
    (resolvedCustomer as { fullName?: string })?.fullName,
    delivery?.recipient_name,
  ];

  let finalCustomerName = "Nom non renseigné";
  for (const candidate of nameCandidates) {
    if (candidate && typeof candidate === "string" && !isAnonymousClient(candidate)) {
      finalCustomerName = candidate.trim();
      break;
    }
  }
  
  const customerName = finalCustomerName;
    
  const customerEmail =
    customer?.email || delivery?.email || "Email non renseigné"; // Email affiché UI
    
  const customerPhone =
    customer?.phone || delivery?.phone || "Téléphone non renseigné"; // Tel affiché UI

  const resolveProductInfo = (item: OrderItemRecord) => {
    // Mappeur de ligne
    const productFromRelation = extractProductSummary(
      item.product_id as unknown,
    ); // Directus link
    const variantFromRelation = extractVariantSummary(
      item.variant_id as unknown,
    ); // Directus link
    const productId = normalizeId(item.product_id as unknown); // Extract ID
    const fallback = productId ? productMap[productId] : undefined; // Cherche dans Map externe

    return {
      // Retourne vue propre
      id: productId, // UID
      title:
        productFromRelation?.title ??
        fallback?.title ??
        `Produit ${productId || ""}`, // Nom
      imageUrl: resolveImageUrl(
        productFromRelation?.image_url ?? fallback?.image_url ?? "",
      ), // Photo
      variant: variantFromRelation, // Opt
    }; // Fin map
  }; // Fin func

  // LA CORRECTION DU BUG EST ICI
  const handleCashReceived = async () => {
    // Bouton Cash Handler
    if (!order || isPaying) return; // Bloque si double clic
    setIsPaying(true); // Freeze le bouton
    setError(null); // Nettoie le panneau erreur

    try {
      // Execution PATCH
      const response = await fetch(
        `${DIRECTUS_BASE_URL}/items/orders/${order.id}`,
        {
          // On attaque explicitement la route UPDATE de CETTE commande
          method: "PATCH", // C'est une MISE À JOUR (pas un POST de création)
          headers: buildHeaders(), // Content-Type et Token
          body: JSON.stringify({
            // Les champs à écraser
            status: "paid", // MAJ statut de commande
            payment_status: "paid", // MAJ statut de l'argent
            payment_reference: "cash", // Trace d'audit
          }), // Fin Payload
        },
      ); // Fin Appel

      if (!response.ok) throw new Error("Erreur de validation coté serveur."); // Intercepte 400, 403 ou 500

      // Envoi webhook N8N avec toutes les infos disponibles
      try {
        const orderSnapshot = {
          ...order,
          status: "paid",
          payment_status: "paid",
          payment_reference: "cash",
        };

        const itemsPayload = lineItems.map((item) => {
          const productId = normalizeId(item.product_id as unknown);
          const variantId = normalizeId(item.variant_id as unknown);
          const productRecord =
            item.product_id && typeof item.product_id === "object"
              ? (item.product_id as Record<string, unknown>)
              : null;
          const variantRecord =
            item.variant_id && typeof item.variant_id === "object"
              ? (item.variant_id as Record<string, unknown>)
              : null;
          const productInfo = resolveProductInfo(item);

          const sku =
            (variantRecord?.sku as string | undefined) ??
            productInfo.variant?.sku ??
            null;

          const cjId =
            (variantRecord?.cj_vid as string | undefined) ??
            (variantRecord?.cjVid as string | undefined) ??
            (variantRecord?.idCJ as string | undefined) ??
            null;

          return {
            ...item,
            product_id: productId || item.product_id,
            variant_id: variantId || item.variant_id,
            sku,
            cj_id: cjId,
            product: productRecord ?? productMap[productId] ?? null,
            variant: variantRecord ?? productInfo.variant ?? null,
          };
        });

        const webhookPayload = {
          event: "cash_received",
          order: orderSnapshot,
          customer: resolvedCustomer ?? null,
          delivery: delivery ?? null,
          totals: {
            ...totals,
            vat: vatAmount,
            total_ttc: totalTtc,
          },
          items: itemsPayload,
        };

        console.log("Webhook N8N payload (cash_received):", webhookPayload);

        const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!webhookResponse.ok) {
          const body = await webhookResponse.text().catch(() => "");
          console.error(
            "Erreur webhook n8n",
            webhookResponse.status,
            body.slice(0, 200),
          );
        }
      } catch (webhookError) {
        console.error("Erreur webhook n8n", webhookError);
      }

      // 3. Déclenchement Logistique : CJ Dropshipping Webhook
      try {
        console.log("Déclenchement logistique CJ Dropshipping (order_id: " + order.id + ")");
        const cjResponse = await fetch(N8N_CJ_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order_id: order.id }),
        });

        if (!cjResponse.ok) {
          const body = await cjResponse.text().catch(() => "");
          console.error(
            "Erreur webhook CJ Dropshipping",
            cjResponse.status,
            body.slice(0, 200),
          );
        }
      } catch (cjError) {
        console.error("Erreur webhook CJ Dropshipping", cjError);
      }

      setOrder((prev) =>
        prev ? { ...prev, status: "paid", payment_status: "paid" } : prev,
      ); // Succès : On met à jour l'UI React (source de vérité locale)
      setSuccess(true); // Déclenche l'alerte verte
    } catch (payError) {
      // Si échec réseau ou Directus
      console.error("Erreur validation", payError); // Trace dev
      setError(
        "Impossible de valider la commande. Vérifiez vos droits d'édition sur Directus.",
      ); // Message FR clair
    } finally {
      // Fin de process
      setIsPaying(false); // Rallume le bouton
    } // Fin bloc
  }; // Fin de fonction

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[#f4f5f7] p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-gray-500 hover:bg-gray-200 transition"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="space-y-6 mt-4">
      {/* Wrapping Root */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        {" "}
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {" "}
          {/* Alignement */}
          <div>
            {" "}
            {/* Bloc texte intro */}
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Validation rapide
            </p>{" "}
            {/* Surtitre */}
            <h1 className="mt-2 text-2xl font-semibold text-gray-900">
              Validation vendeur
            </h1>{" "}
            {/* Titre H1 */}
            <p className="mt-1 text-sm text-gray-500">
              Entrez un numéro de commande pour afficher les détails.
            </p>{" "}
            {/* S/Titre */}
          </div>{" "}
          {/* Fin bloc texte */}
          <div className="flex flex-wrap items-center gap-2">
            {" "}
            {/* Badges généraux */}
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
              Statut: {order?.status ?? "—"}
            </span>{" "}
            {/* Badge1 */}
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
              Paiement: {order?.payment_status ?? "—"}
            </span>{" "}
            {/* Badge2 */}
          </div>{" "}
          {/* Fin bloc badge */}
        </div>{" "}
        {/* Fin alignement */}
        {isLoading ? ( // Affichage Loading
          <p className="mt-4 text-sm text-gray-500">
            Chargement de la commande...
          </p> // Texte Loading
        ) : error ? ( // Affichage Erreur
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p> // Texte Erreur
        ) : !order ? ( // Affichage Vide
          <p className="mt-4 text-sm text-gray-500">
            Aucune commande trouvée. Scannez ou saisissez.
          </p> // Texte Vide
        ) : (
          // Affichage Succès Fetch
          <p className="mt-4 text-sm text-gray-500">
            Commande chargée :{" "}
            <span className="font-semibold text-gray-900">
              {order.order_number ?? order.id}
            </span>
          </p> // Info Num
        )}{" "}
        {/* Fin Switcher */}
      </section>{" "}
      {/* Fin Header Section */}
      {order && !isLoading && !error ? ( // Rendu Data Conditionnel
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {" "}
          {/* Grille Layout */}
          <div className="space-y-6">
            {" "}
            {/* Colonne Données */}
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              {" "}
              {/* Box Identité */}
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                Commande
              </p>{" "}
              {/* Label */}
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {" "}
                {/* Align */}
                <div>
                  {" "}
                  {/* Ids */}
                  <p className="text-2xl font-semibold text-gray-900">
                    {order.order_number ?? order.id}
                  </p>{" "}
                  {/* KOK num */}
                  <p className="text-sm text-gray-500">ID: {order.id}</p>{" "}
                  {/* UUID */}
                </div>{" "}
                {/* Fin Ids */}
                <div className="flex flex-wrap items-center gap-2">
                  {" "}
                  {/* Badges internes */}
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                    Statut: {order.status ?? "—"}
                  </span>{" "}
                  {/* S1 */}
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                    Paiement: {order.payment_status ?? "—"}
                  </span>{" "}
                  {/* P1 */}
                </div>{" "}
                {/* Fin Badges */}
              </div>{" "}
              {/* Fin Align */}
            </section>{" "}
            {/* Fin Box */}
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              {" "}
              {/* Box Client */}
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                Détails client
              </p>{" "}
              {/* Label */}
              <p className="mt-3 text-lg font-semibold text-gray-900">
                {customerName}
              </p>{" "}
              {/* Nom */}
              <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                {" "}
                {/* Grille data */}
                <div>
                  <p className="text-xs uppercase text-gray-400">Email</p>
                  <p className="font-medium text-gray-900">{customerEmail}</p>
                </div>{" "}
                {/* Em */}
                <div>
                  <p className="text-xs uppercase text-gray-400">Téléphone</p>
                  <p className="font-medium text-gray-900">{customerPhone}</p>
                </div>{" "}
                {/* Tel */}
              </div>{" "}
              {/* Fin Grille */}
            </section>{" "}
            {/* Fin Box */}
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              {" "}
              {/* Box Items */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {" "}
                {/* Titre et count */}
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                  Articles
                </p>{" "}
                {/* Lbl */}
                <span className="text-xs text-gray-500">
                  {lineItems.length} article{lineItems.length > 1 ? "s" : ""}
                </span>{" "}
                {/* Cnt */}
              </div>{" "}
              {/* Fin header items */}
              <div className="mt-4 space-y-4">
                {" "}
                {/* Liste DOM */}
                {lineItems.map((item) => {
                  // Boucle React
                  const productInfo = resolveProductInfo(item); // Extrait var
                  const unitPrice = parseAmount(item.unit_price) ?? 0; // Extrait prix
                  return (
                    // JSX Ligne
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                    >
                      {" "}
                      {/* Card Item */}
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {" "}
                        {/* Align Item */}
                        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-sm">
                          {" "}
                          {/* Pic Container */}
                          {productInfo.imageUrl ? (
                            <img
                              src={productInfo.imageUrl}
                              alt={productInfo.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                              Img
                            </div>
                          )}{" "}
                          {/* Pic */}
                        </div>{" "}
                        {/* Fin Pic */}
                        <div className="min-w-0 flex-1">
                          {" "}
                          {/* Txt Container */}
                          <p className="text-sm font-semibold text-gray-900">
                            {productInfo.title}
                          </p>{" "}
                          {/* Nom */}
                          <p className="mt-1 text-xs text-gray-500">
                            {productInfo.variant?.option1_name || "Var"}:{" "}
                            {productInfo.variant?.option1_value || "—"}
                          </p>{" "}
                          {/* Opt */}
                          <p className="text-xs text-gray-500">
                            SKU:{" "}
                            <span className="font-semibold text-gray-900">
                              {productInfo.variant?.sku || "—"}
                            </span>
                          </p>{" "}
                          {/* SKU */}
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <span>Qté: {item.quantity}</span>
                            <span>PU: {formatPrice(unitPrice)}</span>
                          </div>{" "}
                          {/* Fin Txt Container */}
                        </div>{" "}
                        {/* Fin desc */}
                        <div className="text-left sm:text-right">
                          {" "}
                          {/* Pricing */}
                          <p className="text-xs text-gray-500">Total</p>{" "}
                          {/* Lbl */}
                          <p className="text-sm font-semibold text-gray-900">
                            {formatPrice(
                              parseAmount(item.line_total) ??
                                unitPrice * (item.quantity ?? 0),
                            )}
                          </p>{" "}
                          {/* Prix */}
                        </div>{" "}
                        {/* Fin Pricing */}
                      </div>{" "}
                      {/* Fin Align */}
                    </div> // Fin Ligne
                  ); // Fin Rendu
                })}{" "}
                {/* Fin Iteration */}
              </div>{" "}
              {/* Fin Liste */}
            </section>{" "}
            {/* Fin section articles */}
          </div>{" "}
          {/* Fin colonne gauche */}
          <div className="space-y-6">
            {" "}
            {/* Colonne de droite (Paiement) */}
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              {" "}
              {/* Box Calcul */}
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                Résumé financier
              </p>{" "}
              {/* Titre */}
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                {" "}
                {/* Liste TVA */}
                <div className="flex items-center justify-between">
                  <span>Sous-total HT</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(totals.subtotal)}
                  </span>
                </div>{" "}
                {/* HT */}
                <div className="flex items-center justify-between">
                  <span>TVA incl.</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(vatAmount)}
                  </span>
                </div>{" "}
                {/* TVA */}
              </div>{" "}
              {/* Fin liste TVA */}
              <div className="mt-5 rounded-2xl bg-gray-900 px-4 py-5 text-white">
                {" "}
                {/* Highlight TTC */}
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                  Total TTC
                </p>{" "}
                {/* Lbl */}
                <p className="mt-2 text-3xl font-semibold">
                  {formatPrice(totalTtc)}
                </p>{" "}
                {/* Txt */}
              </div>{" "}
              {/* Fin TTC */}
            </section>{" "}
            {/* Fin section calcul */}
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              {" "}
              {/* Box Action Bouton */}
              {success ? ( // Validation UX si cliqué
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Paiement validé avec succès en DB.
                </p> // Message vert
              ) : (
                // Bouton par defaut
                <button
                  type="button"
                  onClick={handleCashReceived}
                  disabled={isPaying}
                  className="w-full rounded-2xl bg-indigo-600 px-4 py-4 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isPaying ? "Validation..." : "J'ai reçu l'argent en espèces"}
                </button> // Action PATCH
              )}{" "}
              {/* Fin Switch Bouton */}
            </section>{" "}
            {/* Fin Action */}
          </div>{" "}
          {/* Fin Colonne Droite */}
        </div> // Fin Grille Complète
      ) : null}{" "}
      {/* Fin de l'affichage sécurisé si order chargée */}
      </div>
      </div>
    </div>
  );
};
export default ValidationModal;
