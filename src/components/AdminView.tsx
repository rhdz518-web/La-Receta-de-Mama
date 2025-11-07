import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext.tsx';
import { AppState, Order, Affiliate, InventoryChange, OrderStatus, AffiliateStatus, InventoryChangeStatus, Referral, Coupon, ReferralStatus, PaymentMethod, TabVisibility, CashOut, CashOutStatus } from '../types.ts';
import StatCard from './StatCard.tsx';
import CashIcon from './icons/CashIcon.tsx';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon.tsx';
import UserGroupIcon from './icons/UserGroupIcon.tsx';
import StoreIcon from './icons/StoreIcon.tsx';
import CogIcon from './icons/CogIcon.tsx';
import ChartBarIcon from './icons/ChartBarIcon.tsx';
import ClockIcon from './icons/ClockIcon.tsx';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon.tsx';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon.tsx';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon.tsx';
import { generateUniqueCouponCode, downloadCSV } from '../utils.ts';
import WhatsAppIcon from './icons/WhatsAppIcon.tsx';
import GiftIcon from './icons/GiftIcon.tsx';
import KeyIcon from './icons/KeyIcon.tsx';
import TicketIcon from './icons/TicketIcon.tsx';
import ImagePreviewModal from './ImagePreviewModal.tsx';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon.tsx';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon.tsx';

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
                                <p className="text-xs text-gray-500 font-normal">(+ ${formatCurrency(order.deliveryFeeApplied)} envío)</p>
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
