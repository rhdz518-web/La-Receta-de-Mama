import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Affiliate, AffiliateStatus } from '../types';

interface AffiliateApplicationModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const AffiliateApplicationModal: React.FC<AffiliateApplicationModalProps> = ({ isVisible, onClose }) => {
  const { state, dispatch } = useContext(AppContext);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isVisible) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio.';
    if (!/^\d{10}$/.test(phone.trim())) newErrors.phone = 'Introduce un teléfono válido de 10 dígitos.';
    if (!address.trim()) newErrors.address = 'La dirección es obligatoria.';
    if (password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    if (state.affiliates.some(a => a.phone === phone.trim())) newErrors.phone = 'Este número de teléfono ya está registrado.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const defaultSchedule = {
        monday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
        tuesday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
        wednesday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
        thursday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
        friday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
        saturday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' },
    };

    const newAffiliate: Affiliate = {
      id: phone.trim(),
      customerName: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      password: password,
      status: AffiliateStatus.Pending,
      inventory: 0,
      hasDeliveryService: false,
      deliveryCost: 0,
      schedule: defaultSchedule,
      isTemporarilyClosed: false,
    };
    
    dispatch({ type: 'APPLY_FOR_AFFILIATE', payload: newAffiliate });
    setIsSubmitted(true);
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setAddress('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setIsSubmitted(false);
    onClose();
  };
  
  const inputClasses = "shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-brand-accent bg-gray-50";
  const errorClasses = "text-red-500 text-xs italic mt-2";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-2xl font-bold text-brand-dark">Programa de Vendedores</h2>
                <p className="text-gray-500 text-sm mt-1">Gana comisiones por cada venta.</p>
            </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 -mt-2 -mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {isSubmitted ? (
            <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-xl font-bold text-brand-dark">¡Solicitud Enviada!</h3>
                <p className="mt-2 text-gray-600">
                    Tu solicitud ha sido enviada. El administrador la revisará y te notificará pronto.
                </p>
                <button onClick={handleClose} className="mt-6 bg-brand-secondary hover:bg-brand-dark text-white font-bold py-2 px-6 rounded-lg">
                    Entendido
                </button>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="affiliate-name">Nombre Completo</label>
                    <input id="affiliate-name" type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                    {errors.name && <p className={errorClasses}>{errors.name}</p>}
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="affiliate-phone">Teléfono (10 dígitos)</label>
                    <input id="affiliate-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className={inputClasses} required />
                     {errors.phone && <p className={errorClasses}>{errors.phone}</p>}
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="affiliate-address">Dirección</label>
                    <textarea id="affiliate-address" value={address} onChange={e => setAddress(e.target.value)} rows={2} className={inputClasses} required />
                    {errors.address && <p className={errorClasses}>{errors.address}</p>}
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="affiliate-password">Crea una Contraseña</label>
                    <input id="affiliate-password" type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} required />
                    {errors.password && <p className={errorClasses}>{errors.password}</p>}
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="affiliate-confirm-password">Confirmar Contraseña</label>
                    <input id="affiliate-confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClasses} required />
                    {errors.confirmPassword && <p className={errorClasses}>{errors.confirmPassword}</p>}
                </div>
                <div className="pt-4">
                    <button type="submit" className="w-full bg-brand-secondary hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all shadow-md">
                        Enviar Solicitud
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default AffiliateApplicationModal;