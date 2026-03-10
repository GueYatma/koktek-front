# Journal KOKTEK - Workflow V2

## Objectif

Passer d'un blog généré **à partir de produits** à un Journal généré **à partir de sujets SEO validés**.

Le workflow V2 :
- lit un sujet dans `koktek.seo_topics`
- le réserve en `in_progress`
- sélectionne jusqu'à `max_products` produits
- génère un **brouillon** dans `koktek.blog_posts`
- crée les liaisons M2M vers `public.blog_posts_products`
- marque le sujet en `generated`

Le fichier à importer dans n8n est :

`n8n-workflows/KOKTEK - Journal SEO Draft V2 (PostgreSQL + OpenRouter).json`

---

## Cycle de statut recommandé

### `seo_topics.status`

- `idea` : idée non prête
- `approved` : sujet validé, prêt à être généré
- `in_progress` : sujet réservé par le workflow
- `generated` : brouillon créé dans `blog_posts`
- `published` : article publié après validation humaine
- `archived` : sujet abandonné ou clos

### `blog_posts.manual_review_status`

- `draft_ai` : statut legacy possible
- `needs_review` : brouillon IA à relire
- `approved` : validé éditorialement
- `published` : publié

---

## Champs `seo_topics` utilisés par la V2

- `title`
- `target_keyword`
- `secondary_keywords`
- `search_intent`
- `pillar`
- `article_type`
- `angle`
- `audience`
- `brief`
- `seasonality`
- `priority`
- `min_words`
- `max_products`
- `manual_product_ids`
- `generated_post_id`
- `last_generated_at`

`product_filters` est déjà prévu en base mais reste réservé à une V2+ plus fine.

---

## Comportement produits

La V2 supporte déjà :
- `manual_product_ids` : si renseigné, ces produits sont prioritaires
- fallback automatique : si la liste manuelle est incomplète, le workflow complète avec des produits publiés aléatoires

La V2 ne force pas les produits dans l'intro.
Ils sont fournis à l'IA comme **solutions contextuelles possibles**, pas comme point de départ.

---

## Comportement article

Le workflow crée un `blog_posts` avec :
- `status = 'draft'`
- `manual_review_status = 'needs_review'`
- `source_topic = seo_topics.id`
- `author_label = 'Journal KOKTEK'`

Il remplit aussi :
- `pillar`
- `article_type`
- `reading_time`
- `target_keyword`
- `search_intent`
- `seasonality`
- `seo_title`
- `seo_description`
- `cover_image`
- `cover_image_alt`

L'article reste volontairement non publié pour laisser la validation humaine décider.

---

## Import n8n

1. Importer le fichier JSON V2 dans n8n.
2. Vérifier les credentials :
   - `Postgres account`
   - `OpenRouter account`
3. Laisser le workflow en test tant qu'il n'a pas été validé sur un ou deux sujets.
4. Désactiver ensuite l'ancien workflow V1 orienté produits si la V2 donne satisfaction.

---

## Routine éditoriale recommandée

1. Créer les sujets dans `seo_topics`
2. Passer à `approved` uniquement les sujets prêts
3. Laisser n8n générer les brouillons
4. Relire dans Directus
5. Corriger titre, chapo, intertitres, méta SEO si besoin
6. Publier ensuite dans `blog_posts`

---

## Point de vigilance

Si un run n8n échoue après réservation du sujet, le sujet peut rester en `in_progress`.

Dans ce cas :
- vérifier le run n8n
- corriger la cause
- remettre manuellement le sujet en `approved` si aucun brouillon exploitable n'a été créé
