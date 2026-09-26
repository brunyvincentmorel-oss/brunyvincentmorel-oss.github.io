# ⚠️ Ne pas supprimer

Ce dépôt ne contient volontairement qu'un seul fichier technique (`firebase-messaging-sw.js`).

Il est requis par l'application **PROLIFIC** (dépôt `prolific-dashboard`), qui vit à
`https://brunyvincentmorel-oss.github.io/prolific-dashboard/`.

Firebase Cloud Messaging (le service de notifications push utilisé par Prolific)
vérifie automatiquement l'existence de ce fichier à la **racine** du domaine
GitHub Pages, en plus de la copie déjà présente dans le dossier de l'app elle-même.
Sans ce fichier ici, l'app affichait une erreur inoffensive mais gênante à chaque
connexion.

En dehors du dossier `bvm-plan-3d/` (voir ci-dessous), ce dépôt n'héberge aucune page,
aucune donnée, et n'est lié à aucun autre projet.

## Site vitrine BVM PLAN 3D

Le dossier `bvm-plan-3d/` contient le site de présentation de l'application BVM PLAN 3D
(HTML/CSS/JS statique, Three.js chargé depuis cdnjs). Il est indépendant de PROLIFIC et
ne touche pas à `firebase-messaging-sw.js`.

- Formulaire de demande de démo : renseigner l'attribut `data-endpoint` du formulaire
  (`bvm-plan-3d/index.html`, ex. une URL Formspree) pour activer l'envoi.
- Vidéos et captures : déposer les fichiers dans `bvm-plan-3d/media/` avec ces noms exacts.
  Tant qu'un fichier manque, le site affiche un aperçu rendu en 3D à sa place.
  - `visite-1.mp4` (+ `visite-1.jpg` en vignette), `visite-2.mp4` (+ `visite-2.jpg`)
  - `vue-eclatee.jpg`, `vue-interieure.jpg`, `vue-dessus.jpg`
- Design system : `design-system/bvm-plan-3d/MASTER.md` (généré avec ui-ux-pro-max,
  ajusté à l'identité BVM).
