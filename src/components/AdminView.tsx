import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { AppState, Order, Affiliate, InventoryChange, OrderStatus, AffiliateStatus, InventoryChangeStatus, Referral, Coupon, ReferralStatus, PaymentMethod, TabVisibility, CashOut, CashOutStatus } from '../types';
import StatCard from './StatCard';
import CashIcon from './icons/CashIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import StoreIcon from './icons/StoreIcon';
import CogIcon from './icons/CogIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import ClockIcon from './icons/ClockIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import { generateUniqueCouponCode, downloadCSV } from '../utils';
import WhatsAppIcon from './icons/WhatsAppIcon';
import GiftIcon from './icons/GiftIcon';
import KeyIcon from './icons/KeyIcon';
import TicketIcon from './icons/TicketIcon';
import ImagePreviewModal from './ImagePreviewModal';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';

// --- Helper Functions and Components ---

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });


const getStatusClass = (status: OrderStatus | AffiliateStatus | InventoryChangeStatus | ReferralStatus | CashOutStatus) => {
    switch (status) {
        case OrderStatus.Active: return 'bg-blue-100 text-blue-800';
        case OrderStatus.Finished: return 'bg-green-100 text-green-800';
        case OrderStatus.Cancelled: return 'bg-red-100 text-red-800';
        case OrderStatus.PendingConfirmation: return 'bg-yellow-100 text-yellow-800';
        case AffiliateStatus.Pending: return 'bg-yellow-100 text-yellow-800';
        case AffiliateStatus.Approved: return 'bg-green-100 text-green-800';
        case AffiliateStatus.Rejected: return 'bg-red-100 text-red-800';
        case AffiliateStatus.Suspended: return 'bg-gray-200 text-gray-700';
        case InventoryChangeStatus.Pending: return 'bg-yellow-100 text-yellow-800';
        case InventoryChangeStatus.Approved: return 'bg-blue-100 text-blue-800';
        case InventoryChangeStatus.Completed: return 'bg-green-100 text-green-800';
        case InventoryChangeStatus.Rejected: return 'bg-red-100 text-red-800';
        case ReferralStatus.ActiveOrder: return 'bg-blue-100 text-blue-800';
        case ReferralStatus.Completed: return 'bg-green-100 text-green-800';
        case ReferralStatus.Cancelled: return 'bg-red-100 text-red-800';
        case CashOutStatus.PendingAffiliateConfirmation: return 'bg-yellow-100 text-yellow-800';
        case CashOutStatus.Completed: return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

// --- View Components ---

const DashboardView: React.FC<{ 
    stats: any, 
    onTabChange: (tab: string) => void,
    dateRange: { start: string | null, end: string | null },
    setDateRange: React.Dispatch<React.SetStateAction<{ start: string | null, end: string | null }>>
}> = ({ stats, onTabChange, dateRange, setDateRange }) => (
    <div className="animate-fade-in space-y-6">
        <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-brand-dark mb-3">Filtrar Dashboard por Fecha</h3>
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <input 
                    type="date" 
                    value={dateRange.start || ''}
                    onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="p-2 border rounded-md shadow-sm w-full sm:w-auto"
                />
                <span className="text-gray-500 font-semibold">hasta</span>
                 <input 
                    type="date" 
                    value={dateRange.end || ''}
                    onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="p-2 border rounded-md shadow-sm w-full sm:w-auto"
                />
                <button 
                    onClick={() => setDateRange({ start: null, end: null })}
                    className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg"
                >
                    Limpiar
                </button>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Ventas Totales" value={formatCurrency(stats.totalSales)} icon={<CashIcon className="w-8 h-8"/>} />
            <StatCard title="Pedidos Totales" value={stats.totalOrders} icon={<ClipboardDocumentListIcon className="w-8 h-8"/>} />
            <StatCard title="Total de Vendedores" value={stats.totalAffiliates} icon={<UserGroupIcon className="w-8 h-8"/>} />
            <StatCard title="Tortillas Vendidas" value={stats.totalTortillasSold} icon={<StoreIcon className="w-8 h-8"/>} />
        </div>
        {stats.urgentInventoryAffiliatesCount > 0 &&
            <div onClick={() => onTabChange('vendors')} className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm cursor-pointer hover:bg-red-200 transition-colors">
                <p><span className="font-bold">{stats.urgentInventoryAffiliatesCount}</span> vendedor(es) necesita(n) inventario urgente por pedidos que exceden su stock.</p>
            </div>
        }
        {stats.pendingInventoryRequests > 0 &&
            <div onClick={() => onTabChange('vendors')} className="bg-sky-100 border-l-4 border-sky-500 text-sky-700 p-4 rounded-md shadow-sm cursor-pointer hover:bg-sky-200 transition-colors">
                <p><span className="font-bold">{stats.pendingInventoryRequests}</span> solicitud(es) de inventario esperando aprobación.</p>
            </div>
        }
        {stats.pendingAffiliates > 0 && 
            <div onClick={() => onTabChange('vendors')} className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-sm cursor-pointer hover:bg-yellow-200 transition-colors">
                <p><span className="font-bold">{stats.pendingAffiliates}</span> vendedor(es) esperando aprobación.</p>
            </div>
        }
        {stats.pendingTransfers > 0 && 
            <div onClick={() => onTabChange('orders')} className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md shadow-sm cursor-pointer hover:bg-amber-200 transition-colors">
                <p><span className="font-bold">{stats.pendingTransfers}</span> pedido(s) por transferencia esperando confirmación de pago.</p>
            </div>
        }
    </div>
);

const ReportsView: React.FC<{ state: AppState }> = ({ state }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const finishedOrders = useMemo(() => 
        state.orders.filter(o => o.status === OrderStatus.Finished),
    [state.orders]);

    const availableYears = useMemo(() => 
        // FIX: Explicitly cast sort parameters to Number to resolve TypeScript error.
        [...new Set(finishedOrders.map(o => new Date(o.timestamp).getFullYear()))].sort((a, b) => Number(b) - Number(a)),
    [finishedOrders]);

    const handleDownloadDailyReport = () => {
        const targetDate = new Date(selectedDate);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

        const dailyOrders = finishedOrders.filter(order => {
            const orderDate = new Date(order.timestamp);
            return orderDate >= startOfDay && orderDate <= endOfDay;
        });

        downloadCSV(dailyOrders, state.affiliateCommissionPerTortilla, `reporte-diario-${selectedDate}.csv`);
    };

    const handleDownloadMonthlyReport = () => {
        const monthlyOrders = finishedOrders.filter(order => {
            const orderDate = new Date(order.timestamp);
            return orderDate.getFullYear() === selectedYear && orderDate.getMonth() === selectedMonth;
        });

        const monthString = String(selectedMonth + 1).padStart(2, '0');
        downloadCSV(monthlyOrders, state.affiliateCommissionPerTortilla, `reporte-mensual-${selectedYear}-${monthString}.csv`);
    };

    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-2xl font-bold text-brand-dark mb-4">Reporte Diario</h3>
                <p className="text-gray-600 mb-4">Selecciona una fecha para descargar el resumen financiero de ese día.</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="p-2 border rounded-md shadow-sm w-full sm:w-auto"
                    />
                    <button 
                        onClick={handleDownloadDailyReport}
                        className="w-full sm:w-auto bg-brand-secondary hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        Descargar Reporte del Día
                    </button>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-2xl font-bold text-brand-dark mb-4">Reporte Mensual</h3>
                <p className="text-gray-600 mb-4">Selecciona un mes y año para descargar el resumen financiero completo.</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="p-2 border rounded-md shadow-sm w-full sm:w-auto">
                        {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
                    </select>
                    <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="p-2 border rounded-md shadow-sm w-full sm:w-auto">
                        {availableYears.length > 0 ? availableYears.map(year => <option key={year} value={year}>{year}</option>) : <option>{new Date().getFullYear()}</option>}
                    </select>
                    <button 
                        onClick={handleDownloadMonthlyReport}
                        className="w-full sm:w-auto bg-brand-secondary hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        Descargar Reporte del Mes
                    </button>
                </div>
            </div>
        </div>
    );
};


const OrdersView: React.FC<{ state: AppState, dispatch: React.Dispatch<any> }> = ({ state, dispatch }) => {
    const [openAffiliate, setOpenAffiliate] = useState<string | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    const pendingConfirmationOrders = useMemo(() => 
        state.orders.filter(o => o.status === OrderStatus.PendingConfirmation).sort((a,b) => a.timestamp - b.timestamp),
    [state.orders]);

    const activeOrdersByAffiliate = useMemo(() => {
        const activeOrders = state.orders.filter(o => o.status === OrderStatus.Active);
        return activeOrders.reduce((acc, order) => {
            const affiliateId = order.affiliateId;
            if (!acc[affiliateId]) {
                acc[affiliateId] = [];
            }
            acc[affiliateId].push(order);
            return acc;
        }, {} as Record<string, Order[]>);
    }, [state.orders]);

    const historicalOrders = state.orders
      .filter(o => (o.status === OrderStatus.Finished || o.status === OrderStatus.Cancelled) && !o.settledInCashOutId)
      .sort((a,b) => b.timestamp - a.timestamp);

    return (
      <div className="space-y-8 animate-fade-in">
        {pendingConfirmationOrders.length > 0 && (
            <div>
                <h3 className="text-2xl font-bold text-amber-700 mb-4">Pedidos Pendientes de Confirmación</h3>
                <div className="bg-white p-4 rounded-xl shadow-md space-y-3">
                    {pendingConfirmationOrders.map(order => (
                        <div key={order.id} className="border p-3 rounded-lg">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <div>
                                    <p className="font-bold text-gray-800">{order.customerName} <span className="text-sm font-normal text-gray-500">({order.phone})</span></p>
                                    <p className="text-sm text-gray-600">Vendedor: <span className="font-semibold">{order.affiliateName}</span></p>
                                    <div className="text-sm text-gray-600">
                                        <p>Total: <span className="font-bold text-brand-secondary">{formatCurrency(order.totalCost + (order.deliveryFeeApplied || 0) - (order.discountApplied || 0))}</span></p>
                                        <p className="text-xs text-gray-500">{order.quantity} tortillas {order.deliveryFeeApplied && order.deliveryFeeApplied > 0 ? `(+ ${formatCurrency(order.deliveryFeeApplied)} envío)` : ''}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => dispatch({ type: 'CONFIRM_TRANSFER_PAYMENT', payload: { orderId: order.id } })}
                                    className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
                                >
                                    Confirmar Pago
                                </button>
                            </div>
                            {order.paymentReceiptImage && (
                                <div className="mt-3 pt-3 border-t">
                                    <h4 className="text-xs font-bold text-gray-600 mb-1">COMPROBANTE:</h4>
                                    <div className="h-48 w-64 bg-gray-100 rounded-md overflow-hidden">
                                        <img 
                                            src={order.paymentReceiptImage} 
                                            alt="Comprobante de pago" 
                                            className="h-full w-full object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setPreviewImageUrl(order.paymentReceiptImage!)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
        <div>
            <h3 className="text-2xl font-bold text-brand-dark mb-4">Pedidos en Curso por Vendedor</h3>
            <div className="space-y-2">
                {Object.keys(activeOrdersByAffiliate).length > 0 ? Object.keys(activeOrdersByAffiliate).map(affiliateId => {
                    const affiliate = state.affiliates.find(a => a.id === affiliateId);
                    const orders = activeOrdersByAffiliate[affiliateId];
                    return (
                        <div key={affiliateId} className="bg-white rounded-xl shadow-md overflow-hidden">
                            <button onClick={() => setOpenAffiliate(openAffiliate === affiliateId ? null : affiliateId)} className="w-full text-left p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100">
                                <span className="font-bold text-brand-dark">{affiliate?.customerName || 'Vendedor Desconocido'} ({orders.length} pedidos)</span>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${openAffiliate === affiliateId ? 'rotate-180' : ''}`} />
                            </button>
                            {openAffiliate === affiliateId && (
                                <div className="p-4 space-y-3">
                                    {orders.map(order => (
                                        <div key={order.id} className="border rounded-lg p-3">
                                            {/* Order details here */}
                                            <p className="font-semibold text-gray-800">{order.customerName}</p>
                                            <p className="text-sm text-gray-500">{order.address}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-gray-700">{order.quantity} tortillas</span>
                                                <span className="font-bold text-brand-dark">{formatCurrency(order.totalCost - (order.discountApplied || 0))}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                }) : <p className="text-gray-500 text-center py-4 bg-white rounded-xl shadow-md">No hay pedidos en curso.</p>}
            </div>
        </div>
        <div>
            <h3 className="text-2xl font-bold text-brand-dark mb-4">Historial de Pedidos (Pendientes de Corte)</h3>
            <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="hidden md:grid grid-cols-5 gap-4 font-bold text-sm text-gray-500 border-b pb-2 mb-2">
                    <span>CLIENTE/VENDEDOR</span>
                    <span>DETALLES</span>
                    <span className="text-center">PEDIDO</span>
                    <span className="text-right">TOTAL</span>
                    <span className="text-center">ESTADO</span>
                </div>
                {historicalOrders.map(order => (
                    <div key={order.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 py-3 border-b text-sm">
                         <div className="md:col-span-1">
                             <p className="font-bold text-brand-dark">{order.customerName}</p>
                             <p className="text-gray-500 text-xs">V: {order.affiliateName || 'N/A'}</p>
                         </div>
                         <div className="md:col-span-1">
                             <p className="text-gray-700">{order.phone}</p>
                             <p className="text-xs text-gray-400">{new Date(order.timestamp).toLocaleString('es-MX')}</p>
                         </div>
                         <div className="text-left md:text-center font-semibold text-brand-dark">
                            <p>{order.quantity} tortillas</p>
                            {order.deliveryFeeApplied && order.deliveryFeeApplied > 0 && (
                                <p className="text-xs text-gray-500 font-normal">(+ {formatCurrency(order.deliveryFeeApplied)} envío)</p>
                            )}
                         </div>
                         <div className="text-left md:text-right font-bold text-brand-secondary">{formatCurrency(order.totalCost + (order.deliveryFeeApplied || 0) - (order.discountApplied || 0))}</div>
                         <div className="text-left md:text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(order.status)}`}>{order.status}</span></div>
                    </div>
                ))}
            </div>
        </div>
        <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
      </div>
    );
};

const AffiliatesView: React.FC<{ state: AppState, dispatch: React.Dispatch<any>, urgentInventoryAffiliateIds: Set<string> }> = ({ state, dispatch, urgentInventoryAffiliateIds }) => {
    const [openAffiliate, setOpenAffiliate] = useState<string | null>(null);
    const [inventoryAmount, setInventoryAmount] = useState<number | string>('');

    const handleInitiateInventoryChange = (affiliateId: string, amount: number) => {
        if (amount === 0 || !inventoryAmount) return;
        const change: InventoryChange = {
            id: `${Date.now()}`,
            affiliateId,
            amount,
            timestamp: Date.now(),
            status: InventoryChangeStatus.Approved, // Admin changes go straight to Approved
        };
        dispatch({ type: 'ADD_INVENTORY_CHANGE', payload: change });
        dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: 'Ajuste de inventario enviado para confirmación del vendedor.' });
        setInventoryAmount('');
    };
    
    const handleResolveRequest = (changeId: string, status: InventoryChangeStatus.Approved | InventoryChangeStatus.Rejected) => {
        dispatch({ type: 'RESOLVE_INVENTORY_CHANGE', payload: { changeId, status } });
    };

    const getAffiliateStats = (affiliateId: string) => {
        const finishedOrders = state.orders.filter(o => 
            o.affiliateId === affiliateId && 
            o.status === OrderStatus.Finished &&
            !o.settledInCashOutId
        );

        // Display values
        const totalSales = finishedOrders.reduce((sum, o) => sum + o.totalCost + (o.deliveryFeeApplied || 0) - (o.discountApplied || 0), 0);
        const cashOrders = finishedOrders.filter(o => o.paymentMethod === PaymentMethod.Cash);
        const cashSales = cashOrders.reduce((sum, o) => sum + o.totalCost + (o.deliveryFeeApplied || 0) - (o.discountApplied || 0), 0);
        const transferSales = totalSales - cashSales;
        const commission = finishedOrders.reduce((sum, o) => sum + (o.quantity * state.affiliateCommissionPerTortilla) / 100, 0);

        // Correct Balance Calculation
        let balance = 0;
        finishedOrders.forEach(order => {
            const orderCommission = (order.quantity * state.affiliateCommissionPerTortilla) / 100;
            if (order.paymentMethod === PaymentMethod.Cash) {
                // Affiliate owes admin the subtotal minus their commission
                balance += (order.totalCost - (order.discountApplied || 0)) - orderCommission;
            } else { // Transfer
                // Admin owes affiliate their commission plus any delivery fee
                balance -= orderCommission + (order.deliveryFeeApplied || 0);
            }
        });
        
        return { totalSales, cashSales, transferSales, commission, balance, finishedOrders };
    };

    const handleStatusChange = (affiliateId: string, status: AffiliateStatus) => {
        dispatch({ type: 'UPDATE_AFFILIATE_STATUS', payload: { affiliateId, status } });
    };

    const sortedAffiliates = useMemo(() => {
        return state.affiliates
            .filter(a => a.status !== AffiliateStatus.Pending)
            .slice() // Create a shallow copy to avoid mutating state directly
            .sort((a, b) => {
                const aIsUrgent = urgentInventoryAffiliateIds.has(a.id);
                const bIsUrgent = urgentInventoryAffiliateIds.has(b.id);
                if (aIsUrgent && !bIsUrgent) return -1;
                if (!aIsUrgent && bIsUrgent) return 1;
                
                const aHasPending = state.inventoryChanges.some(c => c.affiliateId === a.id && c.status === InventoryChangeStatus.Pending);
                const bHasPending = state.inventoryChanges.some(c => c.affiliateId === b.id && c.status === InventoryChangeStatus.Pending);
                if (aHasPending && !bHasPending) return -1;
                if (!aHasPending && bHasPending) return 1;
                return a.customerName.localeCompare(b.customerName);
            });
    }, [state.affiliates, state.inventoryChanges, urgentInventoryAffiliateIds]);


    return (
        <div className="space-y-6 animate-fade-in">
             <div>
                <h3 className="text-2xl font-bold text-brand-dark mb-4">Solicitudes Pendientes</h3>
                <div className="bg-white p-4 rounded-xl shadow-md space-y-3">
                    {state.affiliates.filter(a => a.status === AffiliateStatus.Pending).length > 0 ? state.affiliates.filter(a => a.status === AffiliateStatus.Pending).map(affiliate => (
                        <div key={affiliate.id} className="border p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-gray-800">{affiliate.customerName}</p>
                                <p className="text-sm text-gray-500">{affiliate.phone}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleStatusChange(affiliate.id, AffiliateStatus.Approved)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-semibold">Aprobar</button>
                                <button onClick={() => handleStatusChange(affiliate.id, AffiliateStatus.Rejected)} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-sm font-semibold">Rechazar</button>
                            </div>
                        </div>
                    )) : <p className="text-gray-500">No hay solicitudes pendientes.</p>}
                </div>
            </div>
            <div>
                <h3 className="text-2xl font-bold text-brand-dark mb-4">Vendedores</h3>
                <div className="space-y-2">
                    {sortedAffiliates.map(affiliate => {
                        const stats = getAffiliateStats(affiliate.id);
                        const pendingChanges = state.inventoryChanges.filter(c => c.affiliateId === affiliate.id && c.status === InventoryChangeStatus.Pending);
                        const isUrgent = urgentInventoryAffiliateIds.has(affiliate.id);
                        return (
                             <div key={affiliate.id} className={`bg-white rounded-xl shadow-md overflow-hidden ${isUrgent ? 'border-2 border-red-500' : ''}`}>
                                <button onClick={() => setOpenAffiliate(openAffiliate === affiliate.id ? null : affiliate.id)} className="w-full text-left p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100">
                                    <div>
                                        <p className="font-bold text-brand-dark">
                                            {affiliate.customerName}
                                        </p>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            Inv: {affiliate.inventory}
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusClass(affiliate.status)}`}>{affiliate.status}</span>
                                        </p>
                                        {isUrgent && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                    <ExclamationTriangleIcon className="w-4 h-4" />
                                                    Inventario Urgente
                                                </span>
                                            </div>
                                        )}
                                        {pendingChanges.length > 0 && !isUrgent && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                    <ClockIcon className="w-4 h-4" />
                                                    Solicitud de Inventario
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${openAffiliate === affiliate.id ? 'rotate-180' : ''}`} />
                                </button>
                                {openAffiliate === affiliate.id && (
                                    <div className="p-4 space-y-4">
                                        {/* Pending Inventory Requests */}
                                        {pendingChanges.length > 0 && 
                                            <div className="border-b pb-4 border-blue-200 bg-blue-50 p-3 rounded-lg">
                                                <h4 className="font-semibold text-blue-800 mb-2">Solicitudes de Inventario Pendientes</h4>
                                                {pendingChanges.map(c => 
                                                    <div key={c.id} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                                                        <span className={`font-bold text-blue-800`}>
                                                            {c.amount > 0 ? `+${c.amount}` : c.amount} tortillas
                                                        </span>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleResolveRequest(c.id, InventoryChangeStatus.Approved)} className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold">Aprobar</button>
                                                            <button onClick={() => handleResolveRequest(c.id, InventoryChangeStatus.Rejected)} className="bg-red-500 text-white px-3 py-1 rounded text-sm font-semibold">Rechazar</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        }
                                        {/* Status Management */}
                                        <div className="border-b pb-4">
                                            <h4 className="font-semibold text-gray-700 mb-2">Gestionar Estado</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {affiliate.status === AffiliateStatus.Approved && (
                                                    <button onClick={() => handleStatusChange(affiliate.id, AffiliateStatus.Suspended)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm font-semibold">Suspender</button>
                                                )}
                                                {affiliate.status === AffiliateStatus.Suspended && (
                                                    <button onClick={() => handleStatusChange(affiliate.id, AffiliateStatus.Approved)} className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold">Reactivar</button>
                                                )}
                                                {affiliate.status === AffiliateStatus.Rejected && (
                                                     <button onClick={() => handleStatusChange(affiliate.id, AffiliateStatus.Approved)} className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold">Aprobar</button>
                                                )}
                                            </div>
                                        </div>
                                        {/* Financial Summary */}
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2">Resumen Financiero (Pendiente de Corte)</h4>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="bg-gray-100 p-2 rounded-md"><strong className="text-gray-600">Ventas Totales:</strong> <span className="font-semibold text-brand-dark">{formatCurrency(stats.totalSales)}</span></div>
                                                <div className="bg-green-100 p-2 rounded-md"><strong className="text-green-800">Comisión Ganada:</strong> <span className="font-semibold text-green-800">{formatCurrency(stats.commission)}</span></div>
                                                <div className="bg-gray-100 p-2 rounded-md"><strong className="text-gray-600">Efectivo Cobrado:</strong> <span className="font-semibold text-brand-dark">{formatCurrency(stats.cashSales)}</span></div>
                                                <div className="bg-gray-100 p-2 rounded-md"><strong className="text-gray-600">Por Transferencia:</strong> <span className="font-semibold text-brand-dark">{formatCurrency(stats.transferSales)}</span></div>
                                            </div>
                                            {stats.balance >= 0 ? (
                                                <div className="mt-3 bg-blue-100 p-3 rounded-lg text-center"><strong className="text-blue-800">Saldo a Cobrar (Corte):</strong> <span className="font-bold text-lg text-blue-800">{formatCurrency(stats.balance)}</span></div>
                                            ) : (
                                                 <div className="mt-3 bg-red-100 p-3 rounded-lg text-center"><strong className="text-red-800">Transferencia a Realizar (Corte):</strong> <span className="font-bold text-lg text-red-800">{formatCurrency(Math.abs(stats.balance))}</span></div>
                                            )}
                                        </div>
                                        {/* Inventory Management */}
                                        <div className="border-t pt-4">
                                            <h4 className="font-semibold text-gray-700 mb-2">Ajuste Manual de Inventario</h4>
                                            <div className="flex gap-2 items-center">
                                                <input type="number" value={inventoryAmount} onChange={e => setInventoryAmount(e.target.value)} className="flex-grow p-2 border rounded-md" placeholder="Cantidad" />
                                                <button onClick={() => handleInitiateInventoryChange(affiliate.id, Math.abs(Number(inventoryAmount)))} className="bg-green-500 text-white px-3 py-2 rounded-md text-sm font-semibold">Añadir</button>
                                                <button onClick={() => handleInitiateInventoryChange(affiliate.id, -Math.abs(Number(inventoryAmount)))} className="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-semibold">Retirar</button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Este cambio requerirá confirmación del vendedor.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

const ReferralsView: React.FC<{ state: AppState, dispatch: React.Dispatch<any> }> = ({ state, dispatch }) => {
    const handleNotifyAndSendCoupon = (referral: Referral) => {
        const couponCode = generateUniqueCouponCode();
        dispatch({ type: 'COMPLETE_REFERRAL', payload: { referralId: referral.id, couponCode } });
        const message = `¡Felicidades, ${referral.referrerName}! 🎉\n\nTu referido ${referral.refereeName} ha completado su pedido. ¡Has ganado un cupón para 10 tortillas gratis!\n\nUsa este código en tu próxima compra:\n*${couponCode}*`;
        const whatsappUrl = `https://wa.me/52${referral.referrerPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };
    return (
        <div className="bg-white p-6 rounded-xl shadow-md animate-fade-in">
             <h3 className="text-2xl font-bold text-brand-dark mb-4">Gestión de Referidos</h3>
             <div className="space-y-3">
                 {state.referrals.length > 0 ? state.referrals.map(ref => {
                     const refereeOrder = state.orders.find(o => o.id === ref.refereeOrderId);
                     const isReadyToReward = refereeOrder && refereeOrder.status === OrderStatus.Finished && ref.status === ReferralStatus.ActiveOrder;

                     return (
                         <div key={ref.id} className="border p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div className="text-sm text-gray-800">
                                    <p><span className="font-bold text-brand-dark">{ref.referrerName}</span> (<span className="text-gray-600">{ref.referrerPhone}</span>)</p>
                                    <p className="my-1">refirió a</p>
                                    <p><span className="font-bold text-brand-dark">{ref.refereeName}</span> (<span className="text-gray-600">{ref.refereePhone}</span>)</p>
                                    <p className="text-xs text-gray-400 mt-2">{new Date(ref.timestamp).toLocaleString()}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold self-center ${getStatusClass(ref.status)}`}>{ref.status}</span>
                            </div>
                            {isReadyToReward && (
                                <div className="flex justify-end mt-2">
                                    <button onClick={() => handleNotifyAndSendCoupon(ref)} className="bg-green-500 text-white px-3 py-1 rounded text-sm font-semibold flex items-center gap-1"><WhatsAppIcon className="w-4 h-4" /> Notificar y Enviar Cupón</button>
                                </div>
                            )}
                         </div>
                     );
                 }) : <p className="text-gray-500">No hay referidos registrados.</p>}
             </div>
        </div>
    );
};

const CouponsView: React.FC<{ state: AppState, dispatch: React.Dispatch<any> }> = ({ state, dispatch }) => {
    const handleToggleCouponStatus = (couponCode: string) => {
        dispatch({ type: 'TOGGLE_COUPON_STATUS', payload: { couponCode } });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md animate-fade-in">
            <h3 className="text-2xl font-bold text-brand-dark mb-4">Cupones Generados</h3>
            <div className="space-y-3">
                {state.coupons.length > 0 ? state.coupons.map(coupon => (
                    <div key={coupon.code} className={`border p-3 rounded-lg flex justify-between items-center transition-colors ${
                        !coupon.isActive ? 'bg-gray-200 text-gray-500' : 
                        coupon.isUsed ? 'bg-gray-100 text-gray-400' : 'bg-white'
                    }`}>
                        <div className="flex items-center gap-4">
                             <span className={`font-mono font-semibold ${!coupon.isActive ? '' : !coupon.isUsed ? 'text-brand-dark' : ''}`}>{coupon.code}</span>
                             <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                !coupon.isActive ? 'bg-gray-400 text-white' : 
                                coupon.isUsed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                             }`}>
                                {!coupon.isActive ? 'Desactivado' : coupon.isUsed ? 'Usado' : 'Activo'}
                            </span>
                        </div>
                        {!coupon.isUsed && (
                            <button 
                                onClick={() => handleToggleCouponStatus(coupon.code)}
                                className={`px-3 py-1 rounded text-sm font-semibold text-white transition-colors ${
                                    coupon.isActive 
                                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                                    : 'bg-green-500 hover:bg-green-600'
                                }`}
                                aria-label={`Cambiar estado del cupón ${coupon.code}`}
                            >
                                {coupon.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                        )}
                    </div>
                )) : <p className="text-gray-500">No se han generado cupones.</p>}
            </div>
        </div>
    );
};


const DeleteAffiliateModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    affiliates: Affiliate[];
    onConfirm: (affiliateId: string) => void;
}> = ({ isOpen, onClose, affiliates, onConfirm }) => {
    const [selectedAffiliateId, setSelectedAffiliateId] = useState('');
    const [confirmationText, setConfirmationText] = useState('');

    const selectedAffiliate = useMemo(() => 
        affiliates.find(a => a.id === selectedAffiliateId), 
    [affiliates, selectedAffiliateId]);

    const isConfirmed = selectedAffiliate ? confirmationText === selectedAffiliate.customerName : false;

    const handleConfirm = () => {
        if (isConfirmed) {
            onConfirm(selectedAffiliateId);
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedAffiliateId('');
        setConfirmationText('');
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-xl font-bold text-red-800">Eliminar Vendedor Permanentemente</h3>
                <p className="text-gray-600 mt-2">Esta acción es irreversible y eliminará al vendedor de la plataforma.</p>
                <div className="my-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">1. Selecciona el vendedor</label>
                        <select 
                            value={selectedAffiliateId} 
                            onChange={e => setSelectedAffiliateId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        >
                             <option value="">-- Por favor selecciona --</option>
                             {affiliates.map(a => <option key={a.id} value={a.id}>{a.customerName}</option>)}
                        </select>
                    </div>
                    {selectedAffiliate && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                2. Para confirmar, escribe "<strong className="text-red-700">{selectedAffiliate.customerName}</strong>"
                            </label>
                            <input 
                                type="text"
                                value={confirmationText}
                                onChange={e => setConfirmationText(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={handleClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold">Cancelar</button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!isConfirmed}
                        className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                        Eliminar Permanentemente
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteCouponModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    coupons: Coupon[];
    onConfirm: (couponCode: string) => void;
}> = ({ isOpen, onClose, coupons, onConfirm }) => {
    const [selectedCouponCode, setSelectedCouponCode] = useState('');
    const [confirmationText, setConfirmationText] = useState('');

    const isConfirmed = selectedCouponCode ? confirmationText === selectedCouponCode : false;

    const handleConfirm = () => {
        if (isConfirmed) {
            onConfirm(selectedCouponCode);
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedCouponCode('');
        setConfirmationText('');
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-xl font-bold text-red-800">Eliminar Cupón Permanentemente</h3>
                <p className="text-gray-600 mt-2">Esta acción es irreversible y eliminará el cupón del sistema.</p>
                <div className="my-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">1. Selecciona el cupón</label>
                        <select 
                            value={selectedCouponCode} 
                            onChange={e => setSelectedCouponCode(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm font-mono"
                        >
                             <option value="">-- Por favor selecciona --</option>
                             {coupons.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                    </div>
                    {selectedCouponCode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                2. Para confirmar, escribe "<strong className="text-red-700 font-mono">{selectedCouponCode}</strong>"
                            </label>
                            <input 
                                type="text"
                                value={confirmationText}
                                onChange={e => setConfirmationText(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm font-mono"
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={handleClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold">Cancelar</button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!isConfirmed}
                        className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                        Eliminar Permanentemente
                    </button>
                </div>
            </div>
        </div>
    );
};


const ManagementView: React.FC<{
    state: AppState,
    dispatch: React.Dispatch<any>
}> = ({ state, dispatch }) => {
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleteCouponModalOpen, setDeleteCouponModalOpen] = useState(false);
    
    const handleDeleteConfirm = (affiliateId: string) => {
        dispatch({ type: 'DELETE_AFFILIATE', payload: { affiliateId } });
    };

    const handleDeleteCouponConfirm = (couponCode: string) => {
        dispatch({ type: 'DELETE_COUPON', payload: { couponCode } });
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-md animate-fade-in">
             <h3 className="text-2xl font-bold text-brand-dark mb-4">Gestión Avanzada</h3>
             <div className="border p-4 rounded-lg bg-red-50 border-red-200">
                 <h4 className="font-bold text-red-800">Acciones Peligrosas</h4>
                 <p className="text-sm text-gray-600 my-2">Estas acciones son irreversibles y deben usarse con cuidado.</p>
                 <div className="mt-4 flex flex-wrap gap-4">
                     <button 
                        onClick={() => setDeleteModalOpen(true)} 
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold"
                    >
                        Eliminar un Vendedor...
                    </button>
                    <button 
                        onClick={() => setDeleteCouponModalOpen(true)} 
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold"
                    >
                        Eliminar un Cupón...
                    </button>
                 </div>
             </div>
             <DeleteAffiliateModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                affiliates={state.affiliates.filter(a => a.status === AffiliateStatus.Approved)}
                onConfirm={handleDeleteConfirm}
             />
             <DeleteCouponModal 
                isOpen={isDeleteCouponModalOpen}
                onClose={() => setDeleteCouponModalOpen(false)}
                coupons={state.coupons}
                onConfirm={handleDeleteCouponConfirm}
             />
        </div>
    );
};

const SettingsView: React.FC<{ state: AppState, dispatch: React.Dispatch<any> }> = ({ state, dispatch }) => {
    const [settings, setSettings] = useState({
        adminPassword: state.adminPassword,
        adminPhoneNumber: state.adminPhoneNumber,
        bankDetails: state.bankDetails,
        affiliateCommissionPerTortilla: state.affiliateCommissionPerTortilla,
        publicAppUrl: state.publicAppUrl || '',
        tortillaPrice: state.tortillaPrice,
        tabVisibility: state.tabVisibility || { referrals: true, affiliates: true, coupons: true },
    });
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    useEffect(() => {
        setSettings({
            adminPassword: state.adminPassword,
            adminPhoneNumber: state.adminPhoneNumber,
            bankDetails: state.bankDetails,
            affiliateCommissionPerTortilla: state.affiliateCommissionPerTortilla,
            publicAppUrl: state.publicAppUrl || '',
            tortillaPrice: state.tortillaPrice,
            tabVisibility: state.tabVisibility || { referrals: true, affiliates: true, coupons: true },
        });
    }, [state.adminPassword, state.adminPhoneNumber, state.bankDetails, state.affiliateCommissionPerTortilla, state.publicAppUrl, state.tortillaPrice, state.tabVisibility]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: (name === 'affiliateCommissionPerTortilla' || name === 'tortillaPrice') ? Number(value) : value }));
    };

    const handleTabVisibilityChange = (tab: keyof TabVisibility) => {
        setSettings(prev => ({
            ...prev,
            tabVisibility: {
                ...prev.tabVisibility,
                [tab]: !prev.tabVisibility[tab],
            },
        }));
    };

    const handleSaveSettings = () => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
    };

    const handleDownloadBackup = () => {
        const stateToSave = JSON.stringify(state, null, 2);
        const blob = new Blob([stateToSave], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tortilleria-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: 'Copia de seguridad descargada.' });
    };

    const handleLoadBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const loadedState = JSON.parse(e.target?.result as string);
                    dispatch({ type: 'LOAD_STATE', payload: loadedState });
                } catch (error) {
                    console.error("Failed to load backup", error);
                }
            };
            reader.readAsText(file);
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-md animate-fade-in space-y-8">
            <div>
                <h3 className="text-2xl font-bold text-brand-dark mb-4">Ajustes Generales y de Visibilidad</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña de Administrador</label>
                        <input type="password" name="adminPassword" value={settings.adminPassword} onChange={handleSettingsChange} className="w-full p-2 border rounded-md" />
                    </div>
                     <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Teléfono del Admin (para notificaciones de WhatsApp)</label>
                        <input 
                            type="tel" 
                            name="adminPhoneNumber" 
                            value={settings.adminPhoneNumber} 
                            onChange={e => setSettings({...settings, adminPhoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                            className="w-full p-2 border rounded-md" 
                            placeholder="10 dígitos"
                        />
                    </div>
                     <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Precio por Tortilla (MXN)</label>
                        <input type="number" step="0.5" name="tortillaPrice" value={settings.tortillaPrice} onChange={handleSettingsChange} className="w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Comisión por Tortilla (centavos)</label>
                        <input type="number" name="affiliateCommissionPerTortilla" value={settings.affiliateCommissionPerTortilla} onChange={handleSettingsChange} className="w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">URL Pública de la App</label>
                        <input type="url" name="publicAppUrl" value={settings.publicAppUrl} onChange={handleSettingsChange} className="w-full p-2 border rounded-md" placeholder="https://ejemplo.com/app" />
                        <p className="text-xs text-gray-500 mt-1">Esta es la URL que se compartirá en los mensajes de referido.</p>
                    </div>
                     <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Datos Bancarios (Para clientes)</label>
                        <textarea name="bankDetails" value={settings.bankDetails} onChange={handleSettingsChange} rows={4} className="w-full p-2 border rounded-md"></textarea>
                    </div>
                </div>
                
                <div className="pt-6 border-t">
                    <h4 className="text-lg font-bold text-brand-dark mb-3">Visibilidad de Pestañas</h4>
                     <p className="text-sm text-gray-500 mb-4">Controla qué pestañas ven los clientes. La pestaña de "Hacer Pedido" siempre está visible.</p>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <p className="font-semibold text-gray-800">Pestaña "Gana Gratis" (Referidos)</p>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.tabVisibility.referrals} onChange={() => handleTabVisibilityChange('referrals')} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-brand-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-secondary"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <p className="font-semibold text-gray-800">Pestaña "Gana Dinero" (Vendedores)</p>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.tabVisibility.affiliates} onChange={() => handleTabVisibilityChange('affiliates')} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-brand-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-secondary"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <p className="font-semibold text-gray-800">Pestaña "Mis Cupones"</p>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.tabVisibility.coupons} onChange={() => handleTabVisibilityChange('coupons')} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-brand-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-secondary"></div>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="pt-6 border-t">
                    {showSaveSuccess && (
                        <div className="mb-4 bg-green-100 text-green-700 p-3 rounded-md text-center font-semibold animate-fade-in">
                            ¡Ajustes guardados exitosamente!
                        </div>
                    )}
                    <button onClick={handleSaveSettings} className="w-full bg-brand-secondary hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        Guardar Ajustes
                    </button>
                </div>
            </div>
             <div>
                <h3 className="text-2xl font-bold text-brand-dark mb-4">Copia de Seguridad y Restauración</h3>
                <div className="flex gap-4">
                    <button onClick={handleDownloadBackup} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md font-semibold flex items-center justify-center gap-2"><ArrowDownTrayIcon className="w-5 h-5"/>Descargar Copia</button>
                    <label className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md font-semibold cursor-pointer flex items-center justify-center gap-2">
                        <ArrowUpTrayIcon className="w-5 h-5"/>
                        Cargar Copia
                        <input type="file" accept=".json" onChange={handleLoadBackup} className="hidden" />
                    </label>
                </div>
            </div>
        </div>
    );
};

const CashOutHistoryDetail: React.FC<{ cashOut: CashOut, allOrders: Order[], commissionRate: number }> = ({ cashOut, allOrders, commissionRate }) => {
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
                    <p className={`font-bold ${cashOut.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(Math.abs(cashOut.balance))}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(cashOut.status)}`}>{cashOut.status}</span>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isExpanded && (
                <div className="p-3 bg-white border-t">
                    <h5 className="font-bold mb-2">Pedidos Incluidos ({coveredOrders.length})</h5>
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
                        <p className="flex justify-between text-sm font-semibold text-green-800">
                            <span>Comisión Total del Vendedor:</span>
                            <span>{formatCurrency(cashOut.totalCommission)}</span>
                        </p>
                        {cashOut.totalDeliveryFees > 0 && (
                            <p className="flex justify-between text-sm font-semibold text-blue-800">
                                <span>Monto Total por Envíos:</span>
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
                                            ADMIN DEBE TRANSFERIR: {formatCurrency(netForAffiliate)}
                                            <span className="block text-xs font-normal opacity-80 mt-1">
                                                ({formatCurrency(commission)} comisión + {formatCurrency(deliveryFee)} envío)
                                            </span>
                                        </>
                                    );
                                }
                                return `ADMIN DEBE TRANSFERIR: ${formatCurrency(netForAffiliate)}`;
                            };

                            return (
                                <div key={order.id} className="text-sm p-3 border-b space-y-1 bg-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-800">{order.customerName}</p>
                                            <p className="text-xs text-gray-500">{new Date(order.timestamp).toLocaleDateString('es-MX')}</p>
                                        </div>
                                        <p className="font-bold text-lg text-brand-dark">{formatCurrency(totalOrderAmount)}</p>
                                    </div>
                                    <div className="pl-4 border-l-2 space-y-1 text-xs">
                                        <p className="flex justify-between"><span>{order.quantity} tortillas:</span> <span>{formatCurrency(order.totalCost)}</span></p>
                                        {(order.discountApplied || 0) > 0 && <p className="flex justify-between text-red-600"><span>Descuento:</span> <span>-{formatCurrency(order.discountApplied!)}</span></p>}
                                        <p className="flex justify-between text-green-700 font-semibold"><span>Comisión Vendedor:</span> <span>{formatCurrency(commission)}</span></p>
                                        {(order.deliveryFeeApplied || 0) > 0 && <p className="flex justify-between"><span>Costo de Envío:</span> <span>{formatCurrency(order.deliveryFeeApplied!)}</span></p>}
                                    </div>
                                    <div className={`mt-2 p-2 rounded text-center font-bold text-xs ${isCash ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'}`}>
                                        {isCash 
                                            ? `VENDEDOR DEBE PAGAR: ${formatCurrency(netForAdmin)}`
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

const CashOutView: React.FC<{ state: AppState, dispatch: React.Dispatch<any> }> = ({ state, dispatch }) => {
    const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [receiptImage, setReceiptImage] = useState<string | null>(null);

    const approvedAffiliates = useMemo(() => state.affiliates.filter(a => a.status === AffiliateStatus.Approved || a.status === AffiliateStatus.Suspended), [state.affiliates]);
    const selectedAffiliate = useMemo(() => approvedAffiliates.find(a => a.id === selectedAffiliateId), [approvedAffiliates, selectedAffiliateId]);

    const { unsettledOrders, balance, totalCommission, totalDeliveryFees } = useMemo(() => {
        if (!selectedAffiliateId) return { unsettledOrders: [], balance: 0, totalCommission: 0, totalDeliveryFees: 0 };

        const unsettledFinishedOrders = state.orders.filter(o => 
            o.affiliateId === selectedAffiliateId &&
            o.status === OrderStatus.Finished &&
            !o.settledInCashOutId
        );

        let calculatedBalance = 0;
        let calculatedCommission = 0;
        let calculatedDeliveryFees = 0;
        unsettledFinishedOrders.forEach(order => {
            const commission = (order.quantity * state.affiliateCommissionPerTortilla) / 100;
            calculatedCommission += commission;
            calculatedDeliveryFees += order.deliveryFeeApplied || 0;
            if (order.paymentMethod === PaymentMethod.Cash) {
                const amountOwedByAffiliate = (order.totalCost - (order.discountApplied || 0)) - commission;
                calculatedBalance += amountOwedByAffiliate;
            } else { // Transfer
                const amountOwedToAffiliate = commission + (order.deliveryFeeApplied || 0);
                calculatedBalance -= amountOwedToAffiliate;
            }
        });
        
        return { unsettledOrders: unsettledFinishedOrders, balance: calculatedBalance, totalCommission: calculatedCommission, totalDeliveryFees: calculatedDeliveryFees };

    }, [selectedAffiliateId, state.orders, state.affiliateCommissionPerTortilla]);

    const handlePerformCashOut = () => {
        if (!selectedAffiliate || unsettledOrders.length === 0) return;

        const isTransferToAffiliate = balance < 0;

        if (isTransferToAffiliate && !receiptImage) {
            alert('Debes adjuntar un comprobante de transferencia.');
            return;
        }

        const totalSales = unsettledOrders.reduce((sum, o) => sum + o.totalCost + (o.deliveryFeeApplied || 0) - (o.discountApplied || 0), 0);
        
        const orderTimestamps = unsettledOrders.map(o => o.timestamp);
        const startDate = orderTimestamps.length > 0 ? Math.min(...orderTimestamps) : Date.now();
        const endDate = orderTimestamps.length > 0 ? Math.max(...orderTimestamps) : Date.now();

        const newCashOut: CashOut = {
            id: `${Date.now()}-${selectedAffiliateId}`,
            affiliateId: selectedAffiliateId,
            timestamp: Date.now(),
            ordersCoveredIds: unsettledOrders.map(o => o.id),
            totalSales,
            totalCommission,
            totalDeliveryFees,
            balance: balance,
            status: isTransferToAffiliate ? CashOutStatus.PendingAffiliateConfirmation : CashOutStatus.Completed,
            adminPaymentReceiptImage: isTransferToAffiliate ? receiptImage! : undefined,
            startDate,
            endDate,
        };

        dispatch({ type: 'PERFORM_CASHOUT', payload: newCashOut });
        setIsModalOpen(false);
        setReceiptImage(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setReceiptImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const cashOutHistory = useMemo(() => {
        if (!selectedAffiliateId) return [];
        return state.cashOuts.filter(co => co.affiliateId === selectedAffiliateId).sort((a,b) => b.timestamp - a.timestamp);
    }, [selectedAffiliateId, state.cashOuts]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-2xl font-bold text-brand-dark mb-4">Realizar Corte de Caja</h3>
                <select 
                    value={selectedAffiliateId} 
                    onChange={e => setSelectedAffiliateId(e.target.value)}
                    className="w-full p-2 border rounded-md shadow-sm"
                >
                    <option value="">-- Selecciona un Vendedor --</option>
                    {approvedAffiliates.map(a => <option key={a.id} value={a.id}>{a.customerName}</option>)}
                </select>
            </div>

            {selectedAffiliateId && (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-md text-center">
                        <p className="text-gray-500">Balance Actual del Vendedor</p>
                        {balance >= 0 ? (
                            <>
                                <p className="text-4xl font-bold text-blue-600">{formatCurrency(balance)}</p>
                                <p className="font-semibold text-blue-800">Saldo a Cobrar</p>
                            </>
                        ) : (
                            <>
                                <p className="text-4xl font-bold text-red-600">{formatCurrency(Math.abs(balance))}</p>
                                <p className="font-semibold text-red-800">Saldo a Transferir</p>
                            </>
                        )}
                        <p className="mt-3 text-sm text-green-700">
                            Ganancia por comisión: <span className="font-bold">{formatCurrency(totalCommission)}</span>
                        </p>
                        {totalDeliveryFees > 0 && (
                            <p className="mt-1 text-sm text-blue-700">
                                Monto por envíos: <span className="font-bold">{formatCurrency(totalDeliveryFees)}</span>
                            </p>
                        )}
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            disabled={unsettledOrders.length === 0}
                            className="mt-4 bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Realizar Corte de Caja
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <h4 className="text-xl font-bold text-brand-dark mb-2">Detalle de Ventas desde el Último Corte ({unsettledOrders.length})</h4>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {unsettledOrders.length > 0 ? unsettledOrders.map(order => {
                                const commission = (order.quantity * state.affiliateCommissionPerTortilla) / 100;
                                const isCash = order.paymentMethod === PaymentMethod.Cash;
                                const totalOrderAmount = order.totalCost + (order.deliveryFeeApplied || 0) - (order.discountApplied || 0);
                                const netForAdmin = (order.totalCost - (order.discountApplied || 0)) - commission;
                                const netForAffiliate = commission + (order.deliveryFeeApplied || 0);

                                const transferMessage = () => {
                                    const deliveryFee = order.deliveryFeeApplied || 0;
                                    if (!isCash && deliveryFee > 0) {
                                        return (
                                            <>
                                                ADMIN DEBE TRANSFERIR: {formatCurrency(netForAffiliate)}
                                                <span className="block text-xs font-normal opacity-80 mt-1">
                                                    ({formatCurrency(commission)} comisión + {formatCurrency(deliveryFee)} envío)
                                                </span>
                                            </>
                                        );
                                    }
                                    return `ADMIN DEBE TRANSFERIR: ${formatCurrency(netForAffiliate)}`;
                                };

                                return (
                                <div key={order.id} className="text-sm p-3 border-b space-y-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-800">{order.customerName}</p>
                                            <p className="text-xs text-gray-500">{new Date(order.timestamp).toLocaleDateString('es-MX')} ({order.paymentMethod})</p>
                                        </div>
                                        <p className="font-bold text-lg text-brand-dark">{formatCurrency(totalOrderAmount)}</p>
                                    </div>
                                    <div className="pl-4 border-l-2 space-y-1 text-xs">
                                        <p className="flex justify-between"><span>{order.quantity} tortillas:</span> <span>{formatCurrency(order.totalCost)}</span></p>
                                        {(order.discountApplied || 0) > 0 && <p className="flex justify-between text-red-600"><span>Descuento:</span> <span>-{formatCurrency(order.discountApplied!)}</span></p>}
                                        <p className="flex justify-between text-green-700 font-semibold"><span>Comisión Vendedor:</span> <span>{formatCurrency(commission)}</span></p>
                                        {(order.deliveryFeeApplied || 0) > 0 && (
                                            <p className="flex justify-between">
                                                <span>Costo de Envío:</span>
                                                <span>{formatCurrency(order.deliveryFeeApplied!)}</span>
                                            </p>
                                        )}
                                    </div>
                                     <div className={`mt-2 p-2 rounded text-center font-bold text-xs ${isCash ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'}`}>
                                        {isCash 
                                            ? `VENDEDOR DEBE PAGAR: ${formatCurrency(netForAdmin)}`
                                            : transferMessage()
                                        }
                                    </div>
                                </div>
                                );
                            }) : <p className="text-gray-500 p-4 text-center">No hay ventas pendientes de corte.</p>}
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <h4 className="text-xl font-bold text-brand-dark mb-2">Historial de Cortes</h4>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {cashOutHistory.length > 0 ? cashOutHistory.map(co => (
                               <CashOutHistoryDetail key={co.id} cashOut={co} allOrders={state.orders} commissionRate={state.affiliateCommissionPerTortilla} />
                            )) : <p className="text-gray-500 p-4 text-center">No hay historial de cortes.</p>}
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && selectedAffiliate && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                     <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
                        <h3 className="text-xl font-bold text-brand-dark mb-4">Confirmar Corte de Caja</h3>
                         {balance < 0 ? (
                             <div>
                                <p className="text-gray-700 mb-2">Vas a transferir <strong className="text-red-600">{formatCurrency(Math.abs(balance))}</strong> a <strong className="text-brand-dark">{selectedAffiliate.customerName}</strong>.</p>
                                <p className="text-sm font-semibold text-gray-800">Datos Bancarios del Vendedor:</p>
                                <pre className="text-sm bg-gray-100 p-3 rounded-md whitespace-pre-wrap text-gray-700">{selectedAffiliate.bankDetails || 'No especificado'}</pre>
                                <div className="mt-4">
                                    <label className="block font-semibold mb-2">Adjuntar Comprobante</label>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm"/>
                                    {receiptImage && <img src={receiptImage} alt="preview" className="mt-2 h-32 object-contain" />}
                                </div>
                             </div>
                         ) : (
                             <p>Confirmas haber recibido <strong className="text-blue-600">{formatCurrency(balance)}</strong> en efectivo de <strong className="text-brand-dark">{selectedAffiliate.customerName}</strong>.</p>
                         )}
                         <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold">Cancelar</button>
                            <button onClick={handlePerformCashOut} className="bg-green-500 text-white px-4 py-2 rounded-md font-semibold">Confirmar</button>
                         </div>
                     </div>
                 </div>
            )}
        </div>
    );
};


const AdminView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isManagementPasswordPromptVisible, setManagementPasswordPromptVisible] = useState(false);
    const [managementPassword, setManagementPassword] = useState('');
    const [managementPasswordError, setManagementPasswordError] = useState('');
    const [dateRange, setDateRange] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });

    useEffect(() => {
        if (state.successMessage) {
            const timer = setTimeout(() => {
                dispatch({ type: 'CLEAR_SUCCESS_MESSAGE' });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [state.successMessage, dispatch]);

    const stats = useMemo(() => {
        let filteredOrders = state.orders;
        if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            filteredOrders = filteredOrders.filter(o => new Date(o.timestamp) >= startDate);
        }
        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            filteredOrders = filteredOrders.filter(o => new Date(o.timestamp) <= endDate);
        }

        const finishedOrders = filteredOrders.filter(o => o.status === OrderStatus.Finished);

        const affiliatesWithUrgentInventory = new Set<string>();
        state.orders.forEach(order => {
            if (order.isLowInventoryOrder && order.status === OrderStatus.Active) {
                affiliatesWithUrgentInventory.add(order.affiliateId);
            }
        });
        
        return {
            totalOrders: filteredOrders.length,
            totalAffiliates: state.affiliates.length, // This is not date-dependent
            pendingAffiliates: state.affiliates.filter(a => a.status === AffiliateStatus.Pending).length,
            pendingTransfers: state.orders.filter(o => o.status === OrderStatus.PendingConfirmation).length,
            pendingInventoryRequests: state.inventoryChanges.filter(c => c.status === InventoryChangeStatus.Pending).length,
            totalSales: finishedOrders.reduce((sum, o) => sum + o.totalCost + (o.deliveryFeeApplied || 0) - (o.discountApplied || 0), 0),
            totalTortillasSold: finishedOrders.reduce((sum, o) => sum + o.quantity, 0),
            urgentInventoryAffiliatesCount: affiliatesWithUrgentInventory.size,
            urgentInventoryAffiliateIds: affiliatesWithUrgentInventory,
        };
    }, [state.orders, state.affiliates, state.inventoryChanges, dateRange]);

    const handleManagementAccess = (e: React.FormEvent) => {
        e.preventDefault();
        if (managementPassword === state.adminPassword) {
            setManagementPassword('');
            setManagementPasswordError('');
            setManagementPasswordPromptVisible(false);
            setActiveTab('management');
        } else {
            setManagementPasswordError('Contraseña incorrecta.');
        }
    };
    
     const NavTabButton: React.FC<{ tabName: string; icon: React.ReactNode; children: React.ReactNode; onClick?: () => void }> = ({ tabName, icon, children, onClick }) => (
        <button 
            onClick={onClick ? onClick : () => setActiveTab(tabName)} 
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors font-semibold text-xs sm:text-sm w-full text-center ${activeTab === tabName ? 'bg-brand-secondary text-white shadow-md' : 'text-gray-700 hover:bg-brand-light'}`}
        >
            {icon}
            <span>{children}</span>
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardView stats={stats} onTabChange={setActiveTab} dateRange={dateRange} setDateRange={setDateRange} />;
            case 'reports': return <ReportsView state={state} />;
            case 'orders': return <OrdersView state={state} dispatch={dispatch} />;
            case 'vendors': return <AffiliatesView state={state} dispatch={dispatch} urgentInventoryAffiliateIds={stats.urgentInventoryAffiliateIds} />;
            case 'cashout': return <CashOutView state={state} dispatch={dispatch} />;
            case 'referrals': return <ReferralsView state={state} dispatch={dispatch} />;
            case 'coupons': return <CouponsView state={state} dispatch={dispatch} />;
            case 'management': return <ManagementView state={state} dispatch={dispatch} />;
            case 'settings': return <SettingsView state={state} dispatch={dispatch} />;
            default: return <DashboardView stats={stats} onTabChange={setActiveTab} dateRange={dateRange} setDateRange={setDateRange} />;
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            {state.successMessage && <div className="mb-4 bg-green-100 text-green-700 p-3 rounded-md shadow-sm animate-fade-in">{state.successMessage}</div>}
            <nav className="mb-8">
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                     <NavTabButton tabName="dashboard" icon={<ChartBarIcon className="w-5 h-5"/>}>Dashboard</NavTabButton>
                     <NavTabButton tabName="reports" icon={<DocumentArrowDownIcon className="w-5 h-5"/>}>Reportes</NavTabButton>
                     <NavTabButton tabName="orders" icon={<ClipboardDocumentListIcon className="w-5 h-5"/>}>Pedidos</NavTabButton>
                     <NavTabButton tabName="vendors" icon={<UserGroupIcon className="w-5 h-5"/>}>Vendedores</NavTabButton>
                     <NavTabButton tabName="cashout" icon={<CurrencyDollarIcon className="w-5 h-5"/>}>Corte</NavTabButton>
                     <NavTabButton tabName="referrals" icon={<GiftIcon className="w-5 h-5"/>}>Referidos</NavTabButton>
                     <NavTabButton tabName="coupons" icon={<TicketIcon className="w-5 h-5"/>}>Cupones</NavTabButton>
                     <NavTabButton tabName="management" icon={<KeyIcon className="w-5 h-5"/>} onClick={() => setManagementPasswordPromptVisible(true)}>Gestión</NavTabButton>
                     <NavTabButton tabName="settings" icon={<CogIcon className="w-5 h-5"/>}>Ajustes</NavTabButton>
                </div>
            </nav>
            <main>{renderContent()}</main>

            {isManagementPasswordPromptVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in">
                  <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm">
                    <h2 className="text-2xl font-bold text-brand-dark mb-4">Acceso Restringido</h2>
                    <p className="text-gray-600 mb-6">Introduce la contraseña de administrador para acceder a esta sección.</p>
                    <form onSubmit={handleManagementAccess}>
                      <div className="mb-4">
                        <label htmlFor="management-password" className="block text-gray-700 text-sm font-bold mb-2">
                          Contraseña
                        </label>
                        <input
                          id="management-password"
                          type="password"
                          value={managementPassword}
                          onChange={(e) => {
                            setManagementPassword(e.target.value);
                            setManagementPasswordError('');
                          }}
                          className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-brand-accent bg-gray-50"
                          required
                          autoFocus
                        />
                        {managementPasswordError && <p className="text-red-500 text-xs italic mt-2">{managementPasswordError}</p>}
                      </div>
                      <div className="flex items-center justify-end gap-3 mt-6">
                        <button
                          type="button"
                          onClick={() => {
                            setManagementPasswordPromptVisible(false);
                            setManagementPassword('');
                            setManagementPasswordError('');
                          }}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="bg-brand-secondary hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors shadow-md"
                        >
                          Acceder
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
            )}
        </div>
    );
};

export default AdminView;
