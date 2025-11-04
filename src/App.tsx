import React, { useState, useContext, useRef } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import CustomerView from './components/CustomerView';
import AdminView from './components/AdminView';
import AdminLogin from './components/AdminLogin';
import AffiliateLogin from './components/AffiliateLogin';
import AffiliateView from './components/AffiliateView';

const Header: React.FC<{ onTitleClick: () => void, onLogoutClick: () => void, isLoggedIn: boolean, name: string }> = ({ onTitleClick, onLogoutClick, isLoggedIn, name }) => (
  <header className="bg-white text-brand-dark p-4 shadow-md sticky top-0 z-40">
    <div className="container mx-auto flex justify-between items-center">
      <h1 
        className={`text-3xl font-bold font-script text-brand-secondary ${!isLoggedIn ? 'cursor-pointer' : ''}`}
        onClick={!isLoggedIn ? onTitleClick : undefined}
      >
        {name}
      </h1>
      {isLoggedIn && (
         <button onClick={onLogoutClick} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm hover:shadow-md">
            Salir
        </button>
      )}
    </div>
  </header>
);

const AppContent: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const [isAdminLoginVisible, setAdminLoginVisible] = useState(false);
    const [isAffiliateLoginVisible, setAffiliateLoginVisible] = useState(false);
    
    const [titleClickCount, setTitleClickCount] = useState(0);
    const titleClickTimeout = useRef<number | null>(null);

    const handleTitleClick = () => {
        if (titleClickTimeout.current) {
            clearTimeout(titleClickTimeout.current);
        }

        const newCount = titleClickCount + 1;
        setTitleClickCount(newCount);
        
        if (newCount >= 5) {
            setAdminLoginVisible(true);
            setTitleClickCount(0);
        } else {
            titleClickTimeout.current = window.setTimeout(() => {
                setTitleClickCount(0);
            }, 1500); 
        }
    };

    const handleAdminLogout = () => {
        dispatch({ type: 'LOGOUT' });
    };

    const handleAffiliateLogout = () => {
        dispatch({ type: 'AFFILIATE_LOGOUT' });
    };

    if (state.isAuthenticated) {
        return (
            <div key={state.backupLoadCount}>
                <Header onTitleClick={() => {}} onLogoutClick={handleAdminLogout} isLoggedIn={true} name="Panel de Admin" />
                <AdminView />
            </div>
        );
    }

    if (state.currentAffiliate) {
         return (
            <>
                <Header onTitleClick={() => {}} onLogoutClick={handleAffiliateLogout} isLoggedIn={true} name={`Panel de ${state.currentAffiliate.customerName.split(' ')[0]}`} />
                <AffiliateView />
            </>
        );
    }

    return (
        <>
            <Header onTitleClick={handleTitleClick} onLogoutClick={() => {}} isLoggedIn={false} name="La Receta de Mamá" />
            <CustomerView onAffiliateLoginClick={() => setAffiliateLoginVisible(true)} />
            {isAdminLoginVisible && <AdminLogin onClose={() => setAdminLoginVisible(false)} />}
            {isAffiliateLoginVisible && <AffiliateLogin onClose={() => setAffiliateLoginVisible(false)} />}
        </>
    );
};

const App: React.FC = () => {
  return (
    <AppProvider>
        <div className="min-h-screen bg-slate-100 font-sans">
            <AppContent />
        </div>
    </AppProvider>
  );
};

export default App;