# AGENTS

## Règles de collaboration pour ce dossier
- Avant toute modification, fournir un mini‑rapport clair (liste numérotée 1 à 5 points maximum) avec la liste des changements prévus.
- Attendre une validation explicite (ex. `programme validé` ou `validé`) avant de commencer les changements.
- Montrer la liste avant de commencer à travailler, à chaque demande.

## Git push protocol (KOKTEK)
When the user says "push to GitHub":
- Create a short French commit message with a French prefix from the list below.
- Push to GitHub.
- Confirm in chat with a very visible message in bold: **PUSH OK — ...** or **PUSH ÉCHEC — ...**, including the commit name.
- Local notifications:
  - `.githooks/post-push` shows a macOS "PUSH OK" notification (requires `terminal-notifier`).
  - `scripts/push-notify` shows macOS notifications for PUSH OK/ÉCHEC and GitHub Actions deploy VPS OK/ÉCHEC (requires `terminal-notifier` + `gh auth login`). It disables the post-push notification to avoid duplicates.
- Local alias: `git pushn` runs `scripts/push-notify` for the full notification flow.
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
- `ci:` Pipeline CI/CD ou scripts d’automatisation.
- `config:` Configuration ou paramètres d’environnement.
- `maintenance:` Nettoyage, tâches techniques diverses.
- `revert:` Annulation d’un commit.

## Build stamp
- Build stamp uses `VITE_BUILD_ID` (set from `GITHUB_SHA` in CI).
- Stamp is shown in the footer to confirm the deployed version.
