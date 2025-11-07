import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

interface AdminLoginProps {
  onClose: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onClose }) => {
  const { state, dispatch } = useContext(AppContext);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === state.adminPassword) {
      dispatch({ type: 'LOGIN', payload: password });
      // No need to do anything else, the component will unmount on successful login
    } else {
      setError('Contraseña incorrecta.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brand-dark">Acceso de Administrador</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Contraseña
            </label>
            <input
              id="password"
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
          <div className="flex items-center justify-end mt-6">
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

export default AdminLogin;