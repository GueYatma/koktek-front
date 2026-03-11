# Database Schema

Voici la liste de toutes tes tables et de leurs colonnes (champs) extraites de ton instance Directus :

## Table: `cart_items`
- `id`: uuid
- `cart_id`: uuid
- `product_id`: uuid
- `variant_id`: uuid
- `quantity`: integer
- `unit_price`: numeric
- `currency`: character
- `created_at`: timestamp with time zone
- `updated_at`: timestamp with time zone

## Table: `carts`
- `id`: uuid
- `customer_email`: character varying
- `items`: jsonb
- `updated_at`: timestamp without time zone
- `customer_id`: uuid

## Table: `categories`
- `id`: uuid
- `name`: character varying
- `slug`: character varying
- `description`: text
- `image_url`: text
- `created_at`: timestamp without time zone

## Table: `customers`
- `id`: uuid
- `email`: character varying
- `first_name`: character varying
- `last_name`: character varying
- `phone`: character varying
- `address_line1`: text
- `city`: character varying
- `zip_code`: character varying
- `country_code`: character varying
- `created_at`: timestamp without time zone

## Table: `directus_files`
- `id`: uuid
- `storage`: character varying
- `filename_disk`: character varying
- `filename_download`: character varying
- `title`: character varying
- `type`: character varying
- `folder`: uuid
- `uploaded_by`: uuid
- `created_on`: timestamp with time zone
- `modified_by`: uuid
- `modified_on`: timestamp with time zone
- `charset`: character varying
- `filesize`: bigint
- `width`: integer
- `height`: integer
- `duration`: integer
- `embed`: character varying
- `description`: text
- `location`: text
- `tags`: text
- `metadata`: json
- `focal_point_x`: integer
- `focal_point_y`: integer
- `tus_id`: character varying
- `tus_data`: json
- `uploaded_on`: timestamp with time zone

## Table: `directus_users`
- `id`: uuid
- `first_name`: character varying
- `last_name`: character varying
- `email`: character varying
- `password`: character varying
- `location`: character varying
- `title`: character varying
- `description`: text
- `tags`: json
- `avatar`: uuid
- `language`: character varying
- `tfa_secret`: character varying
- `status`: character varying
- `role`: uuid
- `token`: character varying
- `last_access`: timestamp with time zone
- `last_page`: character varying
- `provider`: character varying

## Table: `order_billing`
- `id`: uuid
- `order_id`: uuid
- `billing_name`: text
- `company_name`: text
- `tax_id`: text
- `email`: text
- `phone`: text
- `address_line1`: text
- `address_line2`: text
- `postal_code`: text
- `city`: text
- `region`: text
- `country`: text
- `created_at`: timestamp with time zone
- `updated_at`: timestamp with time zone

## Table: `order_delivery`
- `id`: uuid
- `order_id`: uuid
- `status`: delivery_status
- `recipient_name`: text
- `email`: text
- `phone`: text
- `address_line1`: text
- `address_line2`: text
- `postal_code`: text
- `city`: text
- `region`: text
- `country`: text
- `delivery_method`: text
- `carrier`: text
- `tracking_number`: text
- `shipped_at`: timestamp with time zone
- `delivered_at`: timestamp with time zone
- `created_at`: timestamp with time zone
- `updated_at`: timestamp with time zone

## Table: `order_items`
- `id`: uuid
- `order_id`: uuid
- `variant_id`: uuid
- `product_title`: character varying
- `variant_name`: character varying
- `quantity`: integer
- `unit_price`: numeric
- `total_price`: numeric
- `product_id`: uuid
- `date_created`: timestamp with time zone

## Table: `orders`
- `id`: uuid
- `order_number`: character varying
- `customer_id`: uuid
- `status`: character varying
- `payment_status`: character varying
- `total_products_price`: numeric
- `shipping_price`: numeric
- `total_price`: numeric
- `shipping_address`: jsonb
- `cj_order_id`: character varying
- `tracking_number`: character varying
- `tracking_url`: text
- `logistic_name`: character varying
- `created_at`: timestamp without time zone
- `payment_reference`: character varying
- `cart_id`: uuid
- `payment_method`: character varying
- `delivery_time_estimation`: character varying

## Table: `product_variants`
- `id`: uuid
- `product_id`: uuid
- `cj_vid`: character varying
- `sku`: character varying
- `option1_name`: text
- `option1_value`: text
- `option2_name`: text
- `option2_value`: text
- `price`: numeric
- `compare_at_price`: numeric
- `cost_price`: numeric
- `stock_quantity`: integer
- `weight_grams`: integer
- `image_url`: text
- `created_at`: timestamp without time zone
- `option1_value_factorized`: text
- `shipping_price`: numeric (DEFAULT 0)
- `prix_calcule`: numeric (GENERATED — formule auto)

## Table: `products`
- `id`: uuid
- `title`: character varying
- `slug`: character varying
- `description`: text
- `base_price`: numeric
- `cj_pid`: character varying
- `status`: character varying
- `tags`: text[]
- `created_at`: timestamp without time zone
- `updated_at`: timestamp without time zone
- `image`: text
- `reference`: character varying
- `cj_category_id`: character varying
- `brand`: character varying
- `ai_feedback`: text
- `categories_id`: uuid
- `images`: text
- `shipping_options`: jsonb
- `expert_score`: numeric
- `expert_review`: text
- `retail_price`: numeric
- `country_origin`: character varying
- `margin`: numeric
- `urssaf_fee`: numeric
- `vat_amount`: numeric

## Table: `returns`
- `id`: uuid
- `order_id`: uuid
- `reason`: character varying
- `status`: character varying
- `customer_note`: text
- `admin_note`: text
- `image_proof_url`: text
- `refund_amount`: numeric
- `created_at`: timestamp without time zone

---

## Table: `blog_posts` *(schéma : `koktek`)*

> Créée le 10 mars 2026. Owner PostgreSQL : `directus_user`.

- `id`: uuid — clé primaire
- `status`: character varying — valeurs : `published`, `draft`, `archived`
- `user_created`: uuid — FK → `directus_users.id`
- `date_created`: timestamp with time zone
- `title`: character varying — titre de l'article
- `slug`: character varying — identifiant URL unique (index unique `blog_posts_slug_unique`)
- `excerpt`: text — résumé court (champ legacy, utiliser `summary`)
- `summary`: text — résumé affiché sur la carte de liste
- `cover_image`: text — ID d'asset Directus ou URL externe de l'image de couverture
- `cover_image_alt`: text — texte alternatif de l'image de couverture
- `category`: character varying — catégorie libre (ex: "Accessoires", "Guides")
- `pillar`: character varying — pilier éditorial structurant (`auto-mobilite`, `tech-productivite`, etc.)
- `article_type`: character varying — format éditorial (`guide`, `checklist`, `comparatif`, etc.)
- `featured`: boolean — mise en avant éventuelle sur la home du Journal
- `reading_time`: integer — temps de lecture estimé ou calculé
- `target_keyword`: character varying — mot-clé SEO principal
- `search_intent`: character varying — intention (`informational`, `commercial`, `transactional`)
- `seasonality`: character varying — saisonnalité (`evergreen`, `saisonnier`, `opportuniste`)
- `manual_review_status`: character varying — état de validation humaine (`draft_ai`, `needs_review`, `reviewed`, `published`)
- `source_topic`: uuid — FK → `koktek.seo_topics.id`
- `author_label`: character varying — libellé auteur affiché (défaut : `Journal KOKTEK`)
- `published_at`: timestamp with time zone — date de publication affichée
- `content`: text — contenu HTML riche (WYSIWYG Directus)
- `seo_title`: character varying — balise `<title>` SEO personnalisée
- `seo_description`: character varying — meta description SEO

### Relation éditoriale : `blog_posts.source_topic` → `seo_topics.id`

Un article du Journal peut être rattaché à un sujet SEO source (`seo_topics`) pour tracer l'origine du brief, de la génération IA et du workflow de validation.

---

## Table: `seo_topics` *(schéma : `koktek`)*

> Créée le 10 mars 2026 pour piloter la génération V2 du Journal KOKTEK.

- `id`: uuid — clé primaire
- `status`: character varying — valeurs : `idea`, `approved`, `in_progress`, `generated`, `published`, `archived`
- `title`: character varying — titre interne du sujet
- `target_keyword`: character varying — mot-clé principal
- `secondary_keywords`: text — liste libre de mots-clés secondaires
- `search_intent`: character varying — intention SEO
- `pillar`: character varying — pilier éditorial cible
- `article_type`: character varying — type d'article cible
- `angle`: text — angle éditorial à pousser
- `audience`: text — audience visée
- `brief`: text — brief humain ou notes éditoriales
- `seasonality`: character varying — `evergreen`, `saisonnier`, `opportuniste`
- `priority`: integer — ordre de priorité de traitement
- `source_label`: character varying — source du sujet (`Google Search Console`, brainstorming, etc.)
- `source_url`: text — URL de référence éventuelle
- `min_words`: integer — longueur minimale souhaitée
- `max_products`: integer — nombre maximal de produits à recommander
- `manual_product_ids`: jsonb — liste d'IDs produits imposés
- `product_filters`: jsonb — filtres produits éventuels (réservé V2+)
- `generated_post_id`: uuid — FK → `koktek.blog_posts.id`
- `published_target_date`: date — date cible de publication
- `last_generated_at`: timestamp with time zone — dernière tentative de génération
- `notes`: text — remarques internes
- `created_at`: timestamp with time zone
- `updated_at`: timestamp with time zone

### Relation M2M : `blog_posts` ↔ `products`

| Côté | Détail |
|------|--------|
| Table de jointure | `blog_posts_products` |
| Champ Directus | `products` (M2M sur `blog_posts`) |
| Junction field A | `blog_posts_id` → `blog_posts.id` |
| Junction field B | `products_id` → `products.id` |
| Usage | Afficher des "Produits recommandés" en bas de chaque article |

---

## Table: `blog_posts_products` *(schéma : `public`)*

> Table de jointure M2M créée automatiquement par Directus le 10 mars 2026.

- `id`: integer — clé primaire auto-incrémentée
- `blog_posts_id`: uuid — FK → `koktek.blog_posts.id` ON DELETE SET NULL
- `products_id`: uuid — FK → `koktek.products.id` ON DELETE SET NULL

---

## Notes de configuration PostgreSQL

### Schémas utilisés

| Schéma | Tables | Owner |
|--------|--------|-------|
| `koktek` | `blog_posts`, `seo_topics`, `products`, `orders`, `order_items`, etc. | `directus_user` |
| `public` | Tables système Directus + `blog_posts_products` | `directus_user` / `postgres` |

### Droits accordés (session 10 mars 2026)

```sql
-- directus_user : propriétaire + tous droits sur koktek
ALTER TABLE koktek.blog_posts OWNER TO directus_user;
ALTER TABLE koktek.seo_topics OWNER TO directus_user;
ALTER TABLE koktek.products   OWNER TO directus_user;
GRANT USAGE, CREATE ON SCHEMA koktek TO directus_user;
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA koktek TO directus_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA koktek TO directus_user;

-- n8n_user : droits d'écriture (pgAdmin + workflows n8n)
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA koktek TO n8n_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA koktek TO n8n_user;
GRANT USAGE ON SCHEMA koktek TO n8n_user;

-- n8n_user : droits sur la table de jointure (schéma public, 10 mars 2026)
GRANT ALL PRIVILEGES ON TABLE public.blog_posts_products TO n8n_user;
GRANT USAGE, SELECT ON SEQUENCE public.blog_posts_products_id_seq TO n8n_user;
```

---

## Permissions Directus (rôle Public)

| Collection | Create | Read | Update | Delete |
|------------|--------|------|--------|--------|
| `blog_posts` | ✗ | ✅ | ✗ | ✗ |
| `seo_topics` | ✗ | ✗ | ✗ | ✗ |
| `blog_posts_products` | ✗ | ✅ | ✗ | ✗ |
| `products` | ✗ | ✅ | ✗ | ✗ |
| `cart_items` | ✅ | ✅ | ✅ | ✗ |

---

## Frontend — Appels API Blog (`commerceApi.ts`)

### `getBlogPosts({ limit, offset, category })`
```
GET /items/blog_posts
  ?filter[status][_eq]=published
  &sort=-published_at
  &fields=id,slug,title,summary,cover_image,cover_image_alt,category,
          pillar,article_type,featured,reading_time,author_label,
          published_at,status
```

### `getBlogPost(slug)`
```
GET /items/blog_posts
  ?filter[slug][_eq]={slug}
  &filter[status][_eq]=published
  &fields=id,slug,title,summary,cover_image,cover_image_alt,category,
          pillar,article_type,featured,reading_time,target_keyword,
          search_intent,seasonality,manual_review_status,source_topic,
          author_label,published_at,status,content,seo_title,seo_description,
          products.id,
          products.products_id.id,products.products_id.title,
          products.products_id.slug,products.products_id.retail_price,
          products.products_id.image,products.products_id.status
```

### Routes React (`App.tsx`)
- `/blog` → `BlogListPage.tsx` (home éditoriale du Journal KOKTEK)
- `/blog/:slug` → `BlogPostPage.tsx` (article, sommaire, sorties éditoriales et produits liés)

### Workflows n8n
- `KOKTEK - Auto-Blogging SEO (PostgreSQL + OpenRouter).json` : ancien workflow V1, orienté produits
- `KOKTEK - Journal SEO Draft V2 (PostgreSQL + OpenRouter).json` : nouveau workflow V2, orienté `seo_topics`, génération en `draft`, validation humaine avant publication
