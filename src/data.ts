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
    question: "Comment apprecIAtion respecte-t-il les règles du RGPD ?",
    answer: "Le logiciel est conçu selon le principe de 'Privacy by Design'. Aucune donnée d'identité d'élève n'est requise. Seuls les prénoms, les moyennes et vos critères d'observation (items) sont transmis à l'API française souveraine Mistral AI via des tunnels cryptés et sécurisés. Les serveurs de Mistral AI sont hébergés en France et en Europe, conformément aux circulaires du Ministère de l'Éducation Nationale. Aucun stockage persistant des élèves n'est effectué à l'extérieur de votre machine."
  },
  {
    question: "Le logiciel nécessite-t-il un abonnement ou un paiement unique ?",
    answer: "La licence individuelle enseignant est disponible sous forme d'achat unique ou d'abonnement annuel très accessible (remboursable via vos frais réels ou crédits d'équipement enseignant). Nous proposons également des licences d'établissement pour équiper l'ensemble d'un collège ou d'un lycée."
  },
  {
    question: "Comment le logiciel s'intègre-t-il à Pronote ou ÉcoleDirecte ?",
    answer: "Il s'intègre sous forme d'un petit volet flottant très discret ou par un système de copier-coller intelligent accéléré. Comme le montre l'interface inspirée d'ed-panels.js, vous naviguez d'un élève à l'autre d'un simple clic et appliquez la version choisie. Le texte est instantanément collé dans le champ de saisie de votre navigateur, vous épargnant des milliers de clics superflus."
  },
  {
    question: "Puis-je l'installer sur plusieurs ordinateurs ?",
    answer: "Oui. Avec votre licence individuelle, vous pouvez installer et activer le logiciel sur votre ordinateur personnel à la maison (Windows, Mac ou Linux) et sur l'ordinateur portable fourni par votre établissement ou votre académie."
  },
  {
    question: "Puis-je personnaliser entièrement la grille de critères ?",
    answer: "Absolument. Vous pouvez ajouter, modifier ou supprimer des colonnes thématiques (Travail, Comportement, Méthode, Devoirs...) et enregistrer autant de profils de grilles d'évaluation que vous le souhaitez (par classe, par niveau ou par matière)."
  }
];
