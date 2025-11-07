import { Order } from './types';

export const generateReferralCode = (name: string, phone: string): string => {
    const namePart = name.trim().split(' ')[0].substring(0, 4).toUpperCase();
    const phonePart = phone.slice(-4);
    return `${namePart}${phonePart}`;
};

export const generateUniqueCouponCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01256789';
    let result = 'REGALO-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const downloadCSV = (orders: Order[], affiliateCommissionPerTortilla: number, filename: string) => {
    if (orders.length === 0) {
        alert("No hay datos para generar el reporte en el período seleccionado.");
        return;
    }

    const formatCurrency = (amount: number) => amount.toFixed(2);

    const headers = [
        "Fecha del Pedido",
        "ID del Pedido",
        "Nombre del Cliente",
        "Teléfono del Cliente",
        "Vendedor",
        "Cantidad de Tortillas",
        "Subtotal (MXN)",
        "Descuento Aplicado (MXN)",
        "Total Cobrado (MXN)",
        "Método de Pago",
        "Comisión del Vendedor (MXN)",
        "Ingreso Neto (MXN)"
    ];

    const csvRows = orders.map(order => {
        const finalCost = order.totalCost - (order.discountApplied || 0);
        const commission = (order.quantity * affiliateCommissionPerTortilla) / 100;
        const netIncome = finalCost - commission;

        const row = [
            `"${new Date(order.timestamp).toLocaleString('es-MX')}"`,
            order.id,
            `"${order.customerName}"`,
            order.phone,
            `"${order.affiliateName || 'N/A'}"`,
            order.quantity,
            formatCurrency(order.totalCost),
            formatCurrency(order.discountApplied || 0),
            formatCurrency(finalCost),
            order.paymentMethod,
            formatCurrency(commission),
            formatCurrency(netIncome)
        ];
        return row.join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};