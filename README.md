# ⚠️ Ne pas supprimer

Ce dépôt ne contient volontairement qu'un seul fichier technique (`firebase-messaging-sw.js`).

Il est requis par l'application **PROLIFIC** (dépôt `prolific-dashboard`), qui vit à
`https://brunyvincentmorel-oss.github.io/prolific-dashboard/`.

Firebase Cloud Messaging (le service de notifications push utilisé par Prolific)
vérifie automatiquement l'existence de ce fichier à la **racine** du domaine
GitHub Pages, en plus de la copie déjà présente dans le dossier de l'app elle-même.
Sans ce fichier ici, l'app affichait une erreur inoffensive mais gênante à chaque
connexion.

Ce dépôt n'héberge aucune page, aucune donnée, et n'est lié à aucun autre projet.
