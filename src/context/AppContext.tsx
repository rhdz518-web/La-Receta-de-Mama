import React, { createContext, useReducer, useEffect, Dispatch, ReactNode } from 'react';
import { AppState, Order, Affiliate, InventoryChange, OrderStatus, AffiliateStatus, InventoryChangeStatus, Referral, Coupon, ReferralStatus, User, CashOut, CashOutStatus } from '../types';
import { DEFAULT_COMMISSION_PER_TORTILLA_CENTS, REWARD_TORTILLAS, APP_VERSION, TORTILLA_PRICE } from '../constants';
import { db, increment } from '../firebase';

// Define action types
type Action =
    | { type: 'LOGIN'; payload: string }
    | { type: 'LOGOUT' }
    | { type: 'AFFILIATE_LOGIN'; payload: Affiliate }
    | { type: 'AFFILIATE_LOGOUT' }
    | { type: 'ADD_OR_UPDATE_USER'; payload: User }
    | { type: 'ADD_ORDER'; payload: Order }
    | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: OrderStatus, order?: Order } }
    | { type: 'CONFIRM_TRANSFER_PAYMENT'; payload: { orderId: string } }
    | { type: 'ADD_REFERRAL'; payload: Referral }
    | { type: 'COMPLETE_REFERRAL'; payload: { referral: Referral; couponCode: string } }
    | { type: 'TOGGLE_COUPON_STATUS'; payload: { couponCode: string, currentStatus: boolean } }
    | { type: 'DELETE_COUPON'; payload: { couponCode: string } }
    | { type: 'APPLY_FOR_AFFILIATE'; payload: Affiliate }
    | { type: 'UPDATE_AFFILIATE_STATUS'; payload: { affiliateId: string; status: AffiliateStatus } }
    | { type: 'TOGGLE_AFFILIATE_DELIVERY'; payload: { affiliateId: string, currentStatus: boolean } }
    | { type: 'UPDATE_AFFILIATE_SETTINGS'; payload: { affiliateId: string; address: string; deliveryCost: number } }
    | { type: 'UPDATE_AFFILIATE_SCHEDULE'; payload: { affiliateId: string; schedule: Affiliate['schedule'] } }
    | { type: 'TOGGLE_TEMPORARY_CLOSED'; payload: { affiliateId: string, currentStatus: boolean } }
    | { type: 'DELETE_AFFILIATE'; payload: { affiliateId: string } }
    | { type: 'ADD_INVENTORY_CHANGE'; payload: InventoryChange }
    | { type: 'RESOLVE_INVENTORY_CHANGE'; payload: { changeId: string; status: InventoryChangeStatus.Approved | InventoryChangeStatus.Rejected } }
    | { type: 'AFFILIATE_CONFIRM_INVENTORY_CHANGE'; payload: { change: InventoryChange } }
    | { type: 'CANCEL_INVENTORY_REQUEST'; payload: { changeId: string } }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState> }
    | { type: 'LOAD_STATE'; payload: AppState }
    | { type: 'SET_SUCCESS_MESSAGE'; payload: string }
    | { type: 'CLEAR_SUCCESS_MESSAGE' }
    | { type: 'UPDATE_AFFILIATE_BANK_DETAILS'; payload: { affiliateId: string; bankDetails: string } }
    | { type: 'PERFORM_CASHOUT'; payload: CashOut }
    | { type: 'AFFILIATE_CONFIRM_CASHOUT'; payload: { cashOutId: string } }
    // New actions to set state from Firestore
    | { type: 'SET_STATE_FROM_FIRESTORE'; payload: Partial<AppState> };


// Create context
interface AppContextType {
    state: AppState;
    dispatch: Dispatch<Action>;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

// Initial State
const initialState: AppState = {
    isAuthenticated: false,
    adminPassword: 'admin',
    adminPhoneNumber: '5512345678',
    affiliates: [],
    currentAffiliate: null,
    orders: [],
    users: [],
    referrals: [],
    coupons: [],
    inventoryChanges: [],
    cashOuts: [],
    bankDetails: 'Banco: XYZ\nCuenta: 1234567890\nCLABE: 098765432109876543\nTitular: Nombre Apellido',
    affiliateCommissionPerTortilla: DEFAULT_COMMISSION_PER_TORTILLA_CENTS,
    tortillaPrice: TORTILLA_PRICE,
    backupLoadCount: 0,
    successMessage: null,
    publicAppUrl: '',
    tabVisibility: {
        referrals: true,
        affiliates: true,
        coupons: true,
    },
};

// Reducer
const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        // AUTH ACTIONS (Local State)
        case 'LOGIN':
            return { ...state, isAuthenticated: true, adminPassword: action.payload };
        case 'LOGOUT':
            return { ...state, isAuthenticated: false };
        case 'AFFILIATE_LOGIN':
            return { ...state, currentAffiliate: action.payload, isAuthenticated: false };
        case 'AFFILIATE_LOGOUT':
            return { ...state, currentAffiliate: null };
        
        // FIRESTORE-DRIVEN STATE UPDATES
        case 'SET_STATE_FROM_FIRESTORE':
            return { ...state, ...action.payload };

        // ACTIONS THAT WRITE TO FIRESTORE
        case 'ADD_OR_UPDATE_USER':
            db.collection('users').doc(action.payload.phone).set(action.payload, { merge: true });
            return state;
        
        case 'ADD_ORDER': {
            const { id, ...orderData } = action.payload;
            db.collection('orders').doc(id).set(orderData);
            if (action.payload.couponUsed) {
                db.collection('coupons').doc(action.payload.couponUsed).update({ isUsed: true });
            }
            return state;
        }

        case 'UPDATE_ORDER_STATUS': {
            const { orderId, status, order } = action.payload;
            if (!order) return state;

            // This action now performs multiple writes.
            const orderRef = db.collection('orders').doc(orderId);
            orderRef.update({ status });

            if (status === OrderStatus.Finished) {
                const affiliateRef = db.collection('affiliates').doc(order.affiliateId);
                affiliateRef.update({ inventory: increment(-order.quantity) });
            }
            
            const referral = state.referrals.find(r => r.refereeOrderId === orderId);
            if(referral) {
                 let newStatus = referral.status;
                 if (status === OrderStatus.Cancelled) newStatus = ReferralStatus.Cancelled;
                 else if (status === OrderStatus.Active && referral.status === ReferralStatus.Cancelled) newStatus = ReferralStatus.ActiveOrder;
                 db.collection('referrals').doc(referral.id).update({ status: newStatus });
            }
            return state;
        }

        case 'CONFIRM_TRANSFER_PAYMENT':
            db.collection('orders').doc(action.payload.orderId).update({ status: OrderStatus.Active });
            return { ...state, successMessage: `Pago del pedido confirmado. El vendedor puede proceder.` };

        case 'ADD_REFERRAL': {
            const { id, ...referralData } = action.payload;
            db.collection('referrals').doc(id).set(referralData);
            return state;
        }

        case 'COMPLETE_REFERRAL': {
            const { referral, couponCode } = action.payload;
            db.collection('referrals').doc(referral.id).update({ status: ReferralStatus.Completed });

            const newCoupon: Coupon = {
                code: couponCode,
                isUsed: false,
                rewardAmount: REWARD_TORTILLAS * state.tortillaPrice,
                generatedForPhone: referral.referrerPhone,
                isActive: true
            };
            db.collection('coupons').doc(couponCode).set(newCoupon);
            return state;
        }

        case 'TOGGLE_COUPON_STATUS':
            db.collection('coupons').doc(action.payload.couponCode).update({ isActive: !action.payload.currentStatus });
            return state;

        case 'DELETE_COUPON':
            db.collection('coupons').doc(action.payload.couponCode).delete();
            return { ...state, successMessage: `Cupón "${action.payload.couponCode}" eliminado.` };

        case 'APPLY_FOR_AFFILIATE': {
            const { id, ...affiliateData } = action.payload;
            db.collection('affiliates').doc(id).set(affiliateData);
            return state;
        }

        case 'UPDATE_AFFILIATE_STATUS':
            db.collection('affiliates').doc(action.payload.affiliateId).update({ status: action.payload.status });
            return state;
        
        case 'TOGGLE_AFFILIATE_DELIVERY':
            db.collection('affiliates').doc(action.payload.affiliateId).update({ hasDeliveryService: !action.payload.currentStatus });
            return state;

        case 'UPDATE_AFFILIATE_SETTINGS':
            db.collection('affiliates').doc(action.payload.affiliateId).update({
                address: action.payload.address,
                deliveryCost: action.payload.deliveryCost
            });
            return state;

        case 'UPDATE_AFFILIATE_BANK_DETAILS':
            db.collection('affiliates').doc(action.payload.affiliateId).update({
                bankDetails: action.payload.bankDetails
            });
            return state;

        case 'UPDATE_AFFILIATE_SCHEDULE':
             db.collection('affiliates').doc(action.payload.affiliateId).update({ schedule: action.payload.schedule });
            return state;

        case 'TOGGLE_TEMPORARY_CLOSED': {
            db.collection('affiliates').doc(action.payload.affiliateId).update({ isTemporarilyClosed: !action.payload.currentStatus });
            const message = !action.payload.currentStatus ? 'Has cerrado tu tienda temporalmente.' : '¡Has abierto tu tienda! Ya puedes recibir pedidos.';
            return { ...state, successMessage: message };
        }
        
        case 'DELETE_AFFILIATE':
            db.collection('affiliates').doc(action.payload.affiliateId).delete();
            return { ...state, successMessage: `Vendedor eliminado con éxito.` };

        case 'ADD_INVENTORY_CHANGE': {
            const { id, ...changeData } = action.payload;
            db.collection('inventoryChanges').doc(id).set(changeData);
            if (changeData.status !== InventoryChangeStatus.Pending) { // Admin adjustment
                 return { ...state, successMessage: 'Ajuste de inventario enviado para confirmación del vendedor.' };
            } else { // Affiliate request
                 return { ...state, successMessage: `Solicitud de ${changeData.amount} tortillas enviada.` };
            }
        }
        
        case 'RESOLVE_INVENTORY_CHANGE':
            db.collection('inventoryChanges').doc(action.payload.changeId).update({ status: action.payload.status });
            return state;

        case 'AFFILIATE_CONFIRM_INVENTORY_CHANGE': {
            const { change } = action.payload;
            if (change.status !== InventoryChangeStatus.Approved) return state;

            db.collection('inventoryChanges').doc(change.id).update({ status: InventoryChangeStatus.Completed });
            db.collection('affiliates').doc(change.affiliateId).update({ inventory: increment(change.amount) });
            return { ...state, successMessage: 'Inventario confirmado y actualizado.' };
        }

        case 'CANCEL_INVENTORY_REQUEST':
            db.collection('inventoryChanges').doc(action.payload.changeId).delete();
            return { ...state, successMessage: 'Solicitud de inventario cancelada.' };
            
        case 'PERFORM_CASHOUT': {
            const { id, ...cashOutData } = action.payload;
            db.collection('cashOuts').doc(id).set(cashOutData);

            // Mark orders as settled in a batch
            const batch = db.batch();
            cashOutData.ordersCoveredIds.forEach(orderId => {
                const orderRef = db.collection('orders').doc(orderId);
                batch.update(orderRef, { settledInCashOutId: id });
            });
            batch.commit();

            return { ...state, successMessage: 'Corte de caja realizado con éxito.' };
        }
        
        case 'AFFILIATE_CONFIRM_CASHOUT':
            db.collection('cashOuts').doc(action.payload.cashOutId).update({ status: CashOutStatus.Completed });
             return { ...state, successMessage: 'Recepción de transferencia confirmada.' };

        case 'UPDATE_SETTINGS':
            db.collection('settings').doc('main').set(action.payload, { merge: true });
            return state;

        // UI-ONLY ACTIONS
        case 'SET_SUCCESS_MESSAGE':
            return { ...state, successMessage: action.payload };
        case 'CLEAR_SUCCESS_MESSAGE':
            return { ...state, successMessage: null };
            
        case 'LOAD_STATE': {
             // This is now complex. A proper restore would require batch writes to Firestore.
             // For now, we'll just show a message that this feature is disabled.
             alert("La restauración desde un archivo de respaldo está deshabilitada al usar la base de datos en la nube para prevenir la sobreescritura de datos.");
             return state;
        }

        default:
            return state;
    }
};

// Provider Component
const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        console.log("Setting up Firestore listeners...");

        const processSnapshot = (snapshot: any, key: keyof AppState) => {
            const data = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
            dispatch({ type: 'SET_STATE_FROM_FIRESTORE', payload: { [key]: data } });
        };
        
        const unsubs = [
            db.collection('affiliates').onSnapshot((snap: any) => processSnapshot(snap, 'affiliates')),
            db.collection('orders').onSnapshot((snap: any) => processSnapshot(snap, 'orders')),
            db.collection('users').onSnapshot((snap: any) => processSnapshot(snap, 'users')),
            db.collection('referrals').onSnapshot((snap: any) => processSnapshot(snap, 'referrals')),
            db.collection('coupons').onSnapshot((snap: any) => processSnapshot(snap, 'coupons')),
            db.collection('inventoryChanges').onSnapshot((snap: any) => processSnapshot(snap, 'inventoryChanges')),
            db.collection('cashOuts').onSnapshot((snap: any) => processSnapshot(snap, 'cashOuts')),
            db.collection('settings').doc('main').onSnapshot((doc: any) => {
                if (doc.exists) {
                    dispatch({ type: 'SET_STATE_FROM_FIRESTORE', payload: doc.data() });
                } else {
                    // Initialize settings if they don't exist
                    db.collection('settings').doc('main').set({
                        adminPassword: initialState.adminPassword,
                        adminPhoneNumber: initialState.adminPhoneNumber,
                        bankDetails: initialState.bankDetails,
                        affiliateCommissionPerTortilla: initialState.affiliateCommissionPerTortilla,
                        publicAppUrl: initialState.publicAppUrl,
                        tortillaPrice: initialState.tortillaPrice,
                        tabVisibility: initialState.tabVisibility,
                    });
                }
            })
        ];

        return () => {
            console.log("Cleaning up Firestore listeners.");
            unsubs.forEach(unsub => unsub());
        };
    }, []);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export { AppProvider };