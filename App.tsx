import React, { useState, useMemo, useEffect } from 'react';
import { Business, Category, SubscriptionTier, Review, SortBy, Coords, AccountCreationData, View } from './types';
import { mockBusinesses } from './data/mockData'; // Fallback only
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