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

### Bug 13 : Les Données Fantômes — 114 Commandes Tests Persistantes
- **Symptôme :** Après suppression manuelle de ~50 commandes test via le back-office Directus, le dashboard admin (Historique des Ventes et Comptabilité) continuait d'afficher 114 anciennes commandes. Les hard-refresh navigateur ne changeaient rien.
- **Investigation et fausses pistes :**
  1. *React-Query / Redux / Service Worker / localStorage* : Aucun système de cache client trouvé dans le code. Éliminé.
  2. *Materialized View* : L'objet `admin_orders_dashboard_final` n'était PAS une Vue Matérialisée (`REFRESH` refusé par PostgreSQL).
  3. *Vue classique (VIEW)* : Ce n'était PAS non plus une Vue classique. Résultat `information_schema.tables` : **BASE TABLE**.
  4. *Découverte* : C'était une **table physique dénormalisée**, remplie une seule fois par un workflow n8n sans mécanisme de synchronisation à la suppression.
- **Première tentative (échec) :** Remplacement de la table par une `CREATE VIEW` PostgreSQL. La vue fonctionnait parfaitement en SQL, MAIS **Directus 11.x ne supporte pas les VIEWs** dans son schema inspector (Knex). Le snapshot de schéma montrait la collection sans section `schema:` → collection "virtuelle" inaccessible via l'API (`FORBIDDEN`).
- **Solution finale :**
  1. Remplacement de la VIEW par une **TABLE physique recréée** via `CREATE TABLE AS SELECT` avec les mêmes JOINs (`orders`, `customers`, `order_items`, `product_variants`).
  2. Ajout d'une `PRIMARY KEY (order_id)`.
  3. Création d'une **fonction trigger** `koktek.sync_admin_dashboard()` qui reconstruit la table à chaque `INSERT`/`UPDATE`/`DELETE` sur `orders`.
  4. Création du trigger `trg_sync_admin_dashboard` (AFTER, FOR EACH STATEMENT) sur `koktek.orders`.
  5. `GRANT SELECT, INSERT, UPDATE, DELETE` à `directus_user` et `n8n_user`.
- **Résultat :** L'API retourne désormais uniquement les vraies commandes. Toute modification sur `orders` se répercute instantanément sur le dashboard.
- **Leçons :**
  1. **Directus 11.x + VIEWs PostgreSQL = incompatible.** Toujours utiliser des `BASE TABLE` pour les collections Directus.
  2. **Toute table dénormalisée doit avoir un trigger de synchronisation** pour éviter les données orphelines.
  3. **La policy Directus `admin_access = true` bypasse les permissions individuelles**, mais ne résout pas un mapping schéma manquant.
  4. **Ne jamais partager de credentials (mots de passe, tokens API) dans un chat IA** — utiliser un gestionnaire de secrets.

---

### Bug 14 : Triggers orphelins bloquant tous les UPDATE sur `koktek.orders`

**Date :** 2026-03-05
**Sévérité :** 🔴 Critique (table `orders` en lecture seule — workflow n8n bloqué)

**Symptôme :**
Toute tentative de modifier une commande via Directus ou en SQL direct renvoyait :
```
ERROR: relation "koktek.admin_orders_dashboard" does not exist
CONTEXT: PL/pgSQL function koktek.update_dashboard_final() line 16 at SQL statement
```

**Cause racine :**
Lors du Bug 13 (remplacement de la table par un trigger), une ancienne infrastructure de mise à jour avait été laissée en place sans être nettoyée :
- **`trigger_update_orders_dash`** sur `koktek.orders` → appelait `update_dashboard_final()`
- **`trigger_update_items_dash`** sur `koktek.order_items` → dépendait de la même fonction
- **`koktek.update_dashboard_final()`** → tentait de lire `koktek.admin_orders_dashboard` (vue supprimée lors du Bug 13)

Ces trois objets étaient orphelins et invisibles dans le dashboard Directus, rendant le diagnostic difficile.

**Résolution :**
```sql
DROP TRIGGER IF EXISTS trigger_update_orders_dash ON koktek.orders;
DROP FUNCTION IF EXISTS koktek.update_dashboard_final() CASCADE;
-- Le CASCADE a auto-supprimé trigger_update_items_dash sur order_items
```

**Vérification :** `UPDATE koktek.orders SET cj_order_id = 'SD2603041359570641800' WHERE id = 'd67ba7e1-...'` → `UPDATE 1` ✅

**Leçon retenue :**
Lors de toute refonte de trigger SQL, **toujours auditer les triggers existants** avant et après intervention :
```sql
SELECT event_object_table, trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'koktek'
ORDER BY event_object_table;
```
Ne jamais se contenter de créer un nouveau trigger sans s'assurer qu'aucun ancien n'est encore actif sur les mêmes tables. Utiliser `DROP ... CASCADE` pour nettoyer les dépendances en chaîne.

---

## 🧹 Check-list Avant Livraison Finale (Bonnes pratiques adoptées)
*   **Qualité CSS :** Respect des attributs d'accessibilité (`prefers-reduced-motion`) et attributs `aria-labels` pour les liseuses.
*   **Performance :** Hook useMemo déployés, écouteurs de Scroll / Click Events nettoyés au démontage du composant.
*   **Clean Code :** Supression des anciens `console.log()` parasites et des TODOs. Compilation TypeScript strictement validée (`tsc --noEmit`).
*   **Environnement :** Aucune clé Stripe ou Auth écrite en clair dans les fichiers (`secrets` GitHub exclusifs).

---

## 🗞 Post-Mortem : Intégration du Blog (Mars 2026)

> **Contexte :** Ajout d'une section Blog SEO (`/blog`) avec relation M2M vers `products`, workflow n8n de rédaction automatique par IA, et insertion programmatique des articles. Ce qui aurait dû prendre 2h a pris une journée complète.

---

### Bug 15 : Conflit de droits PostgreSQL — `ALTER TABLE` refusé par Directus

**Date :** 10 mars 2026  
**Sévérité :** 🔴 Critique (bloquant — impossible de créer la relation M2M depuis l'UI)

**Symptôme :**
```
[INTERNAL_SERVER_ERROR] alter table "..." add constraint "..." foreign key
("blog_posts_id") references "blog_posts" ("id") on delete SET NULL
— permission denied for table blog_posts
```

**Cause racine :**
Les tables `koktek.blog_posts` et `koktek.products` avaient été créées manuellement via **pgAdmin, connecté en superadmin** (`n8n_user` ou `postgres`). Ces tables appartenaient donc à ce compte. Lorsque Directus (connecté en tant que `directus_user`) essaie d'ajouter une contrainte de clé étrangère pour créer la relation M2M, PostgreSQL refuse : seul le **propriétaire** d'une table peut la modifier.

**Résolution :**
```sql
ALTER TABLE koktek.blog_posts OWNER TO directus_user;
ALTER TABLE koktek.products   OWNER TO directus_user;
GRANT USAGE, CREATE ON SCHEMA koktek TO directus_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA koktek TO directus_user;
```

**Leçon retenue :**
> ⚠️ **Règle d'or** : Toute table destinée à être gérée par Directus **doit impérativement être créée avec `directus_user` comme owner**, ou faire l'objet d'un `ALTER TABLE ... OWNER TO directus_user` immédiatement après sa création.  
> Ne jamais créer une table "Directus" depuis pgAdmin connecté en superadmin sans corriger le owner derrière.

---

### Bug 16 : Collections fantômes Directus (`blog_posts_products_1`, `_2`, `_3`)

**Date :** 10 mars 2026  
**Sévérité :** 🟠 Majeur (pollution du Data Model, confusion, risque de corruption)

**Symptôme :**
À chaque tentative échouée de création de la relation M2M depuis l'UI Directus, le système générait une nouvelle collection fantôme suffixée : `blog_posts_products_1`, `blog_posts_products_2`, `blog_posts_products_3`…

**Cause racine :**
Directus tente de créer la junction table, échoue à mi-chemin (erreur SQL de permission), mais a déjà enregistré partiellement la collection dans ses tables système (`directus_collections`, `directus_fields`, `directus_relations`). La prochaine tentative ne retrouvant pas l'ancienne entrée exacte, elle incrémente le suffixe.

**Résolution :**
```sql
-- Nettoyage manuel dans les tables système Directus
DELETE FROM directus_fields     WHERE collection LIKE 'blog_posts_products_%';
DELETE FROM directus_relations  WHERE many_collection LIKE 'blog_posts_products_%'
                                   OR one_collection  LIKE 'blog_posts_products_%';
DELETE FROM directus_collections WHERE id LIKE 'blog_posts_products_%';
DROP TABLE IF EXISTS blog_posts_products_1 CASCADE;
DROP TABLE IF EXISTS blog_posts_products_2 CASCADE;
DROP TABLE IF EXISTS blog_posts_products_3 CASCADE;
```
Suivi d'un `docker restart koktek_directus` pour vider le cache mémoire de Directus.

**Leçon retenue :**
> Avant toute tentative de création d'une relation Directus, **s'assurer que tous les droits PostgreSQL sont en place**. Si une création échoue, **toujours nettoyer les tables système Directus** avant de réessayer, sinon on accumule des collections zombies.

---

### Bug 17 : Tables de jointure M2M créées dans `public` au lieu de `koktek`

**Date :** 10 mars 2026  
**Sévérité :** 🟠 Majeur (problème de droits pour n8n, incohérence d'architecture)

**Symptôme :**
Directus crée la junction table `blog_posts_products` dans le schéma `public` par défaut, alors que toutes les tables métier du projet sont dans le schéma `koktek`. Résultat : l'utilisateur `n8n_user` (qui a des droits sur `koktek` mais pas sur `public`) ne peut pas insérer de liaisons produits via le workflow automatisé.

**Cause racine :**
Directus ne dispose pas d'un paramètre natif pour choisir dans quel schéma PostgreSQL créer ses tables de jointure M2M. Il utilise son `search_path` par défaut, qui pointe vers `public`.

**Résolution (court terme) :**
```sql
GRANT ALL PRIVILEGES ON TABLE public.blog_posts_products TO n8n_user;
GRANT USAGE, SELECT ON SEQUENCE public.blog_posts_products_id_seq TO n8n_user;
```

**Résolution (long terme / propre) :**
```yaml
# docker-compose.yml — forcer le search_path Directus
environment:
  DB_SEARCH_PATH: "koktek,public"
```
```sql
ALTER TABLE public.blog_posts_products SET SCHEMA koktek;
```
Puis `docker restart koktek_directus`.

**Leçon retenue :**
> Documenter la position de chaque table de jointure dès sa création. Si le projet utilise un schéma custom, **configurer `DB_SEARCH_PATH`** dans le docker-compose de Directus **avant** de créer les premières relations M2M.

---

### Bug 18 : Champs `summary` et `published_at` inconnus de Directus

**Date :** 10 mars 2026  
**Sévérité :** 🟡 Moyen (API retournait FORBIDDEN sur ces champs)

**Symptôme :**
```json
{"errors": [{"message": "You don't have permission to access fields
\"summary\", \"published_at\" in collection \"blog_posts\" or they do not exist."}]}
```

**Cause racine :**
Les colonnes existaient dans la table PostgreSQL (créées via pgAdmin), mais n'étaient pas enregistrées dans la table système `directus_fields`. Directus refuse d'exposer tout champ non déclaré dans son registre interne, même si la colonne existe physiquement en base.

**Résolution :**
```sql
INSERT INTO directus_fields (collection, field, special, interface, display, sort)
VALUES
  ('blog_posts', 'summary',      NULL,           'textarea', 'raw',      20),
  ('blog_posts', 'published_at', 'date-created', 'datetime', 'datetime', 21);
```
Suivi d'un redémarrage Directus pour invalider le cache de métadonnées.

**Leçon retenue :**
> Toute colonne ajoutée directement en SQL (sans passer par l'UI Directus) **doit être déclarée dans `directus_fields`** ou ajoutée via *Data Model → Add Field → Existing Column*. Sinon, Directus l'ignore complètement même si elle est visible dans pgAdmin.

---

### Bug 19 : Page `/blog` affichait "Impossible de charger" malgré une API fonctionnelle

**Date :** 10 mars 2026  
**Sévérité :** 🟡 Moyen (bloquant pour l'utilisateur final, trompeur pour le debug)

**Symptôme :**
Le frontend affichait le message d'erreur "Impossible de charger les articles." alors que `curl` sur le même endpoint retournait `{"data":[]}` sans erreur.

**Cause racine :**
Le message d'erreur masquait en réalité l'erreur `FORBIDDEN` sur les champs `summary` et `published_at` (Bug 18). La liste de champs demandée par `getBlogPosts()` contenait ces deux champs non déclarés dans Directus → l'API retournait un `403`, capturé par le `.catch()` du front, qui affichait le message générique.

**Timing :** Ce bug a été résolu en même temps que le Bug 18. Le `curl` de vérification initialement testé ne demandait **pas** les champs problématiques, ce qui a créé une fausse piste ("l'API marche, le bug doit être ailleurs").

**Leçon retenue :**
> Pour déboguer une erreur API front, **toujours tester avec exactement les mêmes champs** que la requête du code (`BLOG_LIST_FIELDS`), pas avec un subset simplifié. Utiliser l'URL encodée complète depuis le code source plutôt qu'une URL recomposée à la main.

---

## 🤔 Analyse Stratégique : Directus vs Supabase

### Aurions-nous eu ces problèmes avec Supabase self-hosted ?

**Réponse honnête : en partie non, en partie oui.**

| Problème rencontré | Directus | Supabase self-hosted |
|---|---|---|
| Conflit owner PostgreSQL | ✅ Présent | ⚠️ Aussi possible si tables créées hors Supabase |
| Collections fantômes (cache corrompu) | ✅ Présent | ❌ N/A — Supabase n'a pas ce concept |
| Junction M2M dans mauvais schéma | ✅ Présent | ❌ N/A — Supabase n'abstrait pas les jointures |
| Champs invisibles (`directus_fields`) | ✅ Présent | ❌ N/A — Supabase expose directement le schéma SQL |
| Peer auth PostgreSQL | ✅ Présent | ✅ Aussi présent (même PostgreSQL derrière) |

**Ce que Supabase change fondamentalement :**
- Supabase **expose directement le schéma PostgreSQL** via une API REST auto-générée (PostgREST). Il n'y a pas de "couche de modèle" entre la DB et l'API : ce que tu crées en SQL est immédiatement disponible.
- Pas de `directus_fields`, `directus_collections`, `directus_relations` à synchronized. **Le schéma SQL EST le modèle.**
- La Studio UI de Supabase permet d'exécuter du SQL directement, de voir les triggers, les fonctions RPC, les politiques RLS.

**Ce que Supabase ne résout PAS :**
- Les conflits de droits PostgreSQL existent aussi (même moteur). Supabase gère ça via **RLS (Row Level Security)** — plus élégant, mais avec sa propre courbe d'apprentissage.
- La version **self-hosted** est plus complexe à maintenir que la version Cloud (stack Docker avec une dizaine de services : PostgREST, GoTrue, Realtime, Storage, Kong…).
- La **version self-hosted ne bénéficie pas des mises à jour automatiques** et des optimisations Cloud.

---

### Verdict : Faut-il remplacer Directus par Supabase ?

| Critère | Directus | Supabase Cloud | Supabase Self-hosted |
|---|---|---|---|
| **Facilité de setup** | ✅ 1 conteneur Docker | ✅ Zéro infra | ⚠️ ~12 services Docker |
| **UI d'admin** | ✅ Excellente | ✅ Excellente | ✅ Excellente |
| **Relation M2M** | ⚠️ Complexe (vu ce soir) | ✅ SQL pur, simple | ✅ SQL pur, simple |
| **Exposition API** | ✅ REST configurable | ✅ REST + Realtime + GraphQL | ✅ Idem |
| **Gestion des droits** | ⚠️ Via `directus_users` + owner PG | ✅ RLS PostgreSQL natif | ✅ RLS PostgreSQL natif |
| **Compatibilité n8n** | ✅ Nœud natif n8n | ✅ Nœud natif n8n + HTTP | ✅ Idem |
| **Coût Cloud** | N/A (self-hosted) | 💰 25$/mois (Pro) | Gratuit (infra propre) |
| **Robustesse production** | ⚠️ Quelques bugs cache | ✅ Très solide | ⚠️ Dépend de l'infra |
| **Intégration Stripe** | ✅ Via webhooks n8n | ✅ Via Edge Functions | ✅ Via webhooks n8n |

**Recommandation :**

> 🔵 **Court terme (0-6 mois) :** Garder Directus. La stack fonctionne, les bugs sont documentés et évitables. Migrer maintenant aurait un coût élevé pour un gain incertain.

> 🟢 **Moyen terme (6-12 mois) :** Si vous lancez une **V2 de l'architecture** (nouveau projet, refonte majeure), **Supabase Cloud est clairement supérieur** pour ce cas d'usage (e-commerce, blog, automatisations n8n). L'API auto-générée, le RLS, et la studio évitent 80% des frictions rencontrées avec Directus.

> ⚠️ **Supabase self-hosted** n'est pas recommandé à moins d'avoir un DevOps dédié. La stack Docker est lourde (12+ services) et les mises à jour manuelles sont un risque.

**Si migration vers Supabase Cloud un jour :**
1. Export PostgreSQL → Import dans Supabase (migration straightforward, même schéma)
2. Remplacer les appels `requestDirectus('/items/...')` par `supabase.from('...').select()`
3. Migrer les politiques Directus en **Row Level Security (RLS)** PostgreSQL
4. Les workflows n8n changent de nœud (`Supabase` au lieu de `Directus`)

---

### Supabase Free — Quand faut-il passer Pro ?

| Ressource | Limite Free | KOKTEK estimé | Verdict |
|---|---|---|---|
| Base de données | 500 MB | ~30-50 MB | ✅ Des années de marge |
| Bandwidth | 5 GB/mois | Blog + API | ✅ OK |
| Stockage fichiers | 1 GB | Dépend des images | ⚠️ Voir section images |
| API requests | Illimité | — | ✅ |
| Backups automatiques | ❌ (Pro only) | Critique en prod | ⚠️ Risque |

**⚠️ Piège critique du Free : pause automatique après 7 jours d'inactivité.**
Solution gratuite : cron n8n toutes les 6 jours avec un simple `SELECT 1`.

**Moment réel pour passer Pro :** Quand le CA dépasse ~1 000€/mois (les 25$/mois deviennent négligeables) ET/OU pour activer les backups journaliers automatiques.

---

## 🖼 Hébergement Images — Stratégie Recommandée

### Contexte

Le champ `image_url` dans `products` et `cover_image` dans `blog_posts` peuvent stocker :
- Un **UUID** → Directus le résout via `https://directus.koktek.com/assets/{uuid}`
- Une **URL externe complète** → déjà gérée nativement par `resolveImageUrl()` dans le front

```typescript
// src/utils/image.ts — extrait
if (/^https?:\/\//i.test(raw)) return raw  // URL externe = passée telle quelle ✅
```

**Aucun changement de code nécessaire** pour utiliser des URLs externes dans les champs image.

---

### Comparaison des hébergeurs (2026)

| Hébergeur | Free | CDN | Transformations | Fiabilité commerciale |
|---|---|---|---|---|
| **Cloudinary** | 25 GB stockage + 25 GB bw | ✅ Mondial | ✅ `?w=800&f=webp&q=auto` | ✅ Recommandé |
| **ImgBB** | Illimité, permanent | ✅ | ❌ | ✅ Bon pour blog |
| **Imgur** | Gratuit | ✅ | ❌ | ❌ Supprime les images commerciales depuis 2023 |
| **Bunny.net** | ~1€/mois | ✅ Ultra-rapide | ❌ | ✅ Pro |

**Choix recommandé : Cloudinary (free tier)**
- 25 GB = des milliers d'images produits
- Transformations à la volée via l'URL : `../upload/w_800,h_800,c_fill,f_webp,q_auto/photo.jpg`
- CDN mondial inclus → images chargées en ~50ms partout

---

### Workflow d'ajout d'image avec Cloudinary

```
1. Upload sur cloudinary.com (drag & drop)
2. Copier l'URL : https://res.cloudinary.com/votre-compte/image/upload/v1/photo.jpg
3. Coller dans Directus → champ image_url du produit ou cover_image du blog post
4. Le front l'affiche automatiquement via resolveImageUrl() ✅
```

### Migration `cover_image` (UUID → TEXT) pour les blog posts

Actuellement `cover_image` est de type `UUID` (FK vers `directus_files`). Pour accepter des URLs externes :

```sql
-- Sur le VPS (en postgres superuser)
ALTER TABLE koktek.blog_posts
  ALTER COLUMN cover_image TYPE TEXT USING cover_image::TEXT;
```

Puis dans Directus → Data Model → `blog_posts` → champ `cover_image` → changer l'interface de `image` vers `input (text)`.

---

## 📋 Récapitulatif des Décisions Architecturales (Mars 2026)

| Décision | Choix retenu | Raison |
|---|---|---|
| Backend CMS | **Directus** (court terme) | Stack existante fonctionnelle |
| Backend CMS V2 | **Supabase Cloud** | SQL natif, RLS, API auto, Studio |
| Hébergement images | **Cloudinary free** | CDN + transformations + fiable |
| Schéma PostgreSQL | **`koktek`** pour les tables métier | Isolation propre |
| Tables de jointure M2M | **`public`** (Directus par défaut) | GRANT accordé à n8n_user en attendant |
| Hébergement frontend | **VPS + Nginx + Docker** via GitHub Actions | Maîtrise totale du déploiement |
| Blog SEO | **React SPA /blog** alimenté par Directus | Aucun SSR, rendu client |


