import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { AffiliateStatus } from '../types';

interface AffiliateLoginProps {
  onClose: () => void;
}

const AffiliateLogin: React.FC<AffiliateLoginProps> = ({ onClose }) => {
  const { state, dispatch } = useContext(AppContext);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const affiliate = state.affiliates.find(a => a.phone === phone.trim());

    if (!affiliate) {
        setError('Afiliado no encontrado.');
        return;
    }
    
    if (affiliate.status === AffiliateStatus.Suspended) {
        setError('Tu cuenta está suspendida. Contacta al administrador.');
        return;
    }
    
    if (affiliate.status !== AffiliateStatus.Approved) {
        setError('Tu cuenta no ha sido aprobada.');
        return;
    }


    if (affiliate.password === password) {
      dispatch({ type: 'AFFILIATE_LOGIN', payload: affiliate });
      // The modal will unmount on successful login from App.tsx
    } else {
      setError('Contraseña incorrecta.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brand-dark">Acceso de Afiliado</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="affiliate-login-phone" className="block text-gray-700 text-sm font-bold mb-2">
              Teléfono (10 dígitos)
            </label>
            <input
              id="affiliate-login-phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                setError('');
              }}
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-brand-accent bg-gray-50"
              required
            />
          </div>
          <div>
            <label htmlFor="affiliate-login-password" className="block text-gray-700 text-sm font-bold mb-2">
              Contraseña
            </label>
            <input
              id="affiliate-login-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-brand-accent bg-gray-50"
              required
            />
            {error && <p className="text-red-500 text-xs italic mt-2">{error}</p>}
          </div>
          <div className="flex items-center justify-end pt-4">
            <button
              type="submit"
              className="bg-brand-secondary hover:bg-brand-dark text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors shadow-md"
            >
              Ingresar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AffiliateLogin;