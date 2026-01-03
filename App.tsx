
import React, { useState, useMemo, useEffect } from 'react';
import { Business, Category, SubscriptionTier, Review, SortBy, Coords, AccountCreationData, View } from './types';
// import { mockBusinesses } from './data/mockData'; // SUPPRIMÉ POUR FIX NETLIFY
import Header from './components/Header';
import Filters from './components/Filters';
import BusinessCard from './components/BusinessCard';
import BusinessDetail from './components/BusinessDetail';
import FeaturedPartners from './components/FeaturedPartners';
import Offers from './components/Offers';
import CallToActionCard from './components/CallToActionCard';
import SearchBar from './components/SearchBar';
import { haversineDistance } from './utils/geolocation';
import ProfessionalSpace from './components/ProfessionalSpace';
import Payment from './components/Payment';
import AdminDashboard from './components/AdminDashboard';
import CategoryCloud from './components/CategoryCloud';
import CategoryPage from './components/CategoryPage';
import BusinessDashboard from './components/BusinessDashboard';
import ReferralPage from './components/ReferralPage';
import { getTierPrice, PRICING_CONFIG } from './utils/pricing';
import AdBanners from './components/AdBanners';
import AdvertisingOffers from './components/AdvertisingOffers';
import ContactPage from './components/ContactPage';
import { getAdminBusinesses, upsertBusiness, addReview, moderateReview } from './services/supabaseService';

const ADMIN_EMAIL = 'admin@plateforme.pro';
const ADMIN_PASS = 'admin123';

// --- INTEGRATION DIRECTE DES DONNÉES MOCK POUR ÉVITER LES ERREURS DE BUILD NETLIFY ---
// Helper to get dates relative to today
const getFutureDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

const getPastDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
};

const mockBusinesses: Business[] = [
  {
    id: '1',
    Nom_Entreprise: "Le Jardin Secret d'Amélie",
    Catégorie_Secteur: [Category.Shopping, Category.Maison],
    Localisation: "Anse",
    Statut_Formule: SubscriptionTier.VisibiliteDefinitive,
    Lien_Page_Pro: "https://example.com/jardin-amelie",
    Téléphone: "04 74 12 34 56",
    Phrase_Accroche: "L'art floral réinventé au cœur d'Anse.",
    Logo_Photo: "https://images.unsplash.com/photo-1596627685790-9c176378e12d?w=800&h=450&fit=crop",
    Priorité_Tri: 3,
    Description: "Amélie, fleuriste passionnée, crée des bouquets uniques et des compositions florales pour toutes les occasions. Spécialisée dans les fleurs de saison et les ateliers d'art floral, elle apporte une touche de poésie à vos événements.\n\nServices :\n• Bouquets personnalisés\n• Décoration florale d'événements\n• Ateliers d'art floral\n• Abonnement fleurs fraîches",
    Horaires: "Du Mardi au Samedi : 9h30-19h00\nDimanche : 9h30-12h30",
    Adresse: "7 Rue du Clocher, 69480 Anse",
    coordinates: { lat: 45.9367, lng: 4.7210 },
    email: "amelie@jardinsecret.fr",
    password: "password123",
    facebookUrl: "https://facebook.com",
    instagramUrl: "https://instagram.com",
    offreDuMois: {
        title: "-15% sur les Pivoines",
        description: "Célébrez le printemps avec nos pivoines locales. Offre valable sur tous les bouquets du mois.",
        image: "https://images.unsplash.com/photo-1563241527-3004b7be025f?w=400&h=300&fit=crop"
    },
    reviews: [
        { id: 'r1', author: 'Sophie M.', rating: 5, comment: 'Des compositions magnifiques qui tiennent longtemps !', date: '2023-10-15', isApproved: true },
        { id: 'r2', author: 'Lucas P.', rating: 5, comment: 'Amélie a un vrai don pour les couleurs.', date: '2023-11-02', isApproved: true },
        { id: 'r3', author: 'Claire D.', rating: 4, comment: 'Très belle boutique, prix corrects.', date: '2023-09-20', isApproved: true },
        { id: 'r4', author: 'Marc L.', rating: 5, comment: 'Livraison parfaite pour la fête des mères.', date: '2023-05-28', isApproved: true },
        { id: 'r5', author: 'Julie T.', rating: 5, comment: 'Les ateliers du samedi sont géniaux.', date: '2023-12-10', isApproved: true }
    ],
    isApproved: true,
    seoTitle: "Fleuriste Anse - Le Jardin Secret d'Amélie",
    metaDescription: "Fleuriste artisan à Anse. Bouquets, mariages, ateliers. Livraison 7j/7.",
    referralCode: "AMELIE2024",
    referralCredit: 30,
    paymentFrequency: 'annual',
    subscriptionEndDate: '2024-12-31',
    transactions: [
        { id: 't1', date: '2024-01-01', amount: 450, description: "Abonnement Annuel - Pack Visibilité Définitive", status: 'paid' }
    ],
    managerName: "Amélie Poulain",
    personalPhone: "06 11 22 33 44",
    billingEmail: "compta@jardinsecret.fr"
  },
  {
    id: '2',
    Nom_Entreprise: "Mécano Express 24/7",
    Catégorie_Secteur: [Category.Proximite],
    Localisation: "Villefranche-sur-Saône",
    Statut_Formule: SubscriptionTier.Base,
    Lien_Page_Pro: "https://example.com/mecano-express",
    Téléphone: "04 74 65 43 21",
    Phrase_Accroche: "Votre garagiste de confiance, disponible à toute heure.",
    Logo_Photo: "https://images.unsplash.com/photo-1626084257640-c75c5e884578?w=800&h=450&fit=crop",
    Priorité_Tri: 1,
    Description: "Garage automobile toutes marques installé à Villefranche depuis 15 ans. Nous assurons l'entretien courant, les réparations complexes et le dépannage d'urgence.\n\nServices :\n• Révision et Vidange\n• Diagnostic électronique\n• Pneumatiques\n• Dépannage 24/7",
    Horaires: "Lundi-Vendredi : 8h00-18h00\nSamedi : 8h00-12h00",
    Adresse: "15 Zone Industrielle Nord, 69400 Villefranche-sur-Saône",
    coordinates: { lat: 45.9904, lng: 4.7175 },
    email: "contact@mecano-express.fr",
    password: "password123",
    reviews: [
        { id: 'r6', author: 'Pierre G.', rating: 4, comment: 'Efficace et rapide.', date: '2023-08-12', isApproved: true },
        { id: 'r7', author: 'Nathalie B.', rating: 5, comment: 'Ils m’ont dépannée un dimanche, au top !', date: '2023-11-05', isApproved: true },
        { id: 'r8', author: 'Thomas V.', rating: 4, comment: 'Tarifs un peu élevés mais travail sérieux.', date: '2023-10-01', isApproved: true }
    ],
    isApproved: true,
    referralCode: "MECA2024",
    referralCredit: 0,
    paymentFrequency: 'monthly',
    subscriptionEndDate: getFutureDate(20), // Active
    transactions: [
        { id: 't2', date: getPastDate(10), amount: 12, description: "Abonnement Mensuel - Base", status: 'paid' },
        { id: 't3', date: getPastDate(40), amount: 12, description: "Abonnement Mensuel - Base", status: 'paid' }
    ],
    managerName: "Jean Dupont",
    personalPhone: "06 99 88 77 66",
    billingEmail: "jean.dupont@gmail.com"
  },
  {
    id: '3',
    Nom_Entreprise: "Boulangerie L'Épi Doré",
    Catégorie_Secteur: [Category.Gastronomie, Category.Shopping],
    Localisation: "Limas",
    Statut_Formule: SubscriptionTier.VisibilitePlus,
    Lien_Page_Pro: "https://example.com/epi-dore",
    Téléphone: "04 74 98 76 54",
    Phrase_Accroche: "Le goût du pain d'antan, pétri avec amour.",
    Logo_Photo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=450&fit=crop",
    Priorité_Tri: 2,
    Description: "Boulangerie artisanale privilégiant les farines locales et le levain naturel. Venez découvrir notre gamme de pains spéciaux, nos viennoiseries pur beurre et nos pâtisseries fines.\n\nServices :\n• Pains au levain\n• Pâtisserie fine\n• Snacking déjeuner\n• Commandes traiteur",
    Horaires: "Mardi-Dimanche : 6h30-19h30",
    Adresse: "4 Place de la République, 69400 Limas",
    coordinates: { lat: 45.9750, lng: 4.7110 },
    email: "commande@epidore.fr",
    password: "password123",
    instagramUrl: "https://instagram.com",
    reviews: [
        { id: 'r9', author: 'Isabelle R.', rating: 5, comment: 'La meilleure baguette tradition du coin !', date: '2023-12-15', isApproved: true },
        { id: 'r10', author: 'Karim S.', rating: 4, comment: 'Les éclairs au chocolat sont une tuerie.', date: '2023-11-20', isApproved: true },
        { id: 'r11', author: 'Valérie M.', rating: 5, comment: 'Toujours le sourire, ça fait plaisir.', date: '2023-10-30', isApproved: true },
        { id: 'r12', author: 'Jean-Luc F.', rating: 4, comment: 'Victime de son succès, il y a souvent la queue !', date: '2023-09-05', isApproved: true }
    ],
    isApproved: true,
    referralCode: "PAIN2024",
    referralCredit: 10,
    paymentFrequency: 'annual',
    subscriptionEndDate: '2024-11-15',
    transactions: [
        { id: 't4', date: '2023-11-15', amount: 299, description: "Abonnement Annuel - Visibilité Plus", status: 'paid' }
    ],
    managerName: "Marie Blachère",
    personalPhone: "07 65 43 21 09",
    billingEmail: "compta@epidore.fr"
  },
  {
    id: '4',
    Nom_Entreprise: "Au Bon Vivant",
    Catégorie_Secteur: [Category.Gastronomie, Category.Loisirs],
    Localisation: "Belleville-en-Beaujolais",
    Statut_Formule: SubscriptionTier.VisibiliteDefinitive,
    Lien_Page_Pro: "https://example.com/au-bon-vivant",
    Téléphone: "04 74 11 22 33",
    Phrase_Accroche: "Cuisine généreuse et vins du terroir.",
    Logo_Photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=450&fit=crop",
    Priorité_Tri: 3,
    Description: "Véritable institution à Belleville, Au Bon Vivant vous accueille dans un cadre chaleureux pour déguster une cuisine de saison. Notre chef sublime les produits locaux, accompagné d'une carte des vins célébrant le Beaujolais.\n\nServices :\n• Menu du jour\n• Repas de groupe\n• Terrasse ombragée\n• Cave à vins",
    Horaires: "Lundi-Samedi : 12h00-14h30, 19h00-22h30",
    Adresse: "12 Rue de la Poste, 69220 Belleville-en-Beaujolais",
    coordinates: { lat: 46.1089, lng: 4.7479 },
    email: "resa@aubonvivant.fr",
    password: "password123",
    facebookUrl: "https://facebook.com",
    offreDuMois: {
        title: "Apéritif Offert",
        description: "Un Kir Royal offert pour toute réservation via la Plateforme Pro ce mois-ci.",
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop"
    },
    reviews: [
        { id: 'r13', author: 'Bernard C.', rating: 5, comment: 'Un sans faute. La côte de bœuf est incroyable.', date: '2023-12-01', isApproved: true },
        { id: 'r14', author: 'Sylvie A.', rating: 5, comment: 'Cadre magnifique et personnel aux petits soins.', date: '2023-11-15', isApproved: true },
        { id: 'r15', author: 'David K.', rating: 5, comment: 'Excellent rapport qualité-prix.', date: '2023-10-10', isApproved: true },
        { id: 'r16', author: 'Elodie P.', rating: 4, comment: 'Un peu bruyant le samedi soir, mais on y mange si bien !', date: '2023-09-25', isApproved: true }
    ],
    isApproved: true,
    seoTitle: "Restaurant Belleville - Au Bon Vivant",
    metaDescription: "Cuisine traditionnelle et vins du Beaujolais à Belleville. Réservez votre table.",
    referralCode: "VIVANT2024",
    referralCredit: 50,
    paymentFrequency: 'annual',
    subscriptionEndDate: '2025-01-01',
    transactions: [
        { id: 't5', date: '2024-01-01', amount: 450, description: "Abonnement Annuel - Visibilité Définitive", status: 'paid' }
    ],
    managerName: "Paul Bocuse Jr",
    personalPhone: "06 00 00 00 01",
    billingEmail: "direction@aubonvivant.fr"
  },
  {
    id: '5',
    Nom_Entreprise: "Zen & Belle",
    Catégorie_Secteur: [Category.Sante],
    Localisation: "Tassin-la-Demi-Lune",
    Statut_Formule: SubscriptionTier.VisibilitePlus,
    Lien_Page_Pro: "https://example.com/zen-et-belle",
    Téléphone: "04 78 55 66 77",
    Phrase_Accroche: "Votre parenthèse bien-être au quotidien.",
    Logo_Photo: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&h=450&fit=crop",
    Priorité_Tri: 2,
    Description: "Institut de beauté et spa urbain. Échappez au stress quotidien grâce à nos massages relaxants, soins du visage bio et rituels bien-être. Une équipe d'expertes à votre écoute.\n\nServices :\n• Massages du monde\n• Soins visage Bio\n• Épilations\n• Manucure",
    Horaires: "Mardi-Samedi : 10h00-19h00\nNocturne Jeudi jusqu'à 21h",
    Adresse: "55 Avenue de la République, 69160 Tassin-la-Demi-Lune",
    coordinates: { lat: 45.7634, lng: 4.7613 },
    email: "contact@zenetbelle.fr",
    password: "password123",
    instagramUrl: "https://instagram.com",
    reviews: [
        { id: 'r17', author: 'Camille R.', rating: 5, comment: 'Un moment hors du temps, merci à Léa pour le massage.', date: '2023-12-20', isApproved: true },
        { id: 'r18', author: 'Stéphanie D.', rating: 4, comment: 'Très propre et relaxant.', date: '2023-11-08', isApproved: true },
        { id: 'r19', author: 'Chloé M.', rating: 5, comment: 'Je suis cliente depuis 3 ans, jamais déçue.', date: '2023-10-05', isApproved: true }
    ],
    isApproved: true, // Should be Auto-Masked by logic due to late payment
    referralCode: "ZEN2024",
    referralCredit: 20,
    paymentFrequency: 'monthly',
    subscriptionEndDate: getPastDate(3), // ALERT: Expired 3 days ago
    paymentStatus: 'late',
    transactions: [
        { id: 't6', date: getPastDate(33), amount: 30, description: "Abonnement Mensuel - Visibilité Plus", status: 'paid' },
        { id: 't7', date: getPastDate(3), amount: 30, description: "Abonnement Mensuel - Visibilité Plus", status: 'failed' } // Failed transaction
    ],
    managerName: "Léa Passion",
    personalPhone: "06 55 44 33 22",
    billingEmail: "lea@zenetbelle.fr"
  },
  {
    id: '6',
    Nom_Entreprise: "Immo-Experts Beaujolais",
    Catégorie_Secteur: [Category.Maison, Category.Proximite],
    Localisation: "Anse",
    Statut_Formule: SubscriptionTier.VisibiliteDefinitive,
    Lien_Page_Pro: "https://example.com/immo-experts",
    Téléphone: "04 74 88 99 00",
    Phrase_Accroche: "L'immobilier en toute transparence.",
    Logo_Photo: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop",
    Priorité_Tri: 3,
    Description: "Agence immobilière indépendante spécialisée sur le secteur des Pierres Dorées. Achat, vente, location ou gestion locative, nous vous accompagnons avec expertise et bienveillance.\n\nServices :\n• Estimation offerte\n• Transaction immobilière\n• Gestion locative\n• Viager",
    Horaires: "Lundi-Samedi : 9h00-12h00, 14h00-18h00",
    Adresse: "2 Place de la Mairie, 69480 Anse",
    coordinates: { lat: 45.9367, lng: 4.7210 },
    email: "contact@immo-experts.fr",
    password: "password123",
    facebookUrl: "https://facebook.com",
    reviews: [
        { id: 'r20', author: 'M. et Mme Dupont', rating: 5, comment: 'Maison vendue en 2 semaines au prix estimé !', date: '2023-09-10', isApproved: true },
        { id: 'r21', author: 'Aurélien F.', rating: 4, comment: 'Très bons conseils pour mon premier investissement.', date: '2023-08-22', isApproved: true },
        { id: 'r22', author: 'Lucie H.', rating: 5, comment: 'Équipe dynamique et réactive.', date: '2023-07-15', isApproved: true }
    ],
    isApproved: true,
    seoTitle: "Agence Immobilière Anse - Immo-Experts",
    metaDescription: "Agence immobilière à Anse. Spécialiste Pierres Dorées. Vente, achat, location.",
    referralCode: "IMMOEXPERT",
    referralCredit: 100,
    paymentFrequency: 'annual',
    subscriptionEndDate: '2024-09-30',
    transactions: [],
    managerName: "Stéphane Plaza",
    personalPhone: "06 12 12 12 12",
    billingEmail: "stephane@immo.fr"
  },
  {
    id: '7',
    Nom_Entreprise: "Tech-Assist",
    Catégorie_Secteur: [Category.Proximite, Category.Maison],
    Localisation: "Lyon",
    Statut_Formule: SubscriptionTier.Base,
    Lien_Page_Pro: "https://example.com/tech-assist",
    Téléphone: "06 12 34 56 78",
    Phrase_Accroche: "Dépannage informatique à domicile.",
    Logo_Photo: "https://images.unsplash.com/photo-1597872250969-955681985396?w=800&h=450&fit=crop",
    Priorité_Tri: 1,
    Description: "Intervention rapide pour tous vos problèmes informatiques sur Lyon et alentours. PC, Mac, smartphones. Configuration réseau, récupération de données et formation.\n\nServices :\n• Dépannage PC/Mac\n• Récupération de données\n• Installation Box & Réseau\n• Cours d'informatique",
    Horaires: "Lundi-Samedi : 8h00-20h00",
    Adresse: "Intervention à Domicile - Lyon et Nord",
    coordinates: { lat: 45.7640, lng: 4.8357 },
    email: "support@tech-assist.fr",
    password: "password123",
    reviews: [
        { id: 'r23', author: 'Gérard L.', rating: 4, comment: 'A sauvé toutes mes photos de vacances !', date: '2023-11-12', isApproved: true },
        { id: 'r24', author: 'Monique P.', rating: 4, comment: 'Très pédagogue, je recommande.', date: '2023-10-05', isApproved: true }
    ],
    isApproved: true,
    referralCode: "TECH24",
    referralCredit: 0,
    paymentFrequency: 'annual',
    subscriptionEndDate: getFutureDate(10), // ALERT: Expires in 10 days
    transactions: [
        { id: 't8', date: getPastDate(355), amount: 120, description: "Abonnement Annuel - Base", status: 'paid' }
    ],
    managerName: "Bill Gates",
    personalPhone: "06 01 01 01 01",
    billingEmail: "bill@microsoft.com"
  },
  {
    id: '8',
    Nom_Entreprise: "La Cave des Pierres Dorées",
    Catégorie_Secteur: [Category.Gastronomie, Category.Shopping],
    Localisation: "Trévoux",
    Statut_Formule: SubscriptionTier.VisibilitePlus,
    Lien_Page_Pro: "https://example.com/la-cave",
    Téléphone: "04 74 00 11 22",
    Phrase_Accroche: "Vins fins, spiritueux et conseils d'expert.",
    Logo_Photo: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&h=450&fit=crop",
    Priorité_Tri: 2,
    Description: "Caviste indépendant proposant une large sélection de vins de propriétaires, whiskies, rhums et bières artisanales. Dégustations régulières et coffrets cadeaux sur mesure.\n\nServices :\n• Vins & Spiritueux\n• Soirées dégustation\n• Location de tireuse à bière\n• Coffrets cadeaux",
    Horaires: "Mardi-Samedi : 9h30-12h30, 15h00-19h30",
    Adresse: "10 Quai de la Saône, 01600 Trévoux",
    coordinates: { lat: 45.9416, lng: 4.7758 },
    email: "contact@lacavepd.fr",
    password: "password123",
    facebookUrl: "https://facebook.com",
    reviews: [
        { id: 'r25', author: 'Antoine D.', rating: 5, comment: 'Une sélection incroyable de rhums !', date: '2023-12-05', isApproved: true },
        { id: 'r26', author: 'Béatrice F.', rating: 5, comment: 'Le patron connaît ses produits sur le bout des doigts.', date: '2023-11-18', isApproved: true },
        { id: 'r27', author: 'Sébastien L.', rating: 4, comment: 'Belle boutique.', date: '2023-10-22', isApproved: true }
    ],
    isApproved: true,
    referralCode: "VIN2024",
    referralCredit: 10,
    paymentFrequency: 'annual',
    subscriptionEndDate: '2024-10-20',
    transactions: [],
    managerName: "Bacchus",
    personalPhone: "06 69 69 69 69",
    billingEmail: "vin@cave.fr"
  },
  {
    id: '9',
    Nom_Entreprise: "Rénov'Toit",
    Catégorie_Secteur: [Category.Maison],
    Localisation: "Villefranche-sur-Saône",
    Statut_Formule: SubscriptionTier.VisibiliteDefinitive,
    Lien_Page_Pro: "https://example.com/renov-toit",
    Téléphone: "06 99 88 77 66",
    Phrase_Accroche: "L'expertise couverture et zinguerie en Calade.",
    Logo_Photo: "https://images.unsplash.com/photo-1629131666728-115383921503?w=800&h=450&fit=crop",
    Priorité_Tri: 3,
    Description: "Artisan couvreur-zingueur certifié RGE. Nous réalisons tous vos travaux de toiture : rénovation, étanchéité, pose de velux et isolation des combles. Travail soigné et garantie décennale.\n\nServices :\n• Rénovation de toiture\n• Zinguerie\n• Isolation des combles\n• Pose de Velux",
    Horaires: "Lundi-Vendredi : 7h30-18h00",
    Adresse: "8 Rue de l'Industrie, 69400 Villefranche-sur-Saône",
    coordinates: { lat: 45.9904, lng: 4.7175 },
    email: "devis@renovtoit.fr",
    password: "password123",
    reviews: [
        { id: 'r28', author: 'Famille Martin', rating: 5, comment: 'Chantier laissé propre tous les soirs, très pro.', date: '2023-09-30', isApproved: true },
        { id: 'r29', author: 'Eric Z.', rating: 5, comment: 'Fuite réparée en urgence sous la pluie, merci !', date: '2023-11-10', isApproved: true },
        { id: 'r30', author: 'Paul A.', rating: 5, comment: 'Devis respecté, pas de surprise.', date: '2023-08-05', isApproved: true }
    ],
    isApproved: true,
    seoTitle: "Couvreur Villefranche - Rénov'Toit",
    metaDescription: "Artisan couvreur zingueur à Villefranche. Rénovation toiture, isolation, fuite. Devis gratuit.",
    referralCode: "TOIT69",
    referralCredit: 40,
    paymentFrequency: 'annual',
    subscriptionEndDate: '2025-02-15',
    transactions: [],
    managerName: "Bob le Bricoleur",
    personalPhone: "06 88 88 88 88",
    billingEmail: "bob@renov.fr"
  },
  {
    id: '10',
    Nom_Entreprise: "Les Ciseaux de Marie",
    Catégorie_Secteur: [Category.Sante, Category.Shopping],
    Localisation: "Limas",
    Statut_Formule: SubscriptionTier.Base,
    Lien_Page_Pro: "https://example.com/ciseaux-marie",
    Téléphone: "04 74 22 33 44",
    Phrase_Accroche: "Coiffure mixte et visagiste.",
    Logo_Photo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=450&fit=crop",
    Priorité_Tri: 1,
    Description: "Salon de coiffure convivial pour hommes, femmes et enfants. Marie et son équipe vous conseillent pour trouver la coupe et la couleur qui vous correspondent. Utilisation de produits naturels.\n\nServices :\n• Coupe & Brushing\n• Coloration végétale\n• Barbier\n• Chignons mariée",
    Horaires: "Mardi-Samedi : 9h30-18h00",
    Adresse: "30 Rue du Centre, 69400 Limas",
    coordinates: { lat: 45.9750, lng: 4.7110 },
    email: "rdv@ciseauxmarie.fr",
    password: "password123",
    facebookUrl: "https://facebook.com",
    reviews: [
        { id: 'r31', author: 'Alice V.', rating: 4, comment: 'Très satisfaite de ma couleur.', date: '2023-12-02', isApproved: true },
        { id: 'r32', author: 'Hugo B.', rating: 5, comment: 'Coupe homme nickel, rapide et pas cher.', date: '2023-11-14', isApproved: true }
    ],
    isApproved: true,
    referralCode: "COIF24",
    referralCredit: 0,
    paymentFrequency: 'monthly',
    subscriptionEndDate: '2024-05-30',
    transactions: [],
    managerName: "Marie Curie",
    personalPhone: "06 77 77 77 77",
    billingEmail: "marie@coiffure.fr"
  }
];
// ----------------------------------------------------

const App: React.FC = () => {
  // Initialiser avec un tableau vide, on chargera les données via useEffect
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('directory');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ category: string; location: string }>({
    category: 'all',
    location: 'all',
  });
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [userLocation, setUserLocation] = useState<Coords | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loggedInBusiness, setLoggedInBusiness] = useState<Business | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<SubscriptionTier | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<'monthly' | 'annual'>('annual'); 
  const [contactSubject, setContactSubject] = useState('');

  // Chargement des données Supabase
  useEffect(() => {
      const fetchData = async () => {
          setLoading(true);
          const data = await getAdminBusinesses();
          if (data && data.length > 0) {
              setBusinesses(data);
          } else {
              // Si aucune donnée dans la DB (première install), on utilise le mock pour pas avoir un écran vide
              console.log("DB vide ou erreur : utilisation des données de démonstration");
              setBusinesses(mockBusinesses);
          }
          setLoading(false);
      };
      fetchData();
  }, []);

  const allCategories = useMemo(() => {
    return Object.values(Category).sort((a,b) => a.localeCompare(b));
  }, []);

  const allLocations = useMemo(() => {
    const anseRegionLocations = [
      "Ambérieux-d'Azergues", "Anse", "Bagnols", "Belleville-en-Beaujolais",
      "Bourg-en-Bresse", "Caluire-et-Cuire", "Chasselay", "Chazay-d'Azergues",
      "Civrieux-d'Azergues", "Dardilly", "Dommartin", "Écully", "Genay",
      "Givors", "Jassans-Riottier", "Lachassagne", "Lentilly", "Liergues",
      "Limas", "Limonest", "Lissieu", "Lozanne", "Lucenay", "Lyon",
      "Mâcon", "Marcy", "Morancé", "Neuville-sur-Saône", "Pommiers",
      "Quincieux", "Reyrieux", "Rillieux-la-Pape", "Saint-Bernard",
      "Saint-Étienne", "Sainte-Foy-lès-Lyon", "Tarare", "Tassin-la-Demi-Lune",
      "Theizé", "Trévoux", "Vienne", "Villefranche-sur-Saône", "Villeurbanne",
    ];
    
    const locationsFromData = new Set(businesses.map(b => b.Localisation));
    const combinedLocations = new Set([...anseRegionLocations, ...locationsFromData]);
    
    return Array.from(combinedLocations).sort((a: string, b: string) => a.localeCompare(b));
  }, [businesses]);
  
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
        setLocationError("La géolocalisation n'est pas supportée par votre navigateur.");
        return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
        (position) => {
            setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });
            setSortBy('distance'); 
            setIsLocating(false);
        },
        () => {
            setLocationError("Impossible d'obtenir votre position.");
            setIsLocating(false);
        }
    );
  };

  const filteredAndSortedBusinesses = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filtered = businesses
      .filter(business => {
        if (!business.isApproved) return false;

        const categoryMatch = filters.category === 'all' || business.Catégorie_Secteur.includes(filters.category as Category);
        const locationMatch = filters.location === 'all' || business.Localisation === filters.location;
        const searchMatch = searchTerm === '' || 
                            business.Nom_Entreprise.toLowerCase().includes(lowercasedSearchTerm) ||
                            (business.Phrase_Accroche && business.Phrase_Accroche.toLowerCase().includes(lowercasedSearchTerm)) ||
                            (business.Description && business.Description.toLowerCase().includes(lowercasedSearchTerm));
        return categoryMatch && locationMatch && searchMatch;
      });
      
    const getAverageRating = (business: Business) => {
        if (!business.reviews || business.reviews.length === 0) return 0;
        const approvedReviews = business.reviews.filter(r => r.isApproved);
        if (approvedReviews.length === 0) return 0;
        return approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length;
    };

    return [...filtered].sort((a, b) => {
        switch (sortBy) {
            case 'distance':
                if (!userLocation) return b.Priorité_Tri - a.Priorité_Tri;
                const distA = haversineDistance(userLocation, a.coordinates);
                const distB = haversineDistance(userLocation, b.coordinates);
                return distA - distB;
            case 'rating':
                const ratingA = getAverageRating(a);
                const ratingB = getAverageRating(b);
                if (ratingB !== ratingA) {
                    return ratingB - ratingA;
                }
                return b.Priorité_Tri - a.Priorité_Tri;
            case 'priority':
            default:
                return b.Priorité_Tri - a.Priorité_Tri;
        }
    });

  }, [filters, searchTerm, businesses, sortBy, userLocation]);
  
  const featuredPartners = useMemo(() => {
      return businesses
        .filter(b => b.isApproved && (b.Statut_Formule === SubscriptionTier.VisibiliteDefinitive || b.Statut_Formule === SubscriptionTier.VisibilitePlus))
        .sort((a,b) => b.Priorité_Tri - a.Priorité_Tri)
        .slice(0, 5);
  }, [businesses]);

  const selectedBusiness = useMemo(() => {
    if (!selectedBusinessId) return null;
    return businesses.find(b => b.id === selectedBusinessId) || null;
  }, [selectedBusinessId, businesses]);

  const adminKPIs = useMemo(() => {
    const approvedBusinesses = businesses.filter(b => b.isApproved);
    const pendingBusinesses = businesses.filter(b => !b.isApproved);
    
    let mrr = 0;
    let cashFlow30d = 0;

    const tierDistribution: Record<string, number> = {
        [`${SubscriptionTier.VisibiliteDefinitive} (Annuel)`]: 0,
        [`${SubscriptionTier.VisibiliteDefinitive} (Mensuel)`]: 0,
        [`${SubscriptionTier.VisibilitePlus} (Annuel)`]: 0,
        [`${SubscriptionTier.VisibilitePlus} (Mensuel)`]: 0,
        [`${SubscriptionTier.Base} (Annuel)`]: 0,
        [`${SubscriptionTier.Base} (Mensuel)`]: 0,
    };

    approvedBusinesses.forEach(b => {
        if (b.isFreeTrial || b.Statut_Formule === SubscriptionTier.Lancement) return;
        const frequency = b.paymentFrequency || 'annual';
        const prices = PRICING_CONFIG[b.Statut_Formule];
        if (frequency === 'monthly') {
            mrr += prices.monthly;
            cashFlow30d += prices.monthly;
        } else {
            mrr += (prices.annual / 12);
            cashFlow30d += (prices.annual / 12); 
        }
        const key = `${b.Statut_Formule} (${frequency === 'monthly' ? 'Mensuel' : 'Annuel'})`;
        if (tierDistribution.hasOwnProperty(key)) tierDistribution[key] += 1;
    });

    return {
      mrr,
      arr: mrr * 12,
      cashFlow30d,
      partnerCount: approvedBusinesses.length,
      pendingCount: pendingBusinesses.length,
      tierDistribution,
      pendingBusinesses: pendingBusinesses.sort((a,b) => a.Nom_Entreprise.localeCompare(b.Nom_Entreprise))
    }
  }, [businesses]);
  
  const handleAddNewReview = async (businessId: string, review: Omit<Review, 'id' | 'date' | 'isApproved'>) => {
    // 1. Mise à jour Optimiste UI
    const tempReview: Review = {
        ...review,
        id: `temp-${Date.now()}`,
        date: new Date().toISOString(),
        isApproved: false
    };
    setBusinesses(prev => prev.map(b => b.id === businessId ? {...b, reviews: [...(b.reviews||[]), tempReview]} : b));

    // 2. Appel Supabase
    try {
        await addReview(businessId, review);
        alert("Merci pour votre avis ! Il sera publié après modération.");
    } catch (error) {
        console.error("Erreur ajout avis:", error);
        alert("Erreur lors de l'envoi de l'avis.");
    }
  };

  const handleApproveReview = async (businessId: string, reviewId: string) => {
      // Optimiste
      setBusinesses(prev => prev.map(b => {
          if (b.id !== businessId || !b.reviews) return b;
          return { ...b, reviews: b.reviews.map(r => r.id === reviewId ? { ...r, isApproved: true } : r) };
      }));
      // Supabase
      try {
          await moderateReview(reviewId, true);
      } catch (e) { console.error(e); }
  };

  const handleDeleteReview = async (businessId: string, reviewId: string) => {
      setBusinesses(prev => prev.map(b => {
          if (b.id !== businessId || !b.reviews) return b;
          return { ...b, reviews: b.reviews.filter(r => r.id !== reviewId) };
      }));
       // Note: create a deleteReview function in service if real deletion is needed, currently just hiding via state or moderation
  };
  
  const handleUpdateBusiness = async (updatedBusiness: Business) => {
    // Optimiste
     setBusinesses(prev => {
        const index = prev.findIndex(b => b.id === updatedBusiness.id);
        if (index !== -1) {
            const newBusinesses = [...prev];
            newBusinesses[index] = updatedBusiness;
            return newBusinesses;
        }
        return prev;
    });
    
    // Supabase
    try {
        await upsertBusiness(updatedBusiness);
    } catch (error) {
        console.error("Erreur sauvegarde business:", error);
        alert("Erreur lors de la sauvegarde.");
    }

    if (!isAdminLoggedIn) {
      setLoggedInBusiness(updatedBusiness);
    }
  }

  const handleAddBusinessManual = async (newBusiness: Business) => {
      setBusinesses(prev => [...prev, newBusiness]);
      try {
        await upsertBusiness(newBusiness);
      } catch (e) { console.error(e); }
  };
  
  const handleLogin = (email: string, pass: string): boolean => {
      if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
        setIsAdminLoggedIn(true);
        setCurrentView('adminDashboard');
        return true;
      }
      
      const business = businesses.find(b => b.email === email && b.password === pass);
      if (business) {
          if (!business.isApproved) {
            alert("Votre compte est en attente de validation.");
            return false;
          }
          setLoggedInBusiness(business);
          setCurrentView('professional');
          return true;
      }
      return false;
  }

  const handleLogout = () => {
      setLoggedInBusiness(null);
      setIsAdminLoggedIn(false);
      setCurrentView('directory');
  }

  const handleCreateAccountAfterPayment = async (accountData: AccountCreationData) => {
    if (!selectedFormula) return;
    
    // ... (Logique de calcul dates existante) ...
    const endDate = new Date();
    if (selectedFrequency === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    const newBusiness: Business = {
        id: `temp-${Date.now()}`, // Sera remplacé par UUID Supabase après reload
        Nom_Entreprise: accountData.companyName,
        email: accountData.email,
        password: accountData.password_sub,
        Statut_Formule: selectedFormula,
        Priorité_Tri: 1,
        Catégorie_Secteur: [accountData.category],
        Localisation: accountData.city,
        Lien_Page_Pro: "",
        Téléphone: accountData.publicPhone,
        Phrase_Accroche: "Nouvelle entreprise",
        Logo_Photo: "",
        Description: accountData.description,
        Horaires: "",
        Adresse: `${accountData.city}`,
        coordinates: { lat: 45.9167, lng: 4.7167 }, 
        reviews: [],
        isApproved: false, 
        referralCode: `REF${Date.now()}`,
        referralCredit: 0,
        isFreeTrial: selectedFormula === SubscriptionTier.Lancement,
        paymentFrequency: selectedFrequency,
        subscriptionEndDate: endDate.toISOString().split('T')[0],
        managerName: accountData.managerName,
        personalPhone: accountData.personalPhone,
        billingEmail: accountData.billingEmail,
        transactions: []
    };
    
    // Save to DB
    try {
        await upsertBusiness(newBusiness);
        // Refresh local state or just push
        setBusinesses(prev => [...prev, newBusiness]);
        setLoggedInBusiness(newBusiness);
        alert(`Paiement validé ! Bienvenue chez Plateforme Pro.`);
        setCurrentView('professional');
        window.scrollTo(0, 0);
    } catch(e) {
        console.error(e);
        alert("Erreur création compte DB");
    }
  };

  // ... (Reste des handlers inchangés: handleChooseFormula, handleSelectBusiness, etc.)
  const handleChooseFormula = (formula: SubscriptionTier, frequency: 'monthly' | 'annual' = 'annual') => {
    setSelectedFormula(formula);
    setSelectedFrequency(frequency);
    setCurrentView('payment');
    window.scrollTo(0, 0);
  };
  const handleSelectBusiness = (id: string) => { setSelectedBusinessId(id); setCurrentView('details'); window.scrollTo(0, 0); };
  const handleBackToDirectory = () => { setSelectedBusinessId(null); setSelectedCategory(null); setCurrentView('directory'); };
  const handleSelectCategory = (category: Category) => { setSelectedCategory(category); setCurrentView('category'); window.scrollTo(0, 0); };
  const handleShowProfessionalSpace = () => { setCurrentView('professional'); window.scrollTo(0, 0); };
  const handleShowAdminSpace = () => { setCurrentView('admin'); window.scrollTo(0, 0); };
  const handleShowAdminDashboard = () => { setCurrentView('adminDashboard'); window.scrollTo(0, 0); };
  const handleShowOffers = () => { setCurrentView('offers'); window.scrollTo(0, 0); };
  const handleShowReferralPage = () => { setCurrentView('referral'); window.scrollTo(0, 0); };
  const handleShowAdvertisingOffers = () => { setCurrentView('advertising'); window.scrollTo(0, 0); };
  const handleShowContactPage = (subject: string = '') => { setContactSubject(subject); setCurrentView('contact'); window.scrollTo(0, 0); };
  const handleToggleApproval = async (businessId: string) => {
      const bus = businesses.find(b => b.id === businessId);
      if (bus) {
          const newVal = !bus.isApproved;
          setBusinesses(prev => prev.map(b => b.id === businessId ? { ...b, isApproved: newVal } : b));
          try { await upsertBusiness({...bus, isApproved: newVal}); } catch(e) {}
      }
  };
  const handleDeleteBusiness = (businessId: string) => {
    if (window.confirm("Supprimer définitivement ?")) {
      setBusinesses(prev => prev.filter(b => b.id !== businessId));
      // Call delete service if implemented
    }
  };

  // ... (MobileTabBar & Render Content logic - same as before)
  const MobileTabBar = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 py-2 px-6 flex justify-between items-center z-50 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)]">
        <button onClick={() => setCurrentView('directory')} className={`flex flex-col items-center gap-1 ${currentView === 'directory' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <span className="text-[10px] font-medium">Accueil</span>
        </button>
        <button onClick={() => { const element = document.getElementById('filters-section'); if(element) element.scrollIntoView({ behavior: 'smooth' }); }} className="flex flex-col items-center gap-1 text-gray-400">
            <span className="text-[10px] font-medium">Catégories</span>
        </button>
        <button onClick={handleShowProfessionalSpace} className={`flex flex-col items-center gap-1 ${currentView === 'professional' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <span className="text-[10px] font-medium">Espace Pro</span>
        </button>
    </div>
  );

  const renderContent = () => {
      // (Même switch case qu'avant, copié pour complétude)
      if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-xl text-gray-500">Chargement de l'annuaire...</p></div>;

      switch (currentView) {
        case 'details': return selectedBusiness && <BusinessDetail business={selectedBusiness} onBack={handleBackToDirectory} onAddReview={handleAddNewReview} onSelectCategory={handleSelectCategory} onShowContactPage={handleShowContactPage} />;
        case 'offers': return <Offers onBack={handleBackToDirectory} onChooseFormula={handleChooseFormula} onShowContactPage={handleShowContactPage} />;
        case 'payment': return selectedFormula && <Payment formula={selectedFormula} frequency={selectedFrequency} onBackToOffers={handleShowOffers} onCreateAccount={handleCreateAccountAfterPayment} />
        case 'professional': return <ProfessionalSpace loggedInBusiness={loggedInBusiness} onLogin={handleLogin} onUpdateBusiness={handleUpdateBusiness} onBack={handleBackToDirectory} onShowOffers={handleShowOffers} allCategories={allCategories} allLocations={allLocations} onShowReferralPage={handleShowReferralPage} onChooseFormula={handleChooseFormula} onShowContactPage={handleShowContactPage} />
        case 'referral': return loggedInBusiness && <ReferralPage business={loggedInBusiness} onBack={() => setCurrentView('professional')} />
        case 'adminDashboard': return isAdminLoggedIn && <BusinessDashboard kpis={adminKPIs} onNavigateToManagement={handleShowAdminSpace} />
        case 'admin': return isAdminLoggedIn && <AdminDashboard allBusinesses={businesses} onToggleApproval={handleToggleApproval} onDelete={handleDeleteBusiness} onUpdateBusiness={handleUpdateBusiness} allCategories={allCategories} allLocations={allLocations} onBackToDashboard={handleShowAdminDashboard} onAddBusiness={handleAddBusinessManual} onApproveReview={handleApproveReview} onDeleteReview={handleDeleteReview} />
        case 'category': return selectedCategory && <CategoryPage category={selectedCategory} businesses={businesses.filter(b => b.isApproved && b.Catégorie_Secteur.includes(selectedCategory))} onSelectBusiness={handleSelectBusiness} onBack={handleBackToDirectory} userLocation={userLocation} onSelectCategory={handleSelectCategory} />
        case 'advertising': return <AdvertisingOffers onBack={handleBackToDirectory} onShowContactPage={handleShowContactPage} />;
        case 'contact': return <ContactPage onBack={handleBackToDirectory} initialSubject={contactSubject} />;
        case 'directory':
        default:
          return (
            <>
              <div className="relative pt-12 pb-8 md:pt-20 md:pb-12 text-center px-4 max-w-5xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.15]">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900">
                      L'Excellence Locale, <br/> Sans Compromis.
                  </span>
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-normal leading-relaxed">
                  Le répertoire exclusif des entreprises vérifiées par la communauté du Beaujolais & Lyon Nord.
                </p>
                <div className="mt-10 max-w-2xl mx-auto relative z-10">
                   <div className="relative bg-white rounded-2xl shadow-xl flex items-center p-2">
                       <input type="text" placeholder="Rechercher un architecte à Anse, Belleville..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-4 bg-transparent outline-none text-gray-700 placeholder-gray-400" />
                   </div>
                </div>
              </div>

              <div className="mt-8"><FeaturedPartners partners={featuredPartners} onSelectBusiness={handleSelectBusiness} /></div>

              <div id="filters-section" className="mt-12 md:mt-16">
                   <div className="flex justify-between items-end mb-8"><h2 className="text-2xl font-bold text-gray-900 tracking-tight">Annuaire Officiel</h2></div>
                   <Filters categories={Object.values(Category)} locations={allLocations} currentFilters={filters} onFilterChange={setFilters} sortBy={sortBy} onSortChange={setSortBy} onLocateUser={handleLocateUser} isLocating={isLocating} locationError={locationError} userLocation={userLocation} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <CallToActionCard onClick={handleShowOffers} />
                    {filteredAndSortedBusinesses.map(business => (
                        <BusinessCard key={business.id} business={business} onClick={() => handleSelectBusiness(business.id)} userLocation={userLocation} onSelectCategory={handleSelectCategory} />
                    ))}
                  </div>
              </div>
              
              <div className="mt-24 mb-12 py-12 px-6 bg-gradient-to-r from-indigo-50 to-white rounded-[24px] border border-indigo-100 relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
                   <div><h3 className="text-xl md:text-2xl font-bold text-gray-900">Professionnel du Beaujolais ?</h3><p className="text-gray-600 mt-2 text-lg">Rejoignez 18 500 membres.</p></div>
                   <button onClick={handleShowProfessionalSpace} className="bg-white border border-gray-200 text-indigo-700 font-bold py-3 px-8 rounded-xl hover:bg-indigo-50 transition-all">Partenariat</button>
              </div>
            </>
          );
      }
  }

  return (
    <div className="min-h-screen font-sans bg-[#F9FAFB]">
      <Header onShowProfessionalSpace={handleShowProfessionalSpace} loggedInBusiness={loggedInBusiness} onLogout={handleLogout} onBackToHome={handleBackToDirectory} isAdminLoggedIn={isAdminLoggedIn} onShowAdminSpace={handleShowAdminDashboard} />
      <main className="container mx-auto px-4 md:px-6">{renderContent()}</main>
      <MobileTabBar />
      <footer className="bg-white border-t border-gray-100 mt-20 pb-24 md:pb-12 text-center text-sm text-gray-400">
         <div className="py-8">&copy; {new Date().getFullYear()} La Plateforme Pro.</div>
      </footer>
    </div>
  );
};

export default App;
