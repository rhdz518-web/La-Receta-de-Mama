import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Order, OrderStatus, PaymentMethod, InventoryChangeStatus, Affiliate, CashOutStatus, CashOut, InventoryChange } from '../types';
import StatCard from './StatCard';
import CashIcon from './icons/CashIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import ClockIcon from './icons/ClockIcon';
import StoreIcon from './icons/StoreIcon';
import CogIcon from './icons/CogIcon';
import ImagePreviewModal from './ImagePreviewModal';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';


const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });


const isAffiliateCurrentlyOpen = (affiliate: Affiliate | null): boolean => {
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

const OrderHistoryItem: React.FC<{order: Order; commissionRate: number; tortillaPrice: number}> = ({order, commissionRate, tortillaPrice}) => {
    // Recalculate values from ground truth for robustness.
    const subtotal = order.quantity * tortillaPrice;
    const deliveryFee = Number(order.deliveryFeeApplied || 0);
    const discount = Number(order.discountApplied || 0);
    const totalOrderAmount = subtotal + deliveryFee - discount;

    const commission = (order.quantity * commissionRate) / 100;
    const isCash = order.paymentMethod === PaymentMethod.Cash;
    
    const netForAdmin = (subtotal - discount) - commission;
    const netForAffiliate = commission + deliveryFee;
    
    const transferMessage = () => {
        if (!isCash && deliveryFee > 0) {
            return (
                <>
                    ADMIN TE DEBE TRANSFERIR: {formatCurrency(netForAffiliate)}
                    <span className="block text-xs font-normal opacity-80 mt-1">
                        ({formatCurrency(commission)} comisión + {formatCurrency(deliveryFee)} envío)
                    </span>
                </>
            );
        }
        return `ADMIN TE DEBE TRANSFERIR: ${formatCurrency(netForAffiliate)}`;
    };

    return (
        <div className="text-sm p-3 border-b space-y-1">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-gray-800">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{new Date(order.timestamp).toLocaleDateString('es-MX')} ({order.paymentMethod})</p>
                </div>
                <p className="font-bold text-lg text-brand-dark">{formatCurrency(totalOrderAmount)}</p>
            </div>
            {/* Customer Bill Breakdown */}
            <div className="pl-4 border-l-2 space-y-1 text-xs">
                <p className="flex justify-between"><span>{order.quantity} tortillas (Subtotal):</span> <span>{formatCurrency(subtotal)}</span></p>
                {deliveryFee > 0 && <p className="flex justify-between"><span>Costo de Envío:</span> <span>{formatCurrency(deliveryFee)}</span></p>}
                {discount > 0 && <p className="flex justify-between text-red-600"><span>Descuento:</span> <span>-{formatCurrency(discount)}</span></p>}
            </div>

            {/* Affiliate Earnings Breakdown */}
            <div className="mt-2 pl-4 border-l-2 border-green-300 space-y-1 text-xs">
                <p className="flex justify-between text-green-700 font-semibold">
                    <span>Tu Ganancia por Comisión:</span>
                    <span>{formatCurrency(commission)}</span>
                </p>
                {deliveryFee > 0 && (
                    <p className="flex justify-between text-blue-700 font-semibold">
                        <span>Monto por Envío Realizado:</span>
                        <span>{formatCurrency(deliveryFee)}</span>
                    </p>
                )}
            </div>
            
            <div className={`mt-2 p-2 rounded text-center font-bold text-xs ${isCash ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'}`}>
                {isCash 
                    ? `DEBES PAGAR AL ADMIN: ${formatCurrency(netForAdmin)}`
                    : transferMessage()
                }
            </div>
        </div>
    );
};

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const getStatusClass = (status: OrderStatus | InventoryChangeStatus | CashOutStatus) => {
    switch (status) {
        case OrderStatus.Active: return 'bg-blue-100 text-blue-800';
        case OrderStatus.Finished: return 'bg-green-100 text-green-800';
        case OrderStatus.Cancelled: return 'bg-red-100 text-red-800';
        case OrderStatus.PendingConfirmation: return 'bg-yellow-100 text-yellow-800';
        case InventoryChangeStatus.Pending: return 'bg-yellow-100 text-yellow-800';
        case InventoryChangeStatus.Approved: return 'bg-blue-100 text-blue-800';
        case InventoryChangeStatus.Completed: return 'bg-green-100 text-green-800';
        case InventoryChangeStatus.Rejected: return 'bg-red-100 text-red-800';
        case CashOutStatus.PendingAffiliateConfirmation: return 'bg-yellow-100 text-yellow-800';
        case CashOutStatus.Completed: return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const AffiliateCashOutHistoryDetail: React.FC<{ cashOut: CashOut; allOrders: Order[]; commissionRate: number }> = ({ cashOut, allOrders, commissionRate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const coveredOrders = useMemo(() => 
        allOrders.filter(order => cashOut.ordersCoveredIds.includes(order.id))
        .sort((a,b) => a.timestamp - b.timestamp), 
    [cashOut, allOrders]);

    return (
        <div className="border rounded-lg overflow-hidden">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left p-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100">
                <div>
                    <p className="font-semibold text-gray-800">{formatDate(cashOut.startDate)} - {formatDate(cashOut.endDate)}</p>
                    <p className={`font-bold ${cashOut.balance >= 0 ? 'text-blue-600' : 'text-green-600'}`}>{formatCurrency(Math.abs(cashOut.balance))}</p>
                </div>
                 <div className="flex items-center gap-2">
                    <span className={`text-sm ${cashOut.balance >= 0 ? 'text-blue-800' : 'text-green-800'}`}>{cashOut.balance >= 0 ? 'Pagado' : 'Recibido'}</span>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isExpanded && (
                <div className="p-3 bg-white border-t">
                    <h5 className="font-bold mb-2">Pedidos Incluidos ({coveredOrders.length})</h5>
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
                        <p className="flex justify-between text-sm font-semibold text-green-800">
                            <span>Tu Ganancia por Comisión:</span>
                            <span>{formatCurrency(cashOut.totalCommission)}</span>
                        </p>
                        {cashOut.totalDeliveryFees > 0 && (
                            <p className="flex justify-between text-sm font-semibold text-blue-800">
                                <span>Monto por Envíos Realizados:</span>
                                <span>{formatCurrency(cashOut.totalDeliveryFees)}</span>
                            </p>
                        )}
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {coveredOrders.map(order => {
                            const commission = (order.quantity * commissionRate) / 100;
                            const isCash = order.paymentMethod === PaymentMethod.Cash;
                            const totalOrderAmount = order.totalCost + (order.deliveryFeeApplied || 0) - (order.discountApplied || 0);
                            const netForAdmin = (order.totalCost - (order.discountApplied || 0)) - commission;
                            const netForAffiliate = commission + (order.deliveryFeeApplied || 0);

                            const transferMessage = () => {
                                const deliveryFee = order.deliveryFeeApplied || 0;
                                if (!isCash && deliveryFee > 0) {
                                    return (
                                        <>
                                            ADMIN TE DEBE TRANSFERIR: {formatCurrency(netForAffiliate)}
                                            <span className="block text-xs font-normal opacity-80 mt-1">
                                                ({formatCurrency(commission)} comisión + {formatCurrency(deliveryFee)} envío)
                                            </span>
                                        </>
                                    );
                                }
                                return `ADMIN TE DEBE TRANSFERIR: ${formatCurrency(netForAffiliate)}`;
                            };

                            return (
                                <div key={order.id} className="text-sm p-3 border-b space-y-1 bg-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-800">{order.customerName}</p>
                                            <p className="text-xs text-gray-500">{new Date(order.timestamp).toLocaleDateString('es-MX')} ({order.paymentMethod})</p>
                                        </div>
                                        <p className="font-bold text-lg text-brand-dark">{formatCurrency(totalOrderAmount)}</p>
                                    </div>
                                    <div className="pl-4 border-l-2 space-y-1 text-xs">
                                        <p className="flex justify-between"><span>{order.quantity} tortillas:</span> <span>{formatCurrency(order.totalCost)}</span></p>
                                        {(order.deliveryFeeApplied || 0) > 0 && <p className="flex justify-between"><span>Envío:</span> <span>{formatCurrency(order.deliveryFeeApplied!)}</span></p>}
                                        {(order.discountApplied || 0) > 0 && <p className="flex justify-between text-red-600"><span>Descuento:</span> <span>-{formatCurrency(order.discountApplied!)}</span></p>}
                                        <p className="flex justify-between text-green-700 font-semibold"><span>Tu Comisión:</span> <span>{formatCurrency(commission)}</span></p>
                                    </div>
                                     <div className={`mt-2 p-2 rounded text-center font-bold text-xs ${isCash ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'}`}>
                                        {isCash 
                                            ? `DEBES PAGAR AL ADMIN: ${formatCurrency(netForAdmin)}`
                                            : transferMessage()
                                        }
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const AffiliateView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { currentAffiliate } = state;
    const [activeTab, setActiveTab] = useState('dashboard');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [requestAmount, setRequestAmount] = useState<number | string>('');
    
    const [editedAddress, setEditedAddress] = useState(currentAffiliate?.address || '');
    const [editedDeliveryCost, setEditedDeliveryCost] = useState(currentAffiliate?.deliveryCost.toString() || '0');
    const [editedSchedule, setEditedSchedule] = useState<Affiliate['schedule'] | null>(null);
    const [editedBankDetails, setEditedBankDetails] = useState(currentAffiliate?.bankDetails || '');
    const [showSettingsSuccess, setShowSettingsSuccess] = useState(false);
    const [showBankSuccess, setShowBankSuccess] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());

    // This effect creates an interval that updates the current time every minute.
    // This is used to re-render the component and check if the "Notify Admin" button should be displayed.
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000); // Update every 60 seconds
        return () => clearInterval(timer);
    }, []);

    const currentAffiliateData = useMemo(() => {
        if (!currentAffiliate) return null;
        return state.affiliates.find(a => a.id === currentAffiliate.id);
    }, [state.affiliates, currentAffiliate]);

    useEffect(() => {
        if (currentAffiliateData) {
            setEditedAddress(currentAffiliateData.address);
            setEditedDeliveryCost(currentAffiliateData.deliveryCost.toString());
            setEditedSchedule(currentAffiliateData.schedule);
            setEditedBankDetails(currentAffiliateData.bankDetails || '');
        }
    }, [currentAffiliateData]);

    useEffect(() => {
        if (state.successMessage) {
            const timer = setTimeout(() => {
                dispatch({ type: 'CLEAR_SUCCESS_MESSAGE' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [state.successMessage, dispatch]);

    const affiliateOrders = useMemo(() => {
        if (!currentAffiliate) return [];
        return state.orders.filter(o => o.affiliateId === currentAffiliate.id);
    }, [state.orders, currentAffiliate]);

    const lowInventoryOrders = useMemo(() => {
        if (!currentAffiliate) return [];
        return affiliateOrders.filter(o => o.isLowInventoryOrder && o.status === OrderStatus.Active)
    }, [affiliateOrders]);
    
    const inventoryChanges = useMemo(() => {
        if (!currentAffiliate) return [];
        return state.inventoryChanges.filter(c => c.affiliateId === currentAffiliate.id)
            .sort((a,b) => b.timestamp - a.timestamp);
    }, [state.inventoryChanges, currentAffiliate]);

    const stats = useMemo(() => {
        if (!affiliateOrders) return { totalSales: 0, commission: 0, balanceToPay: 0, tortillasSold: 0, finishedOrders: [], totalDeliveryFees: 0 };
        
        const finishedOrders = affiliateOrders.filter(o => o.status === OrderStatus.Finished && !o.settledInCashOutId);
        
        const totalSales = finishedOrders.reduce((sum, o) => sum + o.totalCost + (o.deliveryFeeApplied || 0) - (o.discountApplied || 0), 0);
        const tortillasSold = finishedOrders.reduce((sum, order) => sum + order.quantity, 0);
        
        let calculatedBalance = 0;
        let calculatedCommission = 0;
        let calculatedDeliveryFees = 0;
        finishedOrders.forEach(order => {
            const commission = (order.quantity * state.affiliateCommissionPerTortilla) / 100;
            calculatedCommission += commission;
            const deliveryFee = order.deliveryFeeApplied || 0;
            calculatedDeliveryFees += deliveryFee;
    
            if (order.paymentMethod === PaymentMethod.Cash) {
                const amountOwedByAffiliate = (order.totalCost - (order.discountApplied || 0)) - commission;
                calculatedBalance += amountOwedByAffiliate;
            } else { // Transfer
                const amountOwedToAffiliate = commission + deliveryFee;
                calculatedBalance -= amountOwedToAffiliate;
            }
        });
        
        return { 
            totalSales, 
            commission: calculatedCommission, 
            balanceToPay: calculatedBalance, 
            tortillasSold, 
            finishedOrders,
            totalDeliveryFees: calculatedDeliveryFees 
        };
    }, [affiliateOrders, state.affiliateCommissionPerTortilla]);

    if (!currentAffiliate || !currentAffiliateData || !editedSchedule) {
        return <div className="text-center p-8">Error: No se encontró el afiliado. Por favor, vuelve a iniciar sesión.</div>;
    }

    const handleUpdateOrderStatus = (order: Order, status: OrderStatus) => {
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { order, status } });
    };

    const handleToggleDelivery = () => {
        if (currentAffiliateData) {
            dispatch({ type: 'TOGGLE_AFFILIATE_DELIVERY', payload: { affiliate: currentAffiliateData } });
        }
    };
    
    const handleToggleTemporaryClosed = () => {
        if(currentAffiliateData) {
            dispatch({ type: 'TOGGLE_TEMPORARY_CLOSED', payload: { affiliate: currentAffiliateData } });
        }
    };

    const handleScheduleChange = (day: string, field: 'isOpen' | 'openTime' | 'closeTime', value: any) => {
        setEditedSchedule(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    [field]: value
                }
            };
        });
    };

    const handleSaveChanges = () => {
        const cost = parseFloat(editedDeliveryCost);
        if (isNaN(cost) || cost < 0) {
            // Future improvement: Show an error to the user
            return;
        }
        dispatch({
            type: 'UPDATE_AFFILIATE_SETTINGS',
            payload: {
                affiliateId: currentAffiliateData.id,
                address: editedAddress,
                deliveryCost: cost
            }
        });
        if (editedSchedule) {
            dispatch({ 
                type: 'UPDATE_AFFILIATE_SCHEDULE', 
                payload: {
                    affiliateId: currentAffiliateData.id,
                    schedule: editedSchedule
                }
            });
        }
        setShowSettingsSuccess(true);
        setTimeout(() => setShowSettingsSuccess(false), 3000);
    };

     const handleSaveBankDetails = () => {
        dispatch({
            type: 'UPDATE_AFFILIATE_BANK_DETAILS',
            payload: {
                affiliateId: currentAffiliateData.id,
                bankDetails: editedBankDetails,
            }
        });
        setShowBankSuccess(true);
        setTimeout(() => setShowBankSuccess(false), 3000);
    };

    const handleRequestInventory = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(requestAmount);
        if (amount <= 0) return;

        const change: InventoryChange = {
            id: `${Date.now()}`,
            affiliateId: currentAffiliateData.id,
            amount,
            timestamp: Date.now(),
            status: InventoryChangeStatus.Pending,
        };
        dispatch({ type: 'ADD_INVENTORY_CHANGE', payload: change });
        dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: `Solicitud de ${amount} tortillas enviada.` });
        setRequestAmount('');
    };
    
    const handleConfirmCashOut = (cashOutId: string) => {
        dispatch({ type: 'AFFILIATE_CONFIRM_CASHOUT', payload: { cashOutId } });
    };
    
    const handleNotifyAdmin = (order: Order) => {
        const message = `Hola, ¿podrías ayudarme a confirmar el pago por transferencia para el pedido de *${order.customerName}* (ID: ${order.id})? ¡Gracias!`;
        const whatsappUrl = `https://wa.me/52${state.adminPhoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleNotifyAdminForInventory = (amount: number) => {
        if (!currentAffiliate) return;
        const message = `Hola, ¡ayuda por favor! Tengo un pedido urgente y solicité *${amount} tortillas* para poder surtirlo. ¿Podrías aprobar mi solicitud de inventario? ¡Gracias!`;
        const whatsappUrl = `https://wa.me/52${state.adminPhoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleCancelRequest = (changeId: string) => {
        if (window.confirm('¿Confirmas que deseas cancelar esta solicitud?')) {
            dispatch({ type: 'CANCEL_INVENTORY_REQUEST', payload: { changeId } });
        }
    };

    const handleConfirmInventoryChange = (change: InventoryChange) => {
         dispatch({ type: 'AFFILIATE_CONFIRM_INVENTORY_CHANGE', payload: { change } });
    }

    const renderDashboard = () => {
        const isOpen = isAffiliateCurrentlyOpen(currentAffiliateData);
        const hasPendingRequest = inventoryChanges.some(c => c.status === InventoryChangeStatus.Pending && c.amount > 0);
        const pendingDeliveries = inventoryChanges.filter(c => c.status === InventoryChangeStatus.Approved);
        return (
            <div className="space-y-6">
                 {pendingDeliveries.length > 0 && (
                    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md shadow-sm" role="alert">
                       <div className="flex">
                           <div className="py-1"><InformationCircleIcon className="h-6 w-6 mr-4" /></div>
                           <div>
                               <p className="font-bold">¡Tienes entregas de inventario pendientes!</p>
                               <p className="text-sm mb-2">El administrador aprobó {pendingDeliveries.length} solicitud(es). Ve a la pestaña de inventario para confirmar que las has recibido.</p>
                               <button
                                   onClick={() => setActiveTab('inventory')}
                                   className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded text-sm transition-colors shadow-sm"
                               >
                                   Ir a Inventario
                               </button>
                           </div>
                       </div>
                   </div>
                )}
                {lowInventoryOrders.length > 0 && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm" role="alert">
                        <div className="flex">
                            <div className="py-1"><ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-4" /></div>
                            <div>
                                <p className="font-bold">¡Atención! Tienes {lowInventoryOrders.length} pedido(s) que superan tu inventario.</p>
                                <p className="text-sm mb-2">Contacta a los clientes y solicita más inventario al administrador de forma urgente para poder surtir estos pedidos.</p>
                                <button
                                    onClick={() => setActiveTab('inventory')}
                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded text-sm transition-colors shadow-sm"
                                >
                                    Solicitar Inventario Ahora
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {currentAffiliateData.inventory <= 20 && lowInventoryOrders.length === 0 && (
                     <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-sm" role="alert">
                        <div className="flex">
                            <div className="py-1">
                                <svg className="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 13h2v-2H9v2zm0-4h2V5H9v4z"/></svg>
                            </div>
                            {hasPendingRequest ? (
                                <div>
                                    <p className="font-bold">¡Inventario Bajo!</p>
                                    <p className="text-sm">Te quedan {currentAffiliateData.inventory} tortillas, pero ya tienes una solicitud de inventario pendiente.</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-bold">¡Inventario Bajo!</p>
                                    <p className="text-sm">Te quedan {currentAffiliateData.inventory} tortillas. Para evitar quedarte sin stock, puedes solicitar más.</p>
                                    <button onClick={() => setActiveTab('inventory')} className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded text-sm transition-colors">
                                        Ir a Solicitar Inventario
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className={`p-4 rounded-lg text-center font-bold text-white shadow-md ${!isOpen ? 'bg-red-500' : 'bg-green-500'}`}>
                    {isOpen ? 'TIENDA ABIERTA' : 'TIENDA CERRADA'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                    <StatCard title="Inventario Actual" value={`${currentAffiliateData.inventory} tortillas`} icon={<StoreIcon className="w-8 h-8"/>} />
                    <StatCard title="Ventas desde Corte" value={stats.tortillasSold} icon={<ChartBarIcon className="w-8 h-8"/>} />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4">Tu Balance Actual (para próximo corte)</h3>
                    <div className="space-y-3">
                        <div className="p-3 bg-green-50 rounded-lg text-green-800 border border-green-200">
                            <p className="flex justify-between font-semibold">
                                <span>Ganancia por Comisión:</span>
                                <span>{formatCurrency(stats.commission)}</span>
                            </p>
                        </div>
                        {stats.totalDeliveryFees > 0 && (
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-800 border border-blue-200">
                                <p className="flex justify-between font-semibold">
                                    <span>Monto por Envíos Realizados:</span>
                                    <span>{formatCurrency(stats.totalDeliveryFees)}</span>
                                </p>
                            </div>
                        )}
                        <div className={`mt-3 p-4 rounded-lg text-center font-bold text-lg ${stats.balanceToPay >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {stats.balanceToPay >= 0 ? (
                                <div>
                                    <p className="text-sm">Saldo a Pagar al Admin</p>
                                    <p className="text-3xl">{formatCurrency(stats.balanceToPay)}</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm">Transferencia a Recibir del Admin</p>
                                    <p className="text-3xl">{formatCurrency(Math.abs(stats.balanceToPay))}</p>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-center text-gray-500 pt-2">Basado en {stats.finishedOrders.length} ventas desde el último corte.</p>
                    </div>
                </div>
            </div>
        );
    }
    
    const renderSettings = () => {
        const daysOfWeek = [
            { key: 'monday', name: 'Lunes' },
            { key: 'tuesday', name: 'Martes' },
            { key: 'wednesday', name: 'Miércoles' },
            { key: 'thursday', name: 'Jueves' },
            { key: 'friday', name: 'Viernes' },
            { key: 'saturday', name: 'Sábado' },
            { key: 'sunday', name: 'Domingo' },
        ];
        
        return (
            <div className="bg-white p-6 rounded-xl shadow-md space-y-8">
                <div>
                    <h3 className="text-2xl font-bold text-brand-dark mb-2">Ajustes de Vendedor</h3>
                    {/* Quick Close Button */}
                    <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-red-800">Cierre de Emergencia</p>
                                <p className="text-sm text-gray-600">
                                    {currentAffiliateData.isTemporarilyClosed ? "Tu tienda está marcada como cerrada." : "Usa esto si necesitas cerrar inesperadamente."}
                                </p>
                            </div>
                            <button 
                                onClick={handleToggleTemporaryClosed}
                                className={`px-4 py-2 font-semibold rounded-lg text-white shadow-sm transition-colors ${
                                    currentAffiliateData.isTemporarilyClosed ? 'bg-green-500 hover:bg-green-600' : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {currentAffiliateData.isTemporarilyClosed ? 'Abrir Tienda' : 'Cerrar Tienda'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="pt-8 border-t">
                    <h4 className="text-xl font-bold text-brand-dark mb-4">Mis Datos Bancarios</h4>
                    <p className="text-sm text-gray-500 mb-4">Esta información se usará para que el administrador te pague tus comisiones y cobros por transferencia.</p>
                    <textarea 
                        value={editedBankDetails}
                        onChange={(e) => setEditedBankDetails(e.target.value)}
                        rows={4}
                        placeholder="Ej: Banco: XYZ, CLABE: 123..., Titular: Nombre Apellido"
                        className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-brand-accent bg-gray-50"
                    />
                     {showBankSuccess && (
                        <div className="my-3 bg-green-100 text-green-700 p-2 rounded-md text-center text-sm font-semibold animate-fade-in">
                            ¡Datos bancarios guardados!
                        </div>
                    )}
                    <button 
                        onClick={handleSaveBankDetails}
                        className="mt-3 w-full bg-brand-accent hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Guardar Datos Bancarios
                    </button>
                </div>
                
                {/* Schedule */}
                <div className="pt-8 border-t">
                    <h4 className="text-xl font-bold text-brand-dark mb-4">Horario de la Tienda</h4>
                    <div className="space-y-3">
                        {daysOfWeek.map(day => (
                            <div key={day.key} className="grid grid-cols-3 gap-3 items-center p-3 rounded-lg bg-gray-50">
                                <label className="flex items-center gap-2 font-semibold text-gray-700">
                                    <input 
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-gray-300 text-brand-secondary focus:ring-brand-accent"
                                        checked={editedSchedule[day.key].isOpen}
                                        onChange={e => handleScheduleChange(day.key, 'isOpen', e.target.checked)}
                                    />
                                    {day.name}
                                </label>
                                <div className="col-span-2 grid grid-cols-2 gap-2">
                                    <input 
                                        type="time"
                                        disabled={!editedSchedule[day.key].isOpen}
                                        value={editedSchedule[day.key].openTime}
                                        onChange={e => handleScheduleChange(day.key, 'openTime', e.target.value)}
                                        className="p-1 border rounded-md disabled:bg-gray-200 disabled:text-gray-400"
                                    />
                                     <input 
                                        type="time"
                                        disabled={!editedSchedule[day.key].isOpen}
                                        value={editedSchedule[day.key].closeTime}
                                        onChange={e => handleScheduleChange(day.key, 'closeTime', e.target.value)}
                                        className="p-1 border rounded-md disabled:bg-gray-200 disabled:text-gray-400"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* General Settings */}
                <div className="space-y-4 pt-8 border-t">
                     <div>
                        <h4 className="text-xl font-bold text-brand-dark mb-4">Ajustes Generales</h4>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Dirección de tu Tienda (para recoger pedidos)</label>
                        <textarea 
                            value={editedAddress}
                            onChange={(e) => setEditedAddress(e.target.value)}
                            rows={2}
                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-brand-accent bg-gray-50"
                        />
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div>
                            <p className="font-semibold text-gray-800">Ofrecer Servicio a Domicilio</p>
                            <p className="text-sm text-gray-500">
                                {currentAffiliateData.hasDeliveryService ? "Activado" : "Desactivado"}
                            </p>
                        </div>
                        <label htmlFor="delivery-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id="delivery-toggle" 
                                className="sr-only peer"
                                checked={currentAffiliateData.hasDeliveryService}
                                onChange={handleToggleDelivery}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-brand-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-secondary"></div>
                        </label>
                    </div>
                    {currentAffiliateData.hasDeliveryService && (
                        <div className="animate-fade-in">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Costo de Envío a Domicilio (MXN)</label>
                             <input 
                                type="number"
                                value={editedDeliveryCost}
                                onChange={(e) => setEditedDeliveryCost(e.target.value)}
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-brand-accent bg-gray-50"
                                placeholder="Ej: 20"
                            />
                            <p className="text-xs text-gray-500 mt-1">Escribe 0 para ofrecer envío gratis.</p>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t">
                    {showSettingsSuccess && (
                        <div className="mb-4 bg-green-100 text-green-700 p-3 rounded-md text-center font-semibold animate-fade-in">
                            ¡Cambios guardados exitosamente!
                        </div>
                    )}
                    <button 
                        onClick={handleSaveChanges}
                        className="w-full bg-brand-secondary hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        Guardar Ajustes de Horario y Envío
                    </button>
                </div>
            </div>
        );
    }

    const renderActiveOrders = () => {
        const activeOrders = affiliateOrders.filter(o => o.status === OrderStatus.Active || o.status === OrderStatus.PendingConfirmation);
        return (
            <div>
                <div className="bg-white p-4 rounded-xl shadow-md">
                    <h3 className="text-2xl font-bold mb-4">Tus Pedidos Activos</h3>
                    <div className="space-y-4">
                        {activeOrders.length > 0 ? activeOrders.slice().sort((a,b) => b.timestamp - a.timestamp).map(order => {
                            const showNotifyButton = order.status === OrderStatus.PendingConfirmation && (currentTime - order.timestamp) > 10 * 60 * 1000;
                            
                            // Recalculate from ground truth for robustness
                            const subtotal = order.quantity * state.tortillaPrice;
                            const deliveryFee = Number(order.deliveryFeeApplied || 0);
                            const discount = Number(order.discountApplied || 0);
                            const totalToCollect = subtotal + deliveryFee - discount;

                            return (
                                <div key={order.id} className={`border rounded-lg p-4 ${order.isLowInventoryOrder ? 'border-red-400 border-2 bg-red-50/50' : ''}`}>
                                     <div className="flex flex-wrap justify-between items-start gap-2">
                                        <div>
                                            <p className="font-bold text-brand-dark">{order.customerName}</p>
                                            <p className="text-sm text-gray-500">{order.phone}</p>
                                            {order.deliveryChoice !== 'pickup' && <p className="text-sm text-gray-500">{order.address}</p>}
                                            <p className="text-xs text-gray-400 mt-1">{new Date(order.timestamp).toLocaleString('es-MX')}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold self-center ${getStatusClass(order.status)}`}>{order.status}</span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">{order.quantity} tortillas (Subtotal):</span>
                                            <span className="font-semibold">{formatCurrency(subtotal)}</span>
                                        </div>
                                        {deliveryFee > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Costo de Envío:</span>
                                                <span className="font-semibold">{formatCurrency(deliveryFee)}</span>
                                            </div>
                                        )}
                                        {discount > 0 && (
                                            <div className="flex justify-between text-sm text-red-600">
                                                <span className="font-semibold">Descuento:</span>
                                                <span className="font-semibold">-{formatCurrency(discount)}</span>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t">
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-bold text-lg text-brand-dark">Total a Cobrar:</span>
                                                <span className="font-bold text-xl text-brand-secondary">{formatCurrency(totalToCollect)}</span>
                                            </div>
                                            {(deliveryFee > 0 || discount > 0) && (
                                                <div className="text-right text-xs text-gray-500 mt-1">
                                                    ({formatCurrency(subtotal)} subtotal
                                                    {deliveryFee > 0 && ` + ${formatCurrency(deliveryFee)} envío`}
                                                    {discount > 0 && ` - ${formatCurrency(discount)} desc.`})
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {order.isLowInventoryOrder && (
                                        <div className="mt-3 p-3 bg-red-100 text-red-800 rounded-md space-y-2">
                                            <p className="font-bold text-sm flex items-center gap-2">
                                                <ExclamationTriangleIcon className="w-5 h-5" />
                                                Este pedido excede tu inventario
                                            </p>
                                            <p className="text-xs">Contacta al cliente para coordinar la entrega o ajustar el pedido.</p>
                                            <button
                                                onClick={() => {
                                                    const message = `¡Hola ${order.customerName}! Te contacto sobre tu pedido de tortillas. Veo que solicitaste más de las que tengo disponibles en este momento. Por favor, avísame si podemos ajustar la cantidad o coordinar la entrega. ¡Gracias!`;
                                                    const whatsappUrl = `https://wa.me/52${order.phone}?text=${encodeURIComponent(message)}`;
                                                    window.open(whatsappUrl, '_blank');
                                                }}
                                                className="w-full mt-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <WhatsAppIcon className="w-4 h-4" />
                                                Contactar ({order.phone})
                                            </button>
                                        </div>
                                    )}
                                    {order.paymentMethod === PaymentMethod.Transfer && order.paymentReceiptImage && (
                                        <div className="mt-4 pt-4 border-t">
                                            <h4 className="font-semibold text-gray-700 mb-2 text-sm">Comprobante de Pago del Cliente:</h4>
                                            <div className="h-48 w-64 bg-gray-100 rounded-md overflow-hidden">
                                                <img 
                                                    src={order.paymentReceiptImage} 
                                                    alt="Comprobante" 
                                                    className="h-full w-full object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                                                    onClick={() => setPreviewImageUrl(order.paymentReceiptImage!)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {order.status === OrderStatus.Active ? (
                                        <div className="flex justify-end gap-2 mt-4">
                                            <button onClick={() => handleUpdateOrderStatus(order, OrderStatus.Finished)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-semibold">Finalizar</button>
                                            <button onClick={() => handleUpdateOrderStatus(order, OrderStatus.Cancelled)} className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm font-semibold">Cancelar</button>
                                        </div>
                                    ) : (
                                        <div className="mt-4 text-center bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
                                            <p className="font-semibold">Esperando confirmación de pago del administrador.</p>
                                            <p className="font-bold">No entregar tortillas hasta recibir confirmación.</p>
                                            {showNotifyButton && (
                                                <button
                                                    onClick={() => handleNotifyAdmin(order)}
                                                    className="mt-3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 w-full sm:w-auto mx-auto"
                                                >
                                                    <WhatsAppIcon className="w-4 h-4" />
                                                    Notificar al Admin por Retraso
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        }) : <p className="text-gray-500 text-center py-4">No tienes pedidos activos.</p>}
                    </div>
                </div>
            </div>
        );
    }
    
    const renderCashOuts = () => {
        const myCashOuts = state.cashOuts.filter(co => co.affiliateId === currentAffiliate.id).sort((a,b) => b.timestamp - a.timestamp);
        const pendingCashOuts = myCashOuts.filter(co => co.status === CashOutStatus.PendingAffiliateConfirmation);
        const completedCashOuts = myCashOuts.filter(co => co.status === CashOutStatus.Completed);

        return (
            <div className="space-y-6">
                {pendingCashOuts.length > 0 && (
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold text-amber-700 mb-4">Cortes Pendientes de Confirmación</h3>
                        {pendingCashOuts.map(co => (
                            <div key={co.id} className="border p-4 rounded-lg bg-amber-50">
                                <p className="font-semibold">El administrador te ha enviado una transferencia.</p>
                                <p className="text-2xl font-bold text-green-600 my-2">{formatCurrency(Math.abs(co.balance))}</p>
                                <p className="text-xs text-gray-500 mb-3">Fecha: {new Date(co.timestamp).toLocaleString()}</p>
                                {co.adminPaymentReceiptImage && (
                                     <button onClick={() => setPreviewImageUrl(co.adminPaymentReceiptImage!)} className="text-blue-600 underline text-sm mb-4">
                                        Ver Comprobante de Pago
                                     </button>
                                )}
                                <button
                                    onClick={() => handleConfirmCashOut(co.id)}
                                    className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg"
                                >
                                    Confirmar Recepción de Dinero
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div>
                    <h3 className="text-2xl font-bold text-brand-dark mb-4">Historial de Cortes</h3>
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        {completedCashOuts.length > 0 ? (
                            <div className="space-y-2">
                                {completedCashOuts.map(co => (
                                    <AffiliateCashOutHistoryDetail key={co.id} cashOut={co} allOrders={state.orders} commissionRate={state.affiliateCommissionPerTortilla}/>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 p-4 text-center">Aún no tienes cortes de caja completados.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderFinishedOrders = () => {
        const finishedAndUnsettled = stats.finishedOrders.sort((a, b) => b.timestamp - a.timestamp);
        return (
            <div>
                 <div className="bg-white p-4 rounded-xl shadow-md">
                    <h3 className="text-2xl font-bold mb-4">Ventas Finalizadas</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Aquí se muestran todas tus ventas finalizadas desde tu último corte de caja. Estos son los pedidos que se usarán para calcular tu próximo balance.
                    </p>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {finishedAndUnsettled.length > 0 ? (
                            finishedAndUnsettled.map(order => 
                                <OrderHistoryItem 
                                    key={order.id} 
                                    order={order} 
                                    commissionRate={state.affiliateCommissionPerTortilla}
                                    tortillaPrice={state.tortillaPrice}
                                />
                            )
                        ) : (
                            <p className="text-gray-500 text-center py-4">No tienes ventas finalizadas desde tu último corte.</p>
                        )}
                    </div>
                </div>
            </div>
        )
    };

    const renderInventory = () => (
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-2xl font-bold text-brand-dark mb-2">Solicitar Inventario</h3>
                 <p className="text-sm text-gray-500 mb-4">
                    Tu inventario actual es: <strong className="text-brand-dark">{currentAffiliateData.inventory} tortillas</strong>.
                </p>
                 <form onSubmit={handleRequestInventory} className="flex gap-2">
                    <input 
                        type="number" 
                        value={requestAmount}
                        onChange={e => setRequestAmount(e.target.value.replace(/\D/g, ''))}
                        className="flex-grow p-2 border rounded-md"
                        placeholder="Cantidad a solicitar"
                        min="1"
                        required
                    />
                    <button type="submit" className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg">Solicitar</button>
                 </form>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-4">Historial y Estado de Inventario</h3>
                <div className="space-y-3">
                    {inventoryChanges.length > 0 ? inventoryChanges.map(change => {
                        const isUrgentLowInventoryRequest = lowInventoryOrders.length > 0 &&
                                                        change.status === InventoryChangeStatus.Pending &&
                                                        (Date.now() - change.timestamp) > 5 * 60 * 1000;
                        return (
                        <div key={change.id} className="border p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div>
                                <p className={`font-bold ${change.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {change.amount > 0 ? `+${change.amount}` : change.amount} tortillas
                                </p>
                                <p className="text-xs text-gray-400">{new Date(change.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold self-center sm:self-auto ${getStatusClass(change.status)}`}>{change.status}</span>
                                {change.status === InventoryChangeStatus.Approved && (
                                    <button 
                                        onClick={() => handleConfirmInventoryChange(change)}
                                        className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold"
                                    >
                                        Confirmar Recibido
                                    </button>
                                )}
                                {isUrgentLowInventoryRequest && (
                                    <button
                                        onClick={() => handleNotifyAdminForInventory(change.amount)}
                                        className="mt-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded-lg text-xs flex items-center justify-center gap-1 w-full"
                                    >
                                        <WhatsAppIcon className="w-3 h-3" />
                                        Notificar Admin por Retraso
                                    </button>
                                )}
                                 {change.status === InventoryChangeStatus.Pending && (
                                    <button 
                                        onClick={() => handleCancelRequest(change.id)}
                                        className="bg-gray-400 text-white px-3 py-1 rounded text-sm font-semibold text-xs"
                                    >
                                        Cancelar Solicitud
                                    </button>
                                )}
                            </div>
                        </div>
                    )}) : <p className="text-gray-500 text-center py-4">No hay movimientos de inventario.</p>}
                </div>
            </div>
        </div>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return renderDashboard();
            case 'orders': return renderActiveOrders();
            case 'history': return renderFinishedOrders();
            case 'cashouts': return renderCashOuts();
            case 'inventory': return renderInventory();
            case 'settings': return renderSettings();
            default: return renderDashboard();
        }
    };
    
    const NavTabButton: React.FC<{ tabName: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ tabName, icon, children }) => (
        <button 
            onClick={() => setActiveTab(tabName)} 
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors font-semibold text-xs sm:text-sm w-full text-center ${activeTab === tabName ? 'bg-brand-secondary text-white shadow-md' : 'text-gray-700 hover:bg-brand-light'}`}
        >
            {icon}
            <span>{children}</span>
        </button>
    );

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
             {state.successMessage && <div className="mb-4 bg-green-100 text-green-700 p-3 rounded-md shadow-sm animate-fade-in">{state.successMessage}</div>}
             <nav className="mb-8">
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                     <NavTabButton tabName="dashboard" icon={<ChartBarIcon className="w-5 h-5"/>}>Dashboard</NavTabButton>
                     <NavTabButton tabName="orders" icon={<ClipboardDocumentListIcon className="w-5 h-5"/>}>Pedidos</NavTabButton>
                     <NavTabButton tabName="history" icon={<ArchiveBoxIcon className="w-5 h-5"/>}>Ventas</NavTabButton>
                     <NavTabButton tabName="cashouts" icon={<CurrencyDollarIcon className="w-5 h-5"/>}>Cortes de Caja</NavTabButton>
                     <NavTabButton tabName="inventory" icon={<StoreIcon className="w-5 h-5"/>}>Inventario</NavTabButton>
                     <NavTabButton tabName="settings" icon={<CogIcon className="w-5 h-5"/>}>Ajustes</NavTabButton>
                </div>
            </nav>
            <main>{renderContent()}</main>
            <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
        </div>
    );
};

export default AffiliateView;