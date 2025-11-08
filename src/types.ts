export enum PaymentMethod {
    Cash = 'Efectivo',
    Transfer = 'Transferencia',
}

export enum OrderStatus {
    PendingConfirmation = 'Pendiente de Confirmación',
    Active = 'Activo',
    Finished = 'Finalizado',
    Cancelled = 'Cancelado',
}

export enum ReferralStatus {
    ActiveOrder = 'Pedido Activo',
    Completed = 'Completado',
    Cancelled = 'Cancelado',
}

export enum AffiliateStatus {
    Pending = 'Pendiente',
    Approved = 'Aprobado',
    Rejected = 'Rechazado',
    Suspended = 'Suspendido',
}

export enum InventoryChangeStatus {
    Pending = 'Pendiente', // Affiliate request, awaiting admin
    Approved = 'Aprobado', // Admin approved, awaiting affiliate confirmation
    Rejected = 'Rechazado',
    Completed = 'Completado', // Affiliate confirmed receipt, inventory updated
}

export enum CashOutStatus {
    PendingAffiliateConfirmation = 'Pendiente Confirmación Vendedor',
    Completed = 'Completado',
}

export interface InventoryChange {
    id: string;
    affiliateId: string;
    amount: number; // Positive for addition, negative for removal
    timestamp: number;
    status: InventoryChangeStatus;
}

export interface User {
    customerName: string;
    phone: string;
}

export interface Order {
    id: string;
    customerName: string;
    phone: string;
    address: string;
    quantity: number;
    totalCost: number; // This represents the subtotal (quantity * price)
    paymentMethod: PaymentMethod;
    timestamp: number;
    status: OrderStatus;
    cashPaid?: number;
    referralCodeUsed?: string;
    couponUsed?: string;
    discountApplied?: number;
    affiliateId: string;
    affiliateName: string;
    deliveryFeeApplied?: number;
    deliveryChoice?: 'delivery' | 'pickup';
    paymentReceiptImage?: string; // base64 encoded image
    settledInCashOutId?: string | null;
    isLowInventoryOrder?: boolean;
}

export interface Referral {
    id: string;
    referrerCode: string;
    referrerName: string;
    referrerPhone: string;
    refereeOrderId: string;
    refereeName: string;
    refereePhone: string;
    refereeOrderQuantity: number;
    status: ReferralStatus;
    timestamp: number;
}

export interface Coupon {
    code: string;
    isUsed: boolean;
    rewardAmount: number;
    generatedForPhone?: string;
    isActive: boolean;
}

export interface Affiliate {
    id: string; // phone number
    customerName: string;
    phone: string;
    address: string;
    password: string;
    status: AffiliateStatus;
    inventory: number;
    hasDeliveryService: boolean;
    deliveryCost: number;
    schedule: {
        [day: string]: {
            isOpen: boolean;
            openTime: string; // "HH:MM"
            closeTime: string; // "HH:MM"
        }
    };
    isTemporarilyClosed: boolean;
    bankDetails?: string;
}

export interface CashOut {
    id: string;
    affiliateId: string;
    timestamp: number;
    ordersCoveredIds: string[];
    totalSales: number;
    totalCommission: number;
    totalDeliveryFees: number;
    balance: number; // The final amount settled. Positive: affiliate paid admin. Negative: admin paid affiliate.
    status: CashOutStatus;
    adminPaymentReceiptImage?: string; 
    startDate: number;
    endDate: number;
}


export interface TabVisibility {
    referrals: boolean;
    affiliates: boolean;
    coupons: boolean;
}

// FIX: Define and export the AppState interface.
export interface AppState {
    isAuthenticated: boolean;
    adminPassword: string;
    adminPhoneNumber: string;
    affiliates: Affiliate[];
    currentAffiliate: Affiliate | null;
    orders: Order[];
    users: User[];
    referrals: Referral[];
    coupons: Coupon[];
    inventoryChanges: InventoryChange[];
    cashOuts: CashOut[];
    bankDetails: string;
    affiliateCommissionPerTortilla: number;
    backupLoadCount: number;
    successMessage: string | null;
    publicAppUrl: string;
    tortillaPrice: number;
    tabVisibility: TabVisibility;
}