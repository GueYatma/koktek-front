# 🧠 Retour d'Expérience (RETEX) & Debug Log

Ce document liste les bugs majeurs rencontrés sur le projet, leurs causes, et la solution pour ne plus jamais reproduire l'erreur. À lire impérativement pour tout nouvel agent ou développeur sur le projet.

## 🐛 Bug 1 : L'UUID fantôme (Perte de l'Order ID dans n8n)
- **Symptôme :** Le workflow n8n envoyait un faux numéro de commande (ex: `c8f47e3d...`) à CJ Dropshipping, la base de données ne trouvait rien.
- **Cause (Back-end/n8n) :** Le nœud `[DB] Save Billing Info` (PostgreSQL) recrachait l'`id` de la nouvelle adresse de facturation qu'il venait de créer. Le nœud suivant utilisait bêtement `{{ $json.id }}`, écrasant ainsi l'ID de la commande.
- **Solution :** Ne jamais utiliser un nœud préfabriqué à l'aveugle. On a forcé le mapping avec `{{ $json.order_id }}` ou en remontant directement à la source du webhook Stripe.

## 🐛 Bug 2 : Manque d'infos client pour la facturation
- **Symptôme :** Facture éditée au nom de "Client KOKTEK" par défaut.
- **Cause (Front/Directus) :** Une architecture BDD trop stricte. La table `orders` ne contenait que le `customer_id`. Le Front-end envoyait bien la rue et la ville dans `shipping_address`, mais oubliait d'y inclure le nom du destinataire.
- **Solution :** Obligation d'injecter `recipient_name` et `email` directement dans le payload de création de commande côté Front pour que n8n puisse les lire facilement.

## 🐛 Bug 3 : Images et Logos cassés sur la facture PDF
- **Symptôme :** Les variables `logo_url` et `image_url` étaient bien envoyées à PDFMonkey, mais le PDF affichait une image brisée ou rien du tout.
- **Cause (PDFMonkey) :** On envoyait la donnée brute sans modifier le template HTML.
- **Solution :** Il ne suffit pas d'envoyer l'URL. Le modèle PDFMonkey doit obligatoirement inclure la balise HTML correcte : `<img src="{{image_url}}">`.

## 🐛 Bug 4 : L'e-mail part sans pièce jointe
- **Symptôme :** Le nœud d'envoi d'e-mail ne trouvait pas la facture.
- **Cause (n8n) :** Problème d'ordonnancement. Le nœud Email était branché *avant* le nœud de téléchargement du PDF.
- **Solution :** Le nœud `Send Email` doit être l'ultime étape du workflow, et on doit spécifier la "Binary Property" (`data`) dans la section Attachments.
