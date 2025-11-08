import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Order, PaymentMethod, OrderStatus, ReferralStatus, User, Referral, AffiliateStatus, Affiliate } from '../types';
import { MIN_ORDER_FOR_REFERRAL, MIN_ORDER_FOR_COUPON, REWARD_TORTILLAS } from '../constants';
import { generateReferralCode } from '../utils';
import ConfirmationModal from './ConfirmationModal';
import AffiliateApplicationModal from './AffiliateApplicationModal';
import CashIcon from './icons/CashIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import GiftIcon from './icons/GiftIcon';
import StoreIcon from './icons/StoreIcon';
import TicketIcon from './icons/TicketIcon';
import XCircleIcon from './icons/XCircleIcon';

interface CustomerViewProps {
  onAffiliateLoginClick: () => void;
}

const isAffiliateOpen = (affiliate: Affiliate | null): boolean => {
    if (!affiliate) return false;
    if (affiliate.isTemporarilyClosed) return false;

    const now = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    
    const schedule = affiliate.schedule[dayOfWeek];
    if (!schedule || !schedule.isOpen) return false;

    const [openHour, openMinute] = schedule.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = schedule.closeTime.split(':').map(Number);

    const openTime = new Date();
    openTime.setHours(openHour, openMinute, 0, 0);

    const closeTime = new Date();
    closeTime.setHours(closeHour, closeMinute, 0, 0);

    return now >= openTime && now <= closeTime;
};

const getNextOpeningTime = (affiliate: Affiliate | null): string => {
    if (!affiliate || !affiliate.schedule) return "No hay horario disponible.";
    
    const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayNames = {
        sunday: 'Domingo',
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
    };
    const now = new Date();
    const todayIndex = now.getDay();

    for (let i = 0; i < 7; i++) {
        const dayIndex = (todayIndex + i) % 7;
        const dayKey = daysOrder[dayIndex] as keyof typeof dayNames;
        const daySchedule = affiliate.schedule[dayKey];

        if (daySchedule && daySchedule.isOpen) {
            const [openHour, openMinute] = daySchedule.openTime.split(':').map(Number);
            
            if (i === 0) {
                const openTime = new Date();
                openTime.setHours(openHour, openMinute, 0, 0);
                if (now < openTime) {
                    return `hoy a las ${daySchedule.openTime}`;
                }
            } else { 
                return `el ${dayNames[dayKey]} a las ${daySchedule.openTime}`;
            }
        }
    }
    return "la tienda está cerrada indefinidamente";
};


const CustomerView: React.FC<CustomerViewProps> = ({ onAffiliateLoginClick }) => {
  const { state, dispatch } = useContext(AppContext);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState<number | string>(10);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [cashPaid, setCashPaid] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  
  const [referralName, setReferralName] = useState('');
  const [referralPhone, setReferralPhone] = useState('');

  const [referralCodeUsed, setReferralCodeUsed] = useState('');
  const [couponUsed, setCouponUsed] = useState('');
  const [selectedAffiliateName, setSelectedAffiliateName] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [pickupAcknowledged, setPickupAcknowledged] = useState(false);
  const [deliveryChoice, setDeliveryChoice] = useState<'delivery' | 'pickup' | null>(null);
  const [affiliateSuggestions, setAffiliateSuggestions] = useState<Affiliate[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [isCurrentAffiliateClosed, setIsCurrentAffiliateClosed] = useState(false);
  const [orderForNextDay, setOrderForNextDay] = useState(false);
  const [nextOpeningMessage, setNextOpeningMessage] = useState('');
  const [isLowInventory, setIsLowInventory] = useState(false);

  const [activeTab, setActiveTab] = useState<'order' | 'referrals' | 'affiliates' | 'coupons'>('order');
  const [isConfirmationVisible, setConfirmationVisible] = useState(false);
  const [isAffiliateAppVisible, setAffiliateAppVisible] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState<Order | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [codeErrors, setCodeErrors] = useState<{ coupon?: string; referral?: string; discount?: number }>({});
  const [orderSuccessMessage, setOrderSuccessMessage] = useState('');
  const [shareError, setShareError] = useState('');

  const [couponPhoneInput, setCouponPhoneInput] = useState('');
  const [currentCouponPhone, setCurrentCouponPhone] = useState<string | null>(null);
  const [couponLookupError, setCouponLookupError] = useState('');
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const subtotal = useMemo(() => (Number(quantity) || 0) * state.tortillaPrice, [quantity, state.tortillaPrice]);
  
  const deliveryFee = useMemo(() => {
    if (selectedAffiliate && selectedAffiliate.hasDeliveryService && deliveryChoice === 'delivery') {
      return selectedAffiliate.deliveryCost;
    }
    return 0;
  }, [selectedAffiliate, deliveryChoice]);

  const generatedReferralCode = useMemo(() => {
    if (referralName.trim() && referralPhone.trim().length === 10) {
      return generateReferralCode(referralName, referralPhone);
    }
    return '';
  }, [referralName, referralPhone]);

  useEffect(() => {
    if (generatedReferralCode) {
        const userPayload: User = {
            customerName: referralName.trim(),
            phone: referralPhone.trim(),
        };
        dispatch({ type: 'ADD_OR_UPDATE_USER', payload: userPayload });
    }
  }, [generatedReferralCode, referralName, referralPhone, dispatch]);
  
  const approvedAffiliates = useMemo(() => 
    state.affiliates.filter(a => a.status === AffiliateStatus.Approved),
    [state.affiliates]
  );

  useEffect(() => {
    if (phone.length === 10) {
      const existingUser = state.users.find(u => u.phone === phone);
      if (existingUser) {
        setCustomerName(existingUser.customerName);
      }
    }
  }, [phone, state.users]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
            setIsSuggestionsVisible(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const visibility = state.tabVisibility;
    if (
        (activeTab === 'referrals' && !visibility.referrals) ||
        (activeTab === 'affiliates' && !visibility.affiliates) ||
        (activeTab === 'coupons' && !visibility.coupons)
    ) {
        setActiveTab('order');
    }
  }, [state.tabVisibility, activeTab]);

  useEffect(() => {
    if (selectedAffiliate && quantity) {
        if (Number(quantity) > selectedAffiliate.inventory) {
            setIsLowInventory(true);
        } else {
            setIsLowInventory(false);
        }
    } else {
        setIsLowInventory(false);
    }
}, [quantity, selectedAffiliate]);


  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  
  const validateForm = (): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};
    const numQuantity = Number(quantity);
    if (!customerName.trim()) errors.customerName = 'El nombre es obligatorio.';
    if (!/^\d{10}$/.test(phone.trim())) errors.phone = 'Introduce un teléfono válido de 10 dígitos.';
    if (deliveryChoice === 'delivery' && !address.trim()) {
        errors.address = 'La dirección es obligatoria.';
    }
    if (!selectedAffiliate) errors.affiliate = 'Debes seleccionar un vendedor.';
    
    if (selectedAffiliate?.hasDeliveryService && !deliveryChoice) {
        errors.deliveryChoice = 'Debes seleccionar un método de entrega.';
    }

    if (selectedAffiliate && !selectedAffiliate.hasDeliveryService && !pickupAcknowledged) {
        errors.pickup = 'Debes aceptar recoger tu pedido para continuar.';
    }
    
    if (isCurrentAffiliateClosed && !orderForNextDay) {
        errors.orderForNextDay = 'Debes aceptar hacer el pedido para el próximo día de apertura.';
    }

    if (numQuantity < 1) errors.quantity = 'Debes pedir al menos 1 tortilla.';
    if (paymentMethod === PaymentMethod.Cash) {
      const finalCost = subtotal + deliveryFee - (codeErrors.discount || 0)
      const cash = parseFloat(cashPaid);
      if (cashPaid && (isNaN(cash) || cash < finalCost)) {
        errors.cashPaid = `Debes pagar con al menos ${formatCurrency(finalCost)}.`;
      }
    }
    return errors;
  };

  const validateCodesAndSubmit = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        const errorFieldsOrder: { [key: string]: string } = {
            customerName: 'customerNameInput',
            phone: 'phoneInput',
            affiliate: 'affiliateInput',
            orderForNextDay: 'orderForNextDayContainer',
            deliveryChoice: 'deliveryChoiceContainer',
            pickup: 'pickupCheckboxContainer',
            address: 'addressInput',
            quantity: 'quantityInputContainer',
            cashPaid: 'cashPaidInput',
        };

        const firstErrorKey = Object.keys(errorFieldsOrder).find(key => validationErrors[key]);
        
        if (firstErrorKey) {
            const elementId = errorFieldsOrder[firstErrorKey];
            const element = document.getElementById(elementId);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    setFormErrors({});

    const errors: { coupon?: string, referral?: string, discount?: number } = {};
    let discountApplied = 0;
    const numQuantity = Number(quantity);
    
    let validCoupon = null;
    if (couponUsed.trim()) {
        validCoupon = state.coupons.find(c => c.code.toLowerCase() === couponUsed.trim().toLowerCase() && !c.isUsed && c.isActive);
        if (!validCoupon) {
            errors.coupon = 'Cupón no válido, ya fue utilizado o está desactivado.';
        } else if (numQuantity < MIN_ORDER_FOR_COUPON) {
            errors.coupon = `El pedido mínimo para usar un cupón es de ${MIN_ORDER_FOR_COUPON} tortillas.`;
        } else {
            discountApplied = validCoupon.rewardAmount;
        }
    }

    if (referralCodeUsed.trim()) {
        if(couponUsed.trim()) {
            errors.referral = 'No puedes usar un código de referido y un cupón en el mismo pedido.';
        } else {
            const referrerUser = state.users.find(u => generateReferralCode(u.customerName, u.phone).toLowerCase() === referralCodeUsed.trim().toLowerCase());
            
            if (!referrerUser) {
                errors.referral = 'Código de referido no válido.';
            } else if (referrerUser.phone === phone.trim()) {
                errors.referral = 'No puedes usar tu propio código de referido.';
            } else if (state.orders.some(o => o.phone === phone.trim() && o.status !== OrderStatus.Cancelled)) {
                errors.referral = 'El código de referido es solo para tu primer pedido.';
            }
        }
    }

    errors.discount = discountApplied;
    setCodeErrors(errors);
    if (Object.keys(errors).length > 1) return;

    const finalAffiliate = selectedAffiliate;
    if (!finalAffiliate) return;

    const newOrder: Order = {
      id: `${Date.now()}-${phone.slice(-4)}`,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      quantity: numQuantity,
      totalCost: subtotal,
      paymentMethod,
      timestamp: Date.now(),
      status: paymentMethod === PaymentMethod.Transfer ? OrderStatus.PendingConfirmation : OrderStatus.Active,
      cashPaid: paymentMethod === PaymentMethod.Cash && cashPaid ? parseFloat(cashPaid) : undefined,
      referralCodeUsed: referralCodeUsed.trim() || undefined,
      couponUsed: validCoupon ? validCoupon.code : undefined,
      discountApplied,
      affiliateId: finalAffiliate.id,
      affiliateName: finalAffiliate.customerName,
      deliveryFeeApplied: deliveryFee,
      deliveryChoice: deliveryChoice ?? undefined,
      paymentReceiptImage: receiptImage ?? undefined,
      isLowInventoryOrder: isLowInventory,
    };
    setOrderToConfirm(newOrder);
    setConfirmationVisible(true);
  };
  
  const handleConfirmOrder = () => {
    if (!orderToConfirm) return;

    const userPayload: User = { customerName: orderToConfirm.customerName, phone: orderToConfirm.phone };
    dispatch({ type: 'ADD_OR_UPDATE_USER', payload: userPayload });
    
    if (orderToConfirm.referralCodeUsed) {
        const referrerUser = state.users.find(u => generateReferralCode(u.customerName, u.phone).toLowerCase() === orderToConfirm.referralCodeUsed!.toLowerCase());
        if (referrerUser) {
            const referralPayload: Referral = {
                id: `${Date.now()}-ref`,
                referrerCode: orderToConfirm.referralCodeUsed,
                referrerName: referrerUser.customerName,
                referrerPhone: referrerUser.phone,
                refereeOrderId: orderToConfirm.id,
                refereeName: orderToConfirm.customerName,
                refereePhone: orderToConfirm.phone,
                refereeOrderQuantity: orderToConfirm.quantity,
                status: ReferralStatus.ActiveOrder,
                timestamp: Date.now(),
            };
            dispatch({ type: 'ADD_REFERRAL', payload: referralPayload });
        }
    }

    dispatch({ type: 'ADD_ORDER', payload: orderToConfirm });
    
    const affiliate = state.affiliates.find(a => a.id === orderToConfirm.affiliateId);
    if (affiliate) {
        const finalCost = orderToConfirm.totalCost + (orderToConfirm.deliveryFeeApplied || 0) - (orderToConfirm.discountApplied || 0);
        const deliveryMessage = orderToConfirm.deliveryChoice === 'pickup'
            ? `*Entrega:* Pasaré a recoger mi pedido.`
            : `*Entrega:* ¡Servicio a Domicilio! 🛵\n*Mi Dirección:* ${orderToConfirm.address}`;
        
        const nextDayPrefix = isCurrentAffiliateClosed ? '*PEDIDO PARA PRÓXIMA APERTURA*\n\n' : '';
        
        let messagePrefix = '';
        if (orderToConfirm.isLowInventoryOrder) {
            messagePrefix = '*❗ ATENCIÓN: INVENTARIO BAJO ❗*\n\n¡Hola! 👋 Te hago un nuevo pedido, aunque veo que tienes poco inventario. Por favor, confírmame si puedes surtirlo.\n\n';
        } else {
            messagePrefix = '¡Hola! 👋 Te hago un nuevo pedido:\n\n';
        }

        const message = `${nextDayPrefix}${messagePrefix}` +
                        `*Mi Nombre:* ${orderToConfirm.customerName}\n` +
                        `*Mi Teléfono:* ${orderToConfirm.phone}\n` +
                        `${deliveryMessage}\n\n` +
                        `---\n` +
                        `*PEDIDO:*\n` +
                        `*Cantidad:* ${orderToConfirm.quantity} tortillas\n` +
                        `*Total a Pagar:* ${formatCurrency(finalCost)}\n` +
                        `*Método de Pago:* ${orderToConfirm.paymentMethod}\n` +
                        `---\n\n` +
                        `¡Quedo al pendiente de la confirmación! Gracias.`;

        const whatsappUrl = `https://wa.me/52${affiliate.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    setCustomerName('');
    setPhone('');
    setAddress('');
    setQuantity(10);
    setPaymentMethod(PaymentMethod.Cash);
    setCashPaid('');
    setReferralCodeUsed('');
    setCouponUsed('');
    setSelectedAffiliateName('');
    setSelectedAffiliate(null);
    setPickupAcknowledged(false);
    setDeliveryChoice(null);
    setOrderToConfirm(null);
    setConfirmationVisible(false);
    setFormErrors({});
    setCodeErrors({});
    setReceiptImage(null);
    setIsCurrentAffiliateClosed(false);
    setOrderForNextDay(false);
    
    const successMsg = paymentMethod === PaymentMethod.Transfer
        ? '¡Pedido enviado! Quedará activo una vez que el administrador confirme la recepción de tu pago. Se abrirá WhatsApp para que notifiques al vendedor.'
        : '¡Pedido enviado! Se abrirá WhatsApp para que notifiques al vendedor.';
    setOrderSuccessMessage(successMsg);
    setTimeout(() => setOrderSuccessMessage(''), 5000);

    viewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleShareReferral = () => {
      setShareError('');
      const appUrl = state.publicAppUrl;
      if (!appUrl || appUrl.trim() === '') {
          setShareError("El administrador necesita configurar la URL pública de la app en Ajustes para poder compartir.");
          setTimeout(() => setShareError(''), 5000);
          return;
      }
      const message = `¡Hola! Te recomiendo las tortillas de "La Receta de Mamá". Si usas mi código *${generatedReferralCode}* en tu primer pedido de 10 tortillas o más, ¡yo gano 10 tortillas gratis! Haz tu pedido aquí: ${appUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
  }
  
  const handleAffiliateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedAffiliateName(value);
    setSelectedAffiliate(null);
    setPickupAcknowledged(false);
    setDeliveryChoice(null);
    setIsCurrentAffiliateClosed(false);
    setOrderForNextDay(false);
    setNextOpeningMessage('');

    if (value.trim()) {
        const filtered = approvedAffiliates.filter(aff => 
            aff.customerName.toLowerCase().includes(value.toLowerCase())
        );
        setAffiliateSuggestions(filtered);
        setIsSuggestionsVisible(filtered.length > 0);
    } else {
        setAffiliateSuggestions([]);
        setIsSuggestionsVisible(false);
    }
  };

  const handleSuggestionClick = (affiliate: Affiliate) => {
    setSelectedAffiliateName(affiliate.customerName);
    setSelectedAffiliate(affiliate);
    setAffiliateSuggestions([]);
    setIsSuggestionsVisible(false);
    setPickupAcknowledged(false);
    setDeliveryChoice(null);
    
    const isOpen = isAffiliateOpen(affiliate);
    setIsCurrentAffiliateClosed(!isOpen);

    if (!isOpen) {
        setNextOpeningMessage(`Próxima apertura: ${getNextOpeningTime(affiliate)}.`);
    } else {
        setNextOpeningMessage('');
    }

    setOrderForNextDay(false);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setReceiptImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleShowCoupons = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(couponPhoneInput.trim())) {
        setCouponLookupError('Introduce un teléfono válido de 10 dígitos.');
        return;
    }
    setCouponLookupError('');
    setCurrentCouponPhone(couponPhoneInput.trim());
  };

  const activeUserCoupons = useMemo(() => {
    if (!currentCouponPhone) return [];
    return state.coupons.filter(
        c => c.generatedForPhone === currentCouponPhone && c.isActive && !c.isUsed
    );
  }, [currentCouponPhone, state.coupons]);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
        setCopiedCoupon(code);
        setTimeout(() => setCopiedCoupon(null), 2000);
    });
  };

  const inputClasses = "shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 bg-gray-50";
  const errorClasses = "text-red-500 text-xs italic mt-1";

  const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    icon: React.ReactNode;
  }> = ({ isActive, onClick, children, icon }) => (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-1 py-3 font-semibold text-center border-b-4 transition-all duration-300 ${
        isActive
          ? 'border-brand-secondary text-brand-dark'
          : 'border-transparent text-gray-500 hover:text-brand-dark'
      }`}
      role="tab"
      aria-selected={isActive}
    >
      {icon}
      <span>{children}</span>
    </button>
  );

  return (
    <div ref={viewRef} className="container mx-auto p-4 sm:p-6 md:p-8 max-w-3xl">
      {orderSuccessMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg shadow-md" role="alert">
          <p className="font-bold">¡Éxito!</p>
          <p>{orderSuccessMessage}</p>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b bg-gray-50/50" role="tablist">
          <TabButton
            isActive={activeTab === 'order'}
            onClick={() => setActiveTab('order')}
            icon={<CashIcon className="w-6 h-6" />}
          >
            Hacer Pedido
          </TabButton>
          {state.tabVisibility.referrals && (
            <TabButton
                isActive={activeTab === 'referrals'}
                onClick={() => setActiveTab('referrals')}
                icon={<GiftIcon className="w-6 h-6" />}
            >
                Gana Gratis
            </TabButton>
          )}
          {state.tabVisibility.affiliates && (
            <TabButton
                isActive={activeTab === 'affiliates'}
                onClick={() => setActiveTab('affiliates')}
                icon={<StoreIcon className="w-6 h-6" />}
            >
                Gana Dinero
            </TabButton>
          )}
          {state.tabVisibility.coupons && (
            <TabButton
                isActive={activeTab === 'coupons'}
                onClick={() => setActiveTab('coupons')}
                icon={<TicketIcon className="w-6 h-6" />}
            >
                Mis Cupones
            </TabButton>
          )}
        </div>
        
        <div className="p-6 md:p-8">
          {activeTab === 'order' && (
            <div className="animate-fade-in">
              <section>
                <h2 className="text-3xl font-bold text-brand-dark mb-6">Detalles del Pedido</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
                    <input id="customerNameInput" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className={`${inputClasses} ${formErrors.customerName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-accent'}`} />
                    {formErrors.customerName && <p className={errorClasses}>{formErrors.customerName}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Teléfono (10 dígitos)</label>
                    <input id="phoneInput" type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className={`${inputClasses} ${formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-accent'}`} />
                    {formErrors.phone && <p className={errorClasses}>{formErrors.phone}</p>}
                  </div>
                </div>
                
                <div className="mt-6 relative" ref={suggestionsRef}>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Selecciona un Vendedor</label>
                    <input 
                      id="affiliateInput"
                      type="text" 
                      value={selectedAffiliateName} 
                      onChange={handleAffiliateInputChange}
                      onFocus={handleAffiliateInputChange}
                      className={`${inputClasses} ${formErrors.affiliate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-accent'}`}
                      placeholder="Escribe para buscar tu punto de venta..." 
                      autoComplete="off"
                    />
                    {isSuggestionsVisible && affiliateSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <ul className="py-1">
                                {affiliateSuggestions.map((aff) => (
                                    <li 
                                        key={aff.id}
                                        onClick={() => handleSuggestionClick(aff)}
                                        className="px-4 py-2 text-gray-800 cursor-pointer hover:bg-brand-light"
                                    >
                                        {aff.customerName}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {formErrors.affiliate && <p className={errorClasses}>{formErrors.affiliate}</p>}
                </div>
                
                {selectedAffiliate && (
                    <div className={`mt-2 p-3 text-center rounded-lg text-sm font-bold ${isCurrentAffiliateClosed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {isCurrentAffiliateClosed ? 'Cerrado en este momento' : 'Abierto ahora'}
                    </div>
                )}

                {isCurrentAffiliateClosed && (
                    <div id="orderForNextDayContainer" className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200 animate-fade-in">
                        <p className="font-semibold text-yellow-800">La tienda está cerrada. {nextOpeningMessage}</p>
                        <label className="flex items-start gap-3 mt-2 text-sm text-gray-700 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={orderForNextDay} 
                                onChange={e => setOrderForNextDay(e.target.checked)} 
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-secondary focus:ring-brand-accent"
                            />
                            <span>Entiendo y acepto hacer mi pedido para el <strong className="font-semibold">próximo día de apertura.</strong></span>
                        </label>
                        {formErrors.orderForNextDay && <p className={errorClasses}>{formErrors.orderForNextDay}</p>}
                    </div>
                )}


                 {selectedAffiliate && (
                    <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 animate-fade-in">
                        {selectedAffiliate.hasDeliveryService ? (
                            <div id="deliveryChoiceContainer">
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Elige tu método de entrega:</h3>
                                <div className="space-y-3">
                                    <label className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${deliveryChoice === 'delivery' ? 'border-brand-secondary bg-brand-light/50' : 'border-gray-200 bg-white'} ${formErrors.deliveryChoice ? 'border-red-500' : ''}`}>
                                        <input type="radio" name="deliveryChoice" value="delivery" checked={deliveryChoice === 'delivery'} onChange={() => setDeliveryChoice('delivery')} className="hidden"/>
                                        <div className="flex-1">
                                            <p className="font-bold text-brand-dark">Entrega a Domicilio</p>
                                            <p className="text-sm text-gray-600 mt-1">Recibe tu pedido en la puerta de tu casa.</p>
                                        </div>
                                        <span className={`font-bold text-brand-dark ${selectedAffiliate.deliveryCost > 0 ? 'text-brand-secondary' : 'text-green-600'}`}>
                                            {selectedAffiliate.deliveryCost > 0 ? `+ ${formatCurrency(selectedAffiliate.deliveryCost)}` : 'Gratis'}
                                        </span>
                                    </label>
                                     <label className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${deliveryChoice === 'pickup' ? 'border-brand-secondary bg-brand-light/50' : 'border-gray-200 bg-white'}`}>
                                        <input type="radio" name="deliveryChoice" value="pickup" checked={deliveryChoice === 'pickup'} onChange={() => setDeliveryChoice('pickup')} className="hidden"/>
                                        <div className="flex-1">
                                            <p className="font-bold text-brand-dark">Recoger en Tienda</p>
                                            <p className="text-sm text-gray-600 mt-1">Dirección: <strong className="font-semibold">{selectedAffiliate.address}</strong></p>
                                        </div>
                                    </label>
                                </div>
                                {formErrors.deliveryChoice && <p className={`mt-2 ${errorClasses}`}>{formErrors.deliveryChoice}</p>}
                            </div>
                        ) : (
                            <div id="pickupCheckboxContainer">
                                <p className="text-sm text-amber-800 font-semibold">
                                    ⚠️ Este vendedor NO ofrece servicio a domicilio.
                                </p>
                                <div className="mt-3">
                                    <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={pickupAcknowledged}
                                            onChange={(e) => setPickupAcknowledged(e.target.checked)}
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-secondary focus:ring-brand-accent"
                                        />
                                        <span>
                                            Entiendo y acepto que debo recoger mi pedido en la dirección del vendedor: <strong className="font-semibold">{selectedAffiliate.address}</strong>
                                        </span>
                                    </label>
                                    {formErrors.pickup && <p className={errorClasses}>{formErrors.pickup}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {deliveryChoice === 'delivery' && (
                    <div className="mt-6 animate-fade-in">
                      <label className="block text-gray-700 text-sm font-bold mb-2">Dirección de Entrega</label>
                      <textarea id="addressInput" value={address} onChange={e => setAddress(e.target.value)} rows={2} className={`${inputClasses} ${formErrors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-accent'}`}></textarea>
                      {formErrors.address && <p className={errorClasses}>{formErrors.address}</p>}
                    </div>
                )}


                <div className="mt-6" id="quantityInputContainer">
                  <label className="block text-gray-700 text-sm font-bold mb-2 text-center">Cantidad de Tortillas</label>
                  <div className="flex justify-center items-center mt-2">
                      <div className={`relative flex items-center max-w-[12rem] bg-white border rounded-lg ${formErrors.quantity ? 'border-red-500' : 'border-gray-300'}`}>
                          <button 
                              type="button" 
                              onClick={() => setQuantity(q => Math.max(1, (Number(q) || 0) - 1))}
                              className="p-3 text-gray-900 hover:bg-gray-100 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                              aria-label="Disminuir cantidad"
                          >
                              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16"/>
                              </svg>
                          </button>
                          <input 
                              type="text" 
                              inputMode="numeric"
                              value={quantity} 
                              onChange={e => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setQuantity(val);
                              }}
                              onBlur={e => {
                                  const num = parseInt(e.target.value, 10);
                                  if (isNaN(num) || num < 1) {
                                      setQuantity(1);
                                  } else {
                                      setQuantity(num);
                                  }
                              }}
                              className="w-20 text-center font-bold text-brand-dark text-2xl border-x border-gray-300 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-inset"
                              required 
                          />
                          <button 
                              type="button" 
                              onClick={() => setQuantity(q => (Number(q) || 0) + 1)}
                              className="p-3 text-gray-900 hover:bg-gray-100 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                              aria-label="Aumentar cantidad"
                          >
                              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16"/>
                              </svg>
                          </button>
                      </div>
                  </div>
                  {formErrors.quantity && <p className={`text-center ${errorClasses}`}>{formErrors.quantity}</p>}
                </div>
                {isLowInventory && (
                    <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 rounded-md text-sm space-y-1">
                        <p className="font-bold">¡Atención: Inventario Bajo!</p>
                        <p>El vendedor tiene menos tortillas de las que has solicitado.</p>
                        <p>Al confirmar tu pedido, se generará un mensaje de WhatsApp para que puedas enviárselo y confirmar si puede surtir tu orden completa.</p>
                    </div>
                )}
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-xl font-semibold text-brand-dark mb-4">Método de Pago</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === PaymentMethod.Cash ? 'border-brand-secondary bg-brand-light/50' : 'border-gray-300 bg-white'}`}>
                          <input type="radio" name="paymentMethod" value={PaymentMethod.Cash} checked={paymentMethod === PaymentMethod.Cash} onChange={() => setPaymentMethod(PaymentMethod.Cash)} className="hidden"/>
                          <CashIcon className="w-8 h-8 mr-4 text-brand-secondary" />
                          <span className="font-bold text-lg text-brand-dark">{PaymentMethod.Cash}</span>
                      </label>
                      <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === PaymentMethod.Transfer ? 'border-brand-secondary bg-brand-light/50' : 'border-gray-300 bg-white'}`}>
                          <input type="radio" name="paymentMethod" value={PaymentMethod.Transfer} checked={paymentMethod === PaymentMethod.Transfer} onChange={() => setPaymentMethod(PaymentMethod.Transfer)} className="hidden"/>
                          <CreditCardIcon className="w-8 h-8 mr-4 text-brand-secondary" />
                          <span className="font-bold text-lg text-brand-dark">{PaymentMethod.Transfer}</span>
                      </label>
                  </div>
                   <p className="text-xs text-gray-500 mt-2">Si pagas con transferencia, el dinero va directo al administrador. Si pagas en efectivo, el vendedor recibirá el dinero.</p>
                  {paymentMethod === PaymentMethod.Transfer && (
                      <div className="mt-4 bg-gray-100 p-4 rounded-lg">
                          <p className="font-semibold text-gray-800">Datos para la transferencia:</p>
                          <pre className="text-sm text-gray-600 whitespace-pre-wrap">{state.bankDetails}</pre>
                          <p className="text-sm font-bold text-brand-secondary mt-3">
                              Importante: Tu pedido se activará una vez que el administrador confirme tu pago. Asegúrate de adjuntar el comprobante.
                          </p>
                          <div className="mt-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Adjuntar Comprobante de Pago
                            </label>
                            <div className="mt-2">
                                <label 
                                    htmlFor="receipt-upload" 
                                    className={`relative flex justify-center items-center w-full h-48 rounded-lg border-2 border-dashed cursor-pointer transition-colors 
                                    ${receiptImage ? 'border-gray-300' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    {receiptImage ? (
                                        <>
                                            <img src={receiptImage} alt="Vista previa del comprobante" className="object-contain max-h-full max-w-full rounded-lg" />
                                            <button
                                                type="button"
                                                onClick={(e) => { 
                                                    e.preventDefault(); 
                                                    setReceiptImage(null);
                                                }}
                                                className="absolute top-1 right-1 bg-white rounded-full p-0.5 text-red-500 hover:text-red-700 shadow"
                                                aria-label="Quitar imagen"
                                            >
                                                <XCircleIcon className="w-6 h-6" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center text-gray-500">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <p className="mt-2 text-sm">
                                                <span className="font-semibold">Haz clic para subir</span>
                                            </p>
                                            <p className="text-xs">PNG, JPG, etc.</p>
                                        </div>
                                    )}
                                    <input id="receipt-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                        </div>
                      </div>
                  )}
                  {paymentMethod === PaymentMethod.Cash && (
                      <div className="mt-4">
                          <label className="block text-gray-700 text-sm font-bold mb-2">¿Con cuánto pagas? (Opcional)</label>
                          <input id="cashPaidInput" type="number" value={cashPaid} onChange={e => setCashPaid(e.target.value)} placeholder={`Ej: ${subtotal + deliveryFee + 50}`} className={`${inputClasses} ${formErrors.cashPaid ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-brand-accent'}`} />
                          {formErrors.cashPaid && <p className={errorClasses}>{formErrors.cashPaid}</p>}
                      </div>
                  )}
                </div>
              </section>
              <section className="border-t pt-8">
                  <h3 className="text-xl font-semibold text-brand-dark mb-4">Códigos Promocionales</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Código de Cupón (si tienes uno)</label>
                          <input type="text" value={couponUsed} onChange={e => setCouponUsed(e.target.value)} className={inputClasses} placeholder="Ej: REGALO-ABC123" />
                          {codeErrors.coupon && <p className={errorClasses}>{codeErrors.coupon}</p>}
                      </div>
                      <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">Código de Referido (para tu primer pedido)</label>
                          <input type="text" value={referralCodeUsed} onChange={e => setReferralCodeUsed(e.target.value)} className={inputClasses} placeholder="Ej: JUAN1234" />
                          {codeErrors.referral && <p className={errorClasses}>{codeErrors.referral}</p>}
                      </div>
                  </div>
              </section>
              <section className="border-t pt-8">
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-gray-600">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {deliveryFee > 0 && (
                          <div className="flex justify-between text-gray-600">
                              <span>Envío:</span>
                              <span>{formatCurrency(deliveryFee)}</span>
                          </div>
                      )}
                      {codeErrors.discount && codeErrors.discount > 0 && (
                           <div className="flex justify-between font-semibold text-green-600">
                              <span>Descuento por Cupón:</span>
                              <span>-{formatCurrency(codeErrors.discount)}</span>
                          </div>
                      )}
                       <div className="flex justify-between items-center text-3xl font-bold text-brand-secondary mt-2 pt-2 border-t">
                          <span>Total:</span>
                          <span>{formatCurrency(subtotal + deliveryFee - (codeErrors.discount || 0))}</span>
                      </div>
                  </div>

                  <button
                      onClick={validateCodesAndSubmit}
                      className="mt-6 w-full bg-brand-secondary hover:bg-brand-dark text-white font-bold py-4 px-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-brand-accent"
                  >
                      Confirmar Pedido
                  </button>
              </section>
            </div>
          )}
          {activeTab === 'referrals' && (
            <section className="animate-fade-in">
                <div className="text-center">
                    <h3 className="text-3xl font-bold text-brand-dark mb-2">¡Gana Tortillas Gratis!</h3>
                    <p className="text-gray-600 mb-6 max-w-xl mx-auto">Invita a tus amigos y gana una recompensa de <span className="font-bold">{REWARD_TORTILLAS} tortillas</span> cuando hagan su primer pedido de {MIN_ORDER_FOR_REFERRAL} o más.</p>
                </div>
                
                <div className="max-w-md mx-auto space-y-4 mb-6 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h4 className="font-bold text-lg text-brand-dark text-center">Genera tu código aquí</h4>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Tu Nombre Completo</label>
                        <input 
                            type="text" 
                            value={referralName} 
                            onChange={e => setReferralName(e.target.value)} 
                            className={`${inputClasses} border-gray-300 focus:ring-brand-accent`} 
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Tu Teléfono (10 dígitos)</label>
                        <input 
                            type="tel" 
                            value={referralPhone} 
                            onChange={e => setReferralPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                            className={`${inputClasses} border-gray-300 focus:ring-brand-accent`}
                            placeholder="Ej: 5512345678"
                        />
                    </div>
                </div>

                <div className="bg-brand-light/50 p-6 rounded-xl border-2 border-dashed border-brand-primary">
                    {generatedReferralCode ? (
                        <div className="text-center">
                            <p className="text-brand-dark font-semibold">¡Listo! Tu código de referido es:</p>
                            <p className="text-4xl font-extrabold text-brand-secondary tracking-widest my-2 bg-white inline-block px-4 py-2 rounded-lg shadow-inner">{generatedReferralCode}</p>
                            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-4">
                                <button onClick={handleShareReferral} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                                    <WhatsAppIcon className="w-5 h-5 mr-2"/>
                                    Compartir por WhatsApp
                                </button>
                            </div>
                            {shareError && <p className="text-red-500 text-sm mt-3 animate-fade-in">{shareError}</p>}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center p-4">Completa tu nombre y teléfono para generar tu código.</p>
                    )}
                </div>
            </section>
          )}
          {activeTab === 'affiliates' && (
            <section className="text-center animate-fade-in">
              <h3 className="text-3xl font-bold text-brand-dark mb-2">Programa de Afiliados</h3>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto">¿Quieres ganar dinero vendiendo nuestras tortillas? Únete a nuestro programa de afiliados y obtén comisiones por cada venta que generes.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button onClick={() => setAffiliateAppVisible(true)} className="bg-gray-800 hover:bg-black text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center">
                      <StoreIcon className="w-5 h-5 mr-2"/>
                      Quiero ser Vendedor
                  </button>
                  <button onClick={onAffiliateLoginClick} className="text-brand-secondary font-semibold hover:underline py-3 px-6">
                      Ya soy vendedor, ingresar
                  </button>
              </div>
            </section>
          )}
           {activeTab === 'coupons' && (
            <section className="animate-fade-in">
                <div className="text-center">
                    <h3 className="text-3xl font-bold text-brand-dark mb-2">Mis Cupones Activos</h3>
                </div>
                {!currentCouponPhone ? (
                    <form onSubmit={handleShowCoupons} className="max-w-md mx-auto space-y-4 mt-6 bg-slate-50 p-6 rounded-xl border">
                        <p className="text-gray-600 mb-4 text-center">Ingresa tu número de teléfono para ver los cupones que has ganado por referir amigos.</p>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Tu Teléfono (10 dígitos)</label>
                            <input 
                                type="tel" 
                                value={couponPhoneInput} 
                                onChange={e => setCouponPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                                className={`${inputClasses} border-gray-300 focus:ring-brand-accent`}
                                placeholder="Escribe tu número aquí..."
                            />
                            {couponLookupError && <p className={errorClasses}>{couponLookupError}</p>}
                        </div>
                        <button type="submit" className="w-full bg-brand-secondary hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-lg">
                            Consultar Cupones
                        </button>
                    </form>
                ) : (
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 mt-4 gap-2">
                             <p className="text-gray-700 text-center sm:text-left">Mostrando cupones para: <strong className="text-brand-dark">{currentCouponPhone}</strong></p>
                             <button onClick={() => { setCurrentCouponPhone(null); setCouponPhoneInput(''); }} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">
                                Consultar otro número
                            </button>
                        </div>
                        {activeUserCoupons.length > 0 ? (
                            <div className="space-y-4">
                                {activeUserCoupons.map(coupon => (
                                    <div key={coupon.code} className="bg-white border-2 border-dashed border-brand-primary rounded-lg p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div>
                                            <p className="font-semibold text-gray-500 text-sm">Cupón para {REWARD_TORTILLAS} tortillas gratis</p>
                                            <p className="font-mono font-bold text-2xl text-brand-secondary tracking-widest">{coupon.code}</p>
                                        </div>
                                        <button
                                          onClick={() => handleCopyCoupon(coupon.code)}
                                          className={`w-full sm:w-auto px-6 py-2 rounded-lg font-semibold text-white transition-colors shadow ${
                                            copiedCoupon === coupon.code
                                            ? 'bg-green-500'
                                            : 'bg-brand-secondary hover:bg-brand-dark'
                                          }`}
                                        >
                                          {copiedCoupon === coupon.code ? '¡Copiado!' : 'Copiar Código'}
                                        </button>
                                    </div>
                                ))}
                                <p className="text-center text-sm text-gray-500 pt-4">Copia un código y pégalo en la sección "Hacer Pedido" para canjearlo.</p>
                            </div>
                        ) : (
                            <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-600">No tienes cupones activos para este número de teléfono.</p>
                                <p className="text-sm text-gray-500 mt-2">¡Invita amigos desde la pestaña "Gana Gratis" para obtener cupones!</p>
                            </div>
                        )}
                    </div>
                )}
            </section>
          )}
        </div>
      </div>
      <ConfirmationModal 
        isVisible={isConfirmationVisible}
        order={orderToConfirm}
        onConfirm={handleConfirmOrder}
        onCancel={() => setConfirmationVisible(false)}
      />
      <AffiliateApplicationModal
        isVisible={isAffiliateAppVisible}
        onClose={() => setAffiliateAppVisible(false)}
      />
    </div>
  );
};

export default CustomerView;
