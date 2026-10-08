# CoopFix — Une installation par coop

Le même modèle sert à plusieurs coops. Chaque coop reçoit **son site et sa base de données séparés**. Il n'y a pas d'inscription à une plateforme centrale partagée.

- **La personne responsable de l'installation, désignée par votre coop,** installe le site, connecte la base et les courriels, prépare le compte administrateur et vérifie le fonctionnement.
- **L'administrateur** configure le nom, les adresses, le courriel de réception et les rôles des membres.
- **Les membres s'inscrivent eux-mêmes** sur le site de leur coop, choisissent leur adresse/logement et créent leurs billets.

L'interface originale est conservée. L'aide « Comment ça marche » présente les étapes simples et une capture d'exemple des paramètres.

La propriété des comptes, les frais et la maintenance sont à convenir avec chaque coop. Aucun domaine d'envoi commun n'est fourni automatiquement.

Documents :
- `GUIDE-SIMPLE.html` : guide illustré à ouvrir dans un navigateur, après l'installation.
- `GUIDE-COOP.md` : démarrage simple pour l'administrateur et les membres.
- `GUIDE-INSTALLATION.md` : installation technique initiale, destinée à la personne responsable de l'installation.
- `MISES-A-JOUR.md` : conserver un code commun et mettre à jour chaque installation.
- `SUIVI-INSTALLATIONS.md` : tableau à remplir pour suivre les sites et leurs versions, sans secrets.
- `VERIFICATIONS.md` : contrôles effectués et limites.

Développement : `pnpm install --frozen-lockfile`, configurez `.env.local` selon `.env.example`, puis `pnpm dev`.

Vérifications : `pnpm exec tsc --noEmit -p tsconfig.app.json`, `pnpm build`, `node --experimental-strip-types --test tests/notifications.test.mjs`.
