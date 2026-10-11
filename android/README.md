# Compilation Android de CoopFix

Le projet Android est commun à toutes les coops. Il ne contient aucune adresse de coop imposée, aucun compte ni aucune clé de base de données.

## Première ouverture

La personne entre ou scanne l’adresse HTTPS de sa coop. Le site doit exposer `/.well-known/coopfix.json` (fourni dans `public/`). L’application mémorise cette adresse sur le téléphone. Un changement de coop efface les sessions locales, sans supprimer les données de la coop.

## Outils

Java 17, SDK Android avec plateforme 36 et Build Tools 35.0.0. Le lanceur Gradle 8.13 est fourni et sa distribution est vérifiée par SHA-256. Accepter les licences des outils Android avant installation.

Définir ANDROID_HOME vers le SDK ou créer `local.properties` avec `sdk.dir`. Ne pas publier ce fichier.

Sous Windows : `gradlew.bat testDebugUnitTest lintDebug assembleDebug`.
Pour le fichier Google Play : `gradlew.bat bundleRelease` après configuration de la signature.

## Signature privée

Créer une clé d’envoi dédiée et conserver une sauvegarde sécurisée. Créer `keystore.properties` localement avec storeFile, storePassword, keyAlias et keyPassword. Le fichier, les mots de passe et la clé ne doivent jamais être ajoutés au dépôt ni au modèle public. Sans configuration de signature, un bundle de release ne constitue pas un fichier prêt à envoyer.

## Vérifications avant distribution

Essayer sur téléphone : première ouverture, QR, adresse invalide, confirmation de coop, connexion, billets, commentaires, retour, arrêt/reprise, mode hors ligne et changement de coop. Vérifier aussi les liens de confidentialité et de suppression de compte. Les demandes de suppression sont manuelles et nécessitent une procédure effective avec les administrateurs des coops.

Version 1.0.0 compilée et signée : 3 tests Java réussis, lint sans erreur bloquante, signature APK vérifiée et bundle validé avec bundletool. Les essais sur appareil restent à effectuer.
