# 🏭 Prompt Factory

Bienvenue dans **Prompt Factory**, votre atelier modulaire pour concevoir, stocker et assembler vos briques de prompts réutilisables.

---

## 🚀 Comment lancer l'application ?

Vous avez deux méthodes très simples :
1. **Méthode 1 (Le plus simple) :** Double-cliquez sur le fichier `Lancer Prompt Factory.bat`.
2. **Méthode 2 :** Double-cliquez directement sur le fichier `index.html`.

L'application s'ouvre immédiatement dans votre navigateur habituel (Edge, Chrome, Firefox, Brave...). **Aucune installation de logiciel n'est nécessaire.**

---

## ✨ Fonctionnalités Clés

### 1. Bibliothèque de Blocs (Volet Gauche)
* **Création d'un bloc (+)** : Cliquez sur **"+ Nouveau Bloc"** pour ajouter une brique. Renseignez un titre évocateur (ex: `🎯 Rôle`, `⚡ Contrainte`, `📊 Format`) et le texte du prompt.
* **Aperçu aéré** : Le texte est tronqué par défaut pour ne pas encombrer l'écran. Un bouton *"Voir tout le texte"* permet de déplier le bloc.
* **Sélection intuitive** : Cliquez n'importe où sur un bloc pour l'ajouter ou le retirer de votre prompt assemblé. Un badge avec le numéro d'ordre (`#1`, `#2`...) apparaît dès qu'il est sélectionné.
* **Actions rapides** :
  * ✏️ **Modifier** : Modifiez le titre ou le contenu à tout moment.
  * 📋 **Dupliquer** : Créez une variante en un clic.
  * 🗑️ **Supprimer** : Supprimez les blocs obsolètes.

### 2. Atelier d'Assemblage & Copie (Volet Droit)
* **Réorganisation facile** : Changez l'ordre des blocs sélectionnés via les flèches (Monter/Descendre) ou en les faisant glisser (**Drag & Drop**).
* **Séparateur personnalisé** : Choisissez comment lier vos blocs (Double saut de ligne, simple saut, ligne séparatrice Markdown `---`, ou liste numérotée).
* **Aperçu en temps réel** : Visualisez instantanément le prompt complet avant de l'envoyer.
* **Compteur & Statistiques** : Suivez le nombre de mots, de caractères et l'estimation des tokens.
* **📋 Bouton "Copier le Prompt"** : Copie l'intégralité du résultat dans votre presse-papier. Collez-le ensuite directement (`Ctrl + V`) dans ChatGPT, Claude, Gemini, Mistral ou DeepSeek.

### 3. Sauvegarde & Sécurité
* **Sauvegarde automatique locale** : Vos blocs sont automatiquement enregistrés dans votre navigateur (`LocalStorage`). Vous ne perdez rien en fermant l'onglet.
* **Bouton Exporter (JSON)** : Téléchargez une copie de sauvegarde de votre collection sur votre disque local ou votre espace cloud.
* **Bouton Importer (JSON)** : Restaurez ou fusionnez une bibliothèque de blocs depuis un fichier JSON.
* **Exporter en Markdown (.md)** : Téléchargez directement le prompt assemblé sous forme de document texte.

---

## 🎒 Version Portable

Pour utiliser Prompt Factory partout sans aucune installation :
* **Fichier autonome unique** : [`portable/PromptFactory-Standalone.html`](portable/PromptFactory-Standalone.html) regroupe l'application complète dans un seul fichier HTML que vous pouvez emporter sur clé USB et lancer sur n'importe quel ordinateur.
* **Archive ZIP complète** : [`portable/PromptFactory-Portable.zip`](portable/PromptFactory-Portable.zip) contient l'ensemble des fichiers prêts à l'emploi.

---

## ⌨️ Raccourcis Clavier Utiles

| Raccourci | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Entrée</kbd> | **Copier le prompt assemblé** (ou Enregistrer dans la fenêtre d'édition) |
| <kbd>Échap</kbd> | Fermer la fenêtre d'édition |
| <kbd>Ctrl</kbd> + <kbd>V</kbd> | Coller le prompt dans votre outil d'IA |

---

*Conçu pour une productivité maximale avec les modèles de langage actuels.*
