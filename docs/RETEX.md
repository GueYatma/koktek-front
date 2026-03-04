# 🧠 Retour d'Expérience (RETEX) & Debug Log

Ce document centralise l'expérience globale du projet **Koktek**, son architecture de bout en bout et l'historique de l'ensemble des problèmes techniques majeurs rencontrés lors du développement et de la mise en production.

## 🏗 Architecture du Projet
- **Frontend** : React, TypeScript, Vite, Tailwind CSS. Focus sur l'UX Premium et le Mobile First.
- **Backend / BDD** : PostgreSQL, couplé à Directus / NocoDB pour la gestion PIM (Catalogue) et OMS (Commandes).
- **Automatisations** : n8n pour orchestrer les Webhooks Stripe, la création des factures (PDFMonkey), l'envoi d'e-mails et la synchronisation avec CJ Dropshipping.
- **CI/CD** : GitHub Actions pour le build (`npm run build`) et le déploiement sur VPS de production en continu.

---

## ⚡ Les Bugs Serveur et CI/CD (GitHub Actions & VPS)

### Bug 1 : Déploiement en échec - Stripe et Variables d'Environnement
- **Symptôme :** Le build GitHub Actions échouait sur le VPS, ou Stripe plantait en production car `.env.production` n'était pas versionné (bloqué légitimement par `.gitignore`). L'application tournait sans `VITE_STRIPE_PUBLIC_KEY` ni Token d'API.
- **Cause :** Les variables sécurisées n'étaient pas injectées dans l'environnement du runner GitHub Action au moment du `npm run build`.
- **Solution :** Ajout d'une étape de génération dynamique du fichier environnement dans `.github/workflows/deploy.yml` (`echo "VITE_STRIPE_PUBLIC_KEY=${{ secrets.VITE_STRIPE_PUBLIC_KEY }}" >> .env.production`).

### Bug 2 : Lenteur extrême du VPS (2 minutes par page)
- **Symptôme :** Chargement anormalement lent du site web de production (Time To First Byte désastreux), ressources bloquées.
- **Cause :** Mauvaise configuration du serveur web (Nginx) et des couches réseaux côté VPS. Pas de compression, tailles des paquets non optimisées.
- **Solution :** Application d'une configuration de compression (`gzip on`), optimisation des headers de sécurité, du système de cache et limitation du payload pour fluidifier les assets volumineux.

---

## 🎨 Les Bugs d'Interface et d'UX (React / Tailwind)

### Bug 3 : Instabilité du Slider de Prix et Z-Index
- **Symptôme :** Sur le Catalogue Bureau, la boule "Minimum" du Range Slider de prix à deux poignées était incliquable. Le filtre prix éliminait massivement des articles pourtant dans les bonnes tranches.
- **Cause :**
  1. *Collision Z-Index / HTML natif* : Les deux `input[type="range"]` se superposaient et la zone rectangulaire de l'un bloquait l'accès à la poignée de l'autre.
  2. *Algorithme de filtre* : Le système filtrait bêtement sur la donnée `retail_price` brute, alors que les fiches produits affichaient un `prix_calcule` (modifié ou remisé).
- **Solution :**
  - Css avancé : ajout de `pointer-events-none` sur l'input global pour traverser la zone morte, et `pointer-events-auto` ciblé strictement sur le `::slider-thumb`.
  - Changement de la condition `const finalPrice = product.prix_calcule ?? product.retail_price`.
  - Ajout d'un bouton Reset ✕ de sélection rouge premium pour une réinitialisation rapide (UX/Marketing).

### Bug 4 : Incohérences des Montants sur le Checkout
- **Symptôme :** Le client constatait un "Total à payer 9,89€", mais la liste n'affichait qu'un article à 5,50€. Cela créait un fort risque de doute et d'abandon de panier. De plus, lors de l'application initiale du correctif d'interface, le déploiement CI/CD a été interrompu ("Process completed with exit code 2") par GitHub.
- **Cause :**
  1. Manque de transparence de l'UI quant à la prise en compte des frais de livraison dans la liste des articles.
  2. *Build Crash* : Des variables TS/JS intermédiaires orphelines (ex: `shippingDays`, `lineTotal`) laissées par la refonte CSS ont rendu le compilateur TypeScript furieux (`tsc --noEmit` crashé).
- **Solution :** Refonte UX de la `CheckoutPage` et de l'`OrderTicketModal`. Chaque bloc produit ventile clairement : *Sous-Total Article + Frais de Livraison lié = Total Ligne*. Le modal final ajoute un bouton "Continuer mes achats" noir premium pour accentuer le réengagement. Purge impérative du "code mort" signalée par le compilateur TypeScript avant de pousser vers GitHub.

### Bug 5 : La Barre de Recherche Mobile instable
- **Symptôme :** Sur smartphone, lors de la frappe au clavier dans le tiroir de recherche du bas, les résultats rafraichissaient le DOM, ce qui causait le saut anarchique ou la disparition pure et simple de la barre de saisie.
- **Cause :** Repositionnement absolu / fixed adossé à la hauteur dynamique de l'écran (`100vh`) qui recule à l'apparition du clavier virtuel iOS/Android, ou composant qui se dé-monte (unmount) au rerendu React.
- **Solution :** Fixation du composant avec de la gestion CSS viewport stable, préservation du focus indépendamment du rafraîchissement d'état local des résultats.

### Bug 6 : L'Historique des Ventes Admin Désynchronisé
- **Symptôme :** La page `/admin/historique` tirée du tableau de bord Admin n'affichait plus les données correctement suite à un changement sur le backend.
- **Cause :** La base de données utilisait désormais une vue consolidée (Materialized View) appelée `admin_orders_dashboard_final`, ce qui cassait les jointures de l'ancien endpoint. Difficulté d'identification du mode de paiement réel.
- **Solution :** Alignement de l'API Vite sur la nouvelle table Vue. Restructuration complète des colonnes de l'UI de l'historique et ajout d'un composant Modal détaillé qui résume toutes les coordonnées d'un profil client et sa commande d'un seul coup d'œil.

---

## 🕸 Les Bugs en coulisses (Automatisations n8n)

### Bug 7 : L'UUID fantôme (Perte de l'Order ID dans n8n)
- **Symptôme :** Le workflow envoyait un faux numéro de commande (ex: `c8f...`) vers le fournisseur CJ Dropshipping. CJ retournait une erreur.
- **Cause :** Le nœud *PostgreSQL* recrachait l'`id` interne du carnet d'adresses de facturation qu'il venait de sauvegarder. Or, le nœud d'après appelait génériquement `{{ $json.id }}`, remplaçant et écrasant l'ID vital de la commande par mégarde.
- **Solution :** Arrêt de l'usage des `id` à l'aveugle. Ciblage strict vers la propriété `order_id` injectée volontairement depuis le Webhook initial Stripe.

### Bug 8 : "Client KOKTEK" anonyme
- **Symptôme :** Facture générée au nom "Client KOKTEK" peu importe l'identité de l'acheteur.
- **Cause :** L'adresse `shipping_address` envoyée par le frontend à la commande comprenait la ville et la rue, mais pas le patronyme ni l'e-mail du destinataire car la base de données était trop cloisonnée (seulement lié à `customer_id`).
- **Solution :** Forçage du payload JSON directement côté `Frontend (commerceApi.ts)` pour inclure explicitement `recipient_name` et `email` au check-out afin que Webhooks et n8n n'aient plus à fouiller.

### Bug 9 : Images cassées sur le PDF
- **Symptôme :** Les variables `logo_url` et `image_url` ne s'injectaient pas dans la facture PDF (carré brisé apparent).
- **Cause :** Passage du lien URL pur au template PDFMonkey sans modification du squelette HTML d'accueil.
- **Solution :** Ajout obligatoire de la balise HTML img `<img src="{{image_url}}" />` côté code du layout PDF.

### Bug 10 : L'e-mail fantôme (Sans Pièce Jointe)
- **Symptôme :** L'e-mail partait chez le client, mais sans la déclaration de la facture.
- **Cause :** Le workflow asynchrone n8n passait au nœud "Email" trop rapidement, juste *avant* la fin de la création du fichier binaire du PDF par le nœud de l'API.
- **Solution :** Gestion stricte des dépendances du graph n8n. Le nœud `Send Email` ferme la danse, et cible spécifiquement la clé de données binaire `"data"` dans le field Attachments.

---

## 🌙 Les Évolutions d'Interface Post-Lancement

### Bug 11 : Dark Mode — Implémentation et Raffinement
- **Symptôme :** Le site restait en thème blanc même lorsque le système d'exploitation de l'utilisateur passait en mode sombre. Agressif pour les yeux la nuit. Après une première implémentation, le rendu était trop violent (noir pur / blanc pur) et plusieurs pages majeures n'avaient pas été traitées.
- **Cause :**
  1. Tailwind n'avait pas `darkMode: 'class'` dans sa configuration — aucune variante `dark:` n'était générée.
  2. Première vague trop rapide : CartDrawer, ProductCard, ProductPage, CatalogPage et AdminLayout oubliés. Palette trop contrastée (`gray-950`).
- **Solution :**
  - Activation de `darkMode: 'class'` dans `tailwind.config.js`.
  - Création de `ThemeContext.tsx` : détection automatique de `prefers-color-scheme`, persistance via `localStorage`, écoute en temps réel des changements OS, et exposition d'une fonction `toggleTheme()`.
  - Ajout d'un bouton **Soleil/Lune** dans le header principal ET dans le header du Back-Office.
  - Traitement complet de la palette : `dark:bg-gray-900` (fond principal), `dark:bg-gray-800` (cartes), `dark:text-gray-200` (textes).
  - Tous les composants oubliés patché : `CartDrawer`, `ProductCard`, `ProductPage`, `CatalogPage`, `AdminLayout`.
- **Leçon :** Traiter le dark mode en une seule passe complète, composant par composant, plutôt qu'en vagues successives.

### Bug 12 : Cadrage des Images du Catalogue
- **Symptôme :** Sur la page Catalogue (grille produits), les images étaient coupées ou mal rognées selon leur format source. La Fiche Produit, elle, affichait correctement grâce à son aspect-ratio carré.
- **Cause :**
  1. Première tentative avec `object-contain` : images non rognées mais espaces vides inégaux autour des produits selon leurs ratios source (portrait, paysage, carré).
  2. Le composant `ProductCard` utilisait une hauteur fixe (`h-28 sm:h-36`) mais sans forcer un ratio carré.
- **Solution :** Wrapper l'image dans un `div` avec `aspect-square` + `overflow-hidden` + fond neutre `bg-gray-50`, et utiliser `object-cover` pour remplir parfaitement le carré. Ajout d'un zoom léger au survol (`group-hover:scale-[1.03]`) pour un effet premium cohérent avec la fiche produit.
- **Leçon :** Pour une grille produits harmonieuse : toujours forcer un ratio fixe (`aspect-square` ou `aspect-[4/3]`) sur le conteneur image plutôt que de fixer une hauteur arbitraire.

---

## 🧹 Check-list Avant Livraison Finale (Bonnes pratiques adoptées)
*   **Qualité CSS :** Respect des attributs d'accessibilité (`prefers-reduced-motion`) et attributs `aria-labels` pour les liseuses.
*   **Performance :** Hook useMemo déployés, écouteurs de Scroll / Click Events nettoyés au démontage du composant.
*   **Clean Code :** Supression des anciens `console.log()` parasites et des TODOs. Compilation TypeScript strictement validée (`tsc --noEmit`).
*   **Environnement :** Aucune clé Stripe ou Auth écrite en clair dans les fichiers (`secrets` GitHub exclusifs).
