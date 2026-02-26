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
