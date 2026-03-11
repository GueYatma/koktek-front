# AGENTS

## Git push protocol (KOKTEK)
When the user says "push to GitHub":
- Create a short French commit message with a French prefix from the list below.
- Push to GitHub.
- Confirm in chat with a very visible message in bold: **PUSH OK — ...** or **PUSH ÉCHEC — ...**, including the commit name.
- Verify the GitHub Actions run if possible. If access is blocked, ask the user for the run link or share a manual check.
- Verify deployment using the build stamp on the site and report the result.

## French commit prefixes
- `ajout:` Nouvelle fonctionnalité.
- `corr:` Correction de bug.
- `refacto:` Refactorisation sans changement fonctionnel.
- `doc:` Documentation uniquement.
- `test:` Ajout ou modification de tests.
- `perf:` Amélioration des performances.
- `style:` Mise en forme, CSS, ou ajustements visuels sans logique métier.
- `deps:` Mise à jour des dépendances.
- `ci:` Pipeline CI/CD ou scripts d'automatisation.
- `config:` Configuration ou paramètres d'environnement.
- `maintenance:` Nettoyage, tâches techniques diverses.
- `revert:` Annulation d'un commit.

## Build stamp
- Build stamp uses `VITE_BUILD_ID` (set from `GITHUB_SHA` in CI).
- Stamp is shown in the footer to confirm the deployed version.

## Protocole d'accès et secrets

- Mode par défaut : toujours travailler en **autorisation par défaut** tant que la tâche peut être réalisée localement dans le workspace.
- Si une tâche nécessite un accès réel hors sandbox (base PostgreSQL, Directus, n8n, VPS, logs système, réseau, fichiers hors workspace, ou commandes bloquées), **le demander explicitement à l'utilisateur avant d'aller plus loin**.
- Si des identifiants sont nécessaires, l'utilisateur peut les déposer dans `docs/keys.md`.
- Ne consulter `docs/keys.md` que si la tâche en a réellement besoin et **après accord explicite de l'utilisateur** pour utiliser ces accès.
- Une fois l'accès complet accordé, annoncer brièvement l'action sensible visée (ex: requête SQL, vérification Directus, inspection VPS) avant exécution.
- Revenir au mode le plus restrictif possible dès que l'action nécessitant l'accès complet est terminée.
- En cas de blocage, doute, ou échec lié aux permissions/accès, ne pas improviser : demander l'accès complet plutôt que forcer un contournement fragile.

## Protocole n8n

- Pour tout nouveau workflow n8n ou toute modification de workflow n8n, **livrer le JSON complet dans le chat**.
- L'utilisateur importe, colle, construit ou modifie lui-même le workflow dans son interface n8n.
- L'utilisateur effectue le premier test dans n8n et confirme le résultat.
- Après confirmation utilisateur, aider à corriger, ajuster ou expliquer le workflow si nécessaire.
- **Ne jamais importer, modifier, publier, supprimer ou exécuter directement un workflow n8n sur le VPS** sans validation explicite de l'utilisateur.
- Si un test live n8n est nécessaire, proposer d'abord la marche à suivre ou le JSON à importer, plutôt que d'agir directement sur l'instance.

## ⛔ Fichiers d'infrastructure — NE PAS MODIFIER

Les fichiers suivants contrôlent le déploiement vers le VPS.
**Ne JAMAIS les modifier** sans l'accord explicite de l'utilisateur :

| Fichier | Rôle |
|---------|------|
| `.github/workflows/deploy.yml` | Workflow GitHub Actions — déploie le build sur le VPS |
| `docker-compose.yml` | Configuration Docker (Directus + Nginx) — copie de référence |
| `default.conf` | Config Nginx pour le SPA React (try_files) |

### Règles strictes
1. **Ne JAMAIS modifier `deploy.yml`** — le déploiement utilise `rsync` pour mettre à jour les fichiers sans casser le bind mount Docker. Ne pas remplacer `rsync` par `mv`, `cp`, ou `rm` sur le dossier `dist`.
2. **Ne JAMAIS modifier `docker-compose.yml`** — les containers sont gérés sur le VPS, ce fichier local est une copie de référence.
3. **Ne JAMAIS modifier `default.conf`** — la directive `try_files` est essentielle pour le routage SPA.
4. **Ne JAMAIS utiliser `mv` ou `rm` sur des dossiers montés par Docker** dans les scripts de déploiement — cela change l'inode et casse le bind mount.

## Architecture de déploiement (pour référence)

```
Local → git push → GitHub → GitHub Actions (build) → SCP + rsync → VPS
                                                                     ↓
                                              /root/koktek_front/dist/ (bind mount → Nginx container)
```

- Le workflow construit le site sur GitHub Actions (pas sur le VPS).
- Le build est envoyé par SCP dans un dossier temporaire.
- `rsync --delete` synchronise le contenu vers le dossier live (sans changer l'inode).
- Le container Nginx voit immédiatement les nouveaux fichiers.
- **Aucun redémarrage Docker n'est nécessaire** lors du déploiement.
