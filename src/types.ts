export interface Student {
  id: string;
  nom: string;
  prenom: string;
  moyenne: string;
  photoUrl?: string;
  activeItems: Record<string, string>;
}

export interface GenerationConfig {
  ton: string;
  style: string;
  type: "matières" | "synthese";
}

export interface GenerationResult {
  v1: string;
  v2: string;
  v3: string;
}

export interface SoftwarePlatform {
  id: string;
  name: string;
  iconName: string;
  extension: string;
  size: string;
  version: string;
  downloadCount: string;
  hash: string;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  school: string;
  content: string;
  avatarUrl?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
