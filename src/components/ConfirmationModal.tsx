import React from 'react';
import { Order, PaymentMethod } from '../types';

interface ConfirmationModalProps {
  order: Order | null;
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ order, isVisible, onConfirm, onCancel }) => {
  if (!isVisible || !order) {
    return null;
  }

  const finalCost = order.totalCost + (order.deliveryFeeApplied || 0) - (order.discountApplied || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-brand-dark text-center">Confirma tu Pedido</h2>
        </div>
        
        <div className="p-6 space-y-3 text-gray-700 overflow-y-auto">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-500">Cliente:</span>
            <span className="font-medium">{order.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-500">Teléfono:</span>
            <span className="font-medium">{order.phone}</span>
          </div>
          {order.deliveryChoice !== 'pickup' && (
            <div className="flex justify-between">
                <span className="font-semibold text-gray-500">Dirección:</span>
                <span className="text-right font-medium">{order.address}</span>
            </div>
          )}
          
          <hr className="my-4"/>
          
          <div className="text-center bg-brand-light/50 p-4 rounded-lg my-2">
            <p className="text-lg font-semibold text-brand-dark">Cantidad de Tortillas</p>
            <p className="text-5xl font-extrabold text-brand-secondary tracking-tight">{order.quantity}</p>
          </div>
          
          <div className="flex justify-between">
            <span className="font-semibold text-gray-500">Método de Pago:</span>
            <span className="font-medium">{order.paymentMethod}</span>
          </div>
           <div className="flex justify-between">
            <span className="font-semibold text-gray-500">Entrega:</span>
            <span className="font-medium">{order.deliveryChoice === 'pickup' ? 'Recoger en Tienda' : 'A Domicilio'}</span>
          </div>

          {order.paymentMethod === PaymentMethod.Cash && typeof order.cashPaid === 'number' && (
             <div className="pl-4 border-l-2 border-brand-primary/50 mt-1 space-y-1">
                <div className="flex justify-between">
                    <span className="font-semibold text-gray-500">Paga con:</span>
                    <span className="font-medium">{formatCurrency(order.cashPaid)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="font-semibold text-gray-500">Cambio:</span>
                    <span className="font-medium">{formatCurrency(order.cashPaid - finalCost)}</span>
                </div>
            </div>
          )}
          <hr className="my-4"/>
          
          <div className="space-y-1">
            <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.totalCost)}</span>
            </div>
            {order.deliveryFeeApplied && order.deliveryFeeApplied > 0 && (
                <div className="flex justify-between text-gray-600">
                    <span>Costo de Envío:</span>
                    <span>{formatCurrency(order.deliveryFeeApplied)}</span>
                </div>
            )}
            {order.discountApplied && order.discountApplied > 0 && (
                 <div className="flex justify-between font-semibold text-green-600">
                    <span>Descuento por Cupón:</span>
                    <span>-{formatCurrency(order.discountApplied)}</span>
                </div>
            )}
             <div className="flex justify-between items-center text-3xl font-bold text-brand-secondary mt-2 pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(finalCost)}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t mt-auto flex justify-between space-x-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onCancel}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Confirmar y Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;