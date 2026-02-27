-- Migration: ajout du champ prix_calcule (generated column) dans product_variants
-- Formule : (cost_price + shipping_price + marge) / 0.877
-- Marge = 2€ si (cost_price + shipping_price) < 10€, sinon 4€

-- 1. Ajouter shipping_price si absent
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS shipping_price NUMERIC DEFAULT 0;

-- 2. Ajouter la colonne calculée automatiquement
ALTER TABLE product_variants
  ADD COLUMN prix_calcule NUMERIC
  GENERATED ALWAYS AS (
    ROUND(
      (COALESCE(cost_price, 0) + COALESCE(shipping_price, 0) +
       CASE WHEN (COALESCE(cost_price, 0) + COALESCE(shipping_price, 0)) < 10 THEN 2 ELSE 4 END
      ) / 0.877,
      2
    )
  ) STORED;
