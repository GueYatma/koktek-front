# 🗺️ Cahier des Charges & Roadmap KOKTEK

Ce document trace l'avancement des tâches, ce qui était prévu, et comment cela a été réellement implémenté.

## 🟢 Phase 1 : Tunnel de Paiement & Facturation (Terminé)

- [x] **Tâche 1 : Intégration Stripe (Front-end)**
  - *Prévu :* Paiement par carte classique.
  - *Réalité :* Implémenté avec génération d'un UUID unique `order_id` côté Front, passé à Stripe via les `metadata` pour garder la trace absolue de la commande.

- [x] **Tâche 2 : Webhook Stripe & Base de données (Directus)**
  - *Prévu :* Enregistrer la commande après paiement.
  - *Réalité :* Webhook capté par n8n. **Écart noté :** La table `orders` dépendait d'un `customer_id`. On a ajusté l'architecture pour forcer l'inclusion de `recipient_name` et `email` directement dans le JSON `shipping_address` pour faciliter la facturation.

- [x] **Tâche 3 : Génération de Facture (PDFMonkey)**
  - *Prévu :* Génération auto du PDF.
  - *Réalité :* Implémenté via n8n. Mapping complexe réalisé via un nœud Code JavaScript pour rattraper les bons noms de colonnes (`total_products_price`, `shipping_price`).

- [x] **Tâche 4 : Envoi de l'e-mail client (SMTP)**
  - *Prévu :* Envoyer la facture au client.
  - *Réalité :* Implémenté via SMTP Hostinger dans n8n en toute fin de chaîne, avec le PDF attaché en donnée binaire (`data`).
