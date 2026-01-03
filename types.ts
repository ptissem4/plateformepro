
export enum SubscriptionTier {
  Lancement = "Offre de Lancement (Gratuit)",
  Base = "Base",
  VisibilitePlus = "Visibilité Plus",
  VisibiliteDefinitive = "Pack Visibilité Définitive",
}

export enum Category {
  Gastronomie = "Gastronomie & Terroir",
  Maison = "Maison & Jardin",
  Proximite = "Services de Proximité",
  Sante = "Bien-être & Santé",
  Shopping = "Shopping & Boutiques",
  Loisirs = "Loisirs & Tourisme",
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  isApproved: boolean; // New field for moderation
}

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    description: string; // ex: "Renouvellement Mensuel - Visibilité Plus"
    status: 'paid' | 'failed' | 'pending';
}

export interface Business {
  id: string;
  Nom_Entreprise: string;
  Catégorie_Secteur: Category[];
  Localisation: string;
  Statut_Formule: SubscriptionTier;
  Lien_Page_Pro: string;
  Téléphone: string; // Public Phone
  Phrase_Accroche: string;
  Logo_Photo: string;
  Priorité_Tri: number;
  Description: string;
  Horaires: string;
  Adresse: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  email: string; // Login email
  password?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  offreDuMois?: {
    title: string;
    description: string;
    image?: string;
  };
  reviews?: Review[];
  isApproved?: boolean;
  seoTitle?: string;
  metaDescription?: string;
  referralCode?: string;
  referralCredit?: number;
  subscriptionEndDate?: string; // New field for admin management
  isFreeTrial?: boolean; // New field to track gifted status
  paymentFrequency?: 'monthly' | 'annual'; // New field for MRR/ARR calc
  paymentStatus?: 'active' | 'late' | 'cancelled'; // New: status calculated based on date
  transactions?: Transaction[]; // New: payment history
  
  // --- NOUVEAUX CHAMPS PRIVES (ADMIN ONLY) ---
  managerName?: string; // Nom & Prénom du Gérant
  personalPhone?: string; // Téléphone portable direct
  billingEmail?: string; // Email de facturation / contact direct
}


export type SortBy = 'priority' | 'distance' | 'rating';

export interface Coords {
  lat: number;
  lng: number;
}

// Data for creating a new account after payment
export interface AccountCreationData {
    companyName: string;
    email: string;
    password_sub: string;
    // New fields for registration
    category: Category;
    city: string;
    description: string;
    publicPhone: string;
    managerName: string;
    personalPhone: string;
    billingEmail: string;
}

export type View = 'directory' | 'details' | 'offers' | 'professional' | 'payment' | 'admin' | 'category' | 'adminDashboard' | 'referral' | 'advertising' | 'contact';