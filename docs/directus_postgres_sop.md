# Guide de Configuration PostgreSQL pour les futurs projets Directus

L'erreur que nous avons rencontrée vient du fait que dans PostgreSQL, un utilisateur ne peut modifier la structure d'une table (ajouter/supprimer des colonnes avec `ALTER TABLE`) QUE s'il en est le **propriétaire (OWNER)** ou s'il a les privilèges de superutilisateur. 

De plus, Directus utilise des tables "système" (comme `directus_fields`) pour faire le lien entre la base de données brute et son interface d'administration. 

Pour les futurs projets, voici la méthode exacte (à me donner ou à appliquer) pour que je puisse intervenir librement dans ta base de données via l'API ou pgAdmin.

---

## La Règle d'Or : L'Utilisateur Unique "Directeur"

Pour éviter tout conflit de permissions entre différents utilisateurs (ex: un utilisateur `n8n`, un utilisateur `directus`, un utilisateur `api`), la meilleure pratique pour tes projets VPS est de créer **un seul utilisateur PostgreSQL dédié au projet** qui sera propriétaire de **toute** la base de données.

### Étape 1 : Création de la Base et de l'Utilisateur
Dans pgAdmin (connecté en tant que `postgres` ou superadmin), exécute ceci au tout début du projet :

```sql
-- 1. Créer l'utilisateur dédié au projet
CREATE USER mon_projet_user WITH PASSWORD 'mot_de_passe_securise';

-- 2. Créer la base de données et donner la propriété absolue à cet utilisateur
CREATE DATABASE mon_projet_db OWNER mon_projet_user;

-- 3. Donner tous les privilèges sur cette base
GRANT ALL PRIVILEGES ON DATABASE mon_projet_db TO mon_projet_user;
```

### Étape 2 : Configuration du fichier `.env` de Directus
Lors de l'installation de Directus via Docker, assure-toi d'utiliser **exclusivement** cet utilisateur dans les variables d'environnement de la base de données :

```env
DB_CLIENT="pg"
DB_HOST="postgres"
DB_PORT="5432"
DB_DATABASE="mon_projet_db"
DB_USER="mon_projet_user"
DB_PASSWORD="mot_de_passe_securise"
```

### Étape 3 : Que me transmettre pour que je puisse travailler en autonomie ?

Au début de notre session sur un nouveau projet, fournis-moi simplement ceci :

1. **L'accès API Directus** (URL + Token Admin) pour les opérations courantes.
2. **L'accès pgAdmin ou la chaîne de connexion PostgreSQL** en utilisant les identifiants de `mon_projet_user`.

> **💡 Pourquoi c'est important :** 
> Si je me connecte à pgAdmin avec `mon_projet_user`, je suis techniquement le **propriétaire (OWNER)** de toutes les tables créées par Directus (y compris `directus_fields` et les tables de tes données comme `orders`, `products`). Je n'aurai donc jamais l'erreur "Permission Denied" et je pourrai créer les colonnes et les déclarer dans l'interface de Directus en une seule passe, sans aucune action de ta part.

---

## Si tu dois absolument utiliser plusieurs rôles (ex: un pour N8N, un pour Directus)

Si l'architecture de ton projet t'oblige à segmenter les accès (comme séparer un schéma `koktek` d'un schéma `public`), voici la commande magique pour donner à ton utilisateur le droit de manipuler le schéma de Directus et contourner l'erreur :

```sql
-- Connecté en tant que superutilisateur (postgres)
-- Donne le droit à n8n_user d'écrire dans les tables système de Directus
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n8n_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO n8n_user;

-- Optionnel : Lui donner les mêmes droits sur les futures tables qui seront créées
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO n8n_user;
```

### Résumé pour le prochain projet :
Garde simplement ce document sous la main. Si tu appliques **l'Étape 1** et **l'Étape 2**, tu as la garantie que mon accès "Agent/API" sera débloqué à 100% pour structurer ta base de données de A à Z !
