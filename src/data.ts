import { Student, SoftwarePlatform, Testimonial, FaqItem } from "./types";

export const CONFIG_ITEMS: Record<string, string[]> = {
  "Travail": ["Très sérieux", "Satisfaisant", "Irrégulier", "Insuffisant", "Approfondi"],
  "Compréhension": ["Très bonne", "Bonne globale", "Fragile", "Grosses difficultés", "En progrès"],
  "Participation": ["Active", "Bonne", "Variable", "Faible", "Insuffisante"],
  "Comportement": ["Exemplaire", "Correct", "Bavardages", "À canaliser", "Passif"],
  "Conseils": ["Poursuivre ainsi", "Efforts attendus", "Plus de rigueur", "S'investir davantage"]
};

export const MOCK_STUDENTS: Student[] = [
  {
    id: "lucas",
    prenom: "Lucas",
    nom: "Garnier",
    moyenne: "14.5",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    activeItems: {
      "Travail": "Très sérieux",
      "Compréhension": "Très bonne",
      "Participation": "Active",
      "Comportement": "Correct",
      "Conseils": "Poursuivre ainsi"
    }
  },
  {
    id: "sophie",
    prenom: "Sophie",
    nom: "Martineau",
    moyenne: "18.2",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    activeItems: {
      "Travail": "Approfondi",
      "Compréhension": "Très bonne",
      "Participation": "Bonne",
      "Comportement": "Exemplaire",
      "Conseils": "Poursuivre ainsi"
    }
  },
  {
    id: "thomas",
    prenom: "Thomas",
    nom: "Rousseau",
    moyenne: "8.6",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    activeItems: {
      "Travail": "Irrégulier",
      "Compréhension": "Fragile",
      "Participation": "Variable",
      "Comportement": "Bavardages",
      "Conseils": "Plus de rigueur"
    }
  },
  {
    id: "emma",
    prenom: "Emma",
    nom: "Faure",
    moyenne: "11.4",
    photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    activeItems: {
      "Travail": "Satisfaisant",
      "Compréhension": "En progrès",
      "Participation": "Variable",
      "Comportement": "Correct",
      "Conseils": "Efforts attendus"
    }
  }
];

export const SOFTWARE_BUILDS: SoftwarePlatform[] = [
  {
    id: "windows",
    name: "Windows 10 / 11",
    iconName: "Monitor",
    extension: ".msi (x64 / ARM)",
    size: "42.8 Mo",
    version: "v2.1.4 (LTS)",
    downloadCount: "12 450",
    hash: "SHA-256: 3a9f...e102"
  },
  {
    id: "macos",
    name: "macOS (M1/M2/M3 & Intel)",
    iconName: "Apple",
    extension: ".dmg (Universel)",
    size: "48.2 Mo",
    version: "v2.1.4 (LTS)",
    downloadCount: "8 910",
    hash: "SHA-256: a1e8...d92b"
  },
  {
    id: "linux",
    name: "Linux (Debian / Ubuntu / Fedora)",
    iconName: "Terminal",
    extension: ".zip",
    size: "230,6 Mio",
    version: "V1.2",
    downloadCount: "3 850",
    hash: "SHA-256: e8b9...f21d"
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    author: "Mme Valérie Dupont",
    role: "Professeure de Mathématiques & Professeure Principale",
    school: "Collège Jean Moulin (Lyon)",
    content: "Une révolution pour mes fins de trimestres ! Avec 4 classes de 30 élèves, la rédaction des appréciations me prenait des week-ends entiers. apprecIAtion me permet de générer des propositions précises basées sur mes grilles, tout en gardant 100% de contrôle sur ce que je valide. Et surtout : aucune donnée élève n'est divulguée en ligne.",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120"
  },
  {
    id: "2",
    author: "M. Olivier Bertrand",
    role: "Enseignant d'Histoire-Géographie",
    school: "Lycée Saint-Exupéry (Bordeaux)",
    content: "La conformité RGPD était un critère non négociable pour moi. apprecIAtion fonctionne soit en local, soit via un proxy sécurisé avec Mistral AI, sans jamais envoyer de noms ou d'informations d'identité. Le gain de temps est colossal, et les appréciations sont bienveillantes, variées et très bien formulées !",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120"
  }
];

export const FAQS: FaqItem[] = [
  {
    question: "Comment apprecIAtion protège-t-il les données des élèves ?",
    answer: "Le prénom est remplacé par un pseudonyme avant tout envoi, et le nom de famille n'est jamais lu ni transmis. Les notes chiffrées, les dates de naissance et les identifiants de compte ne sortent pas du navigateur. Les appréciations, elles, sont transmises à notre relais puis à Mistral pour être reformulées : c'est ce qui produit la proposition de texte. Le détail complet figure dans notre politique de confidentialité."
  },
  {
    question: "Le logiciel nécessite-t-il un abonnement ou un paiement unique ?",
    answer: "Un paiement unique, sans abonnement. Vous réglez une fois, et la licence est valable pour l'année scolaire en cours : aucun prélèvement récurrent, aucune carte enregistrée, rien à résilier. Pour l'année suivante, il suffit de reprendre une licence si vous souhaitez continuer."
  },
  {
    question: "Comment le logiciel s'intègre-t-il à École Directe ?",
    answer: "Il s'installe comme une extension de navigateur et se présente sous la forme d'un volet léger posé sur la page École Directe que vous utilisez déjà. Vous n'avez ni export à produire, ni double saisie à faire. La prise en charge de Pronote est en cours de développement."
  },
  {
    question: "Sur quels ordinateurs puis-je l'installer ?",
    answer: "L'extension s'installe depuis un fichier, dans Firefox, Chrome, Edge et Safari, sous Windows, macOS et Linux. Le paquet se trouve dans votre espace client, immédiatement après le paiement. Installation en une dizaine de secondes."
  },
  {
    question: "Puis-je personnaliser entièrement la grille de critères ?",
    answer: "Oui. Vous modifiez vos critères thématiques matière par matière, et l'outil s'appuie sur ceux que vous avez définis — pas sur une grille imposée."
  },
  {
    question: "Que se passe-t-il à la fin de l'année scolaire ?",
    answer: "La licence s'arrête d'elle-même : il n'y a pas de reconduction tacite, donc rien à résilier et aucun prélèvement surprise. Vos listes d'élèves et vos corrections, elles, restent dans votre navigateur ; rien ne disparaît. Si vous reprenez une licence l'année suivante, vous retrouvez votre travail en place."
  }
];
