import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Sale, SaleProduct, SaleItem } from '@/types';
import { localDB } from '../../lib/localStorage';
import toast from 'react-hot-toast';

interface EditTransactionModalProps {
  sale: Sale;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditTransactionModal({ sale, onClose, onUpdate }: EditTransactionModalProps) {
  const [status, setStatus] = useState<Sale['payment_status']>(sale.payment_status);
  const [products, setProducts] = useState<SaleProduct[]>(sale.products);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const total = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      
      // Create items array from products
      const items: SaleItem[] = products.map(p => ({
        product_name: p.name,
        total_price: p.price * p.quantity
      }));

      // Update the sale in localStorage
      const updatedSale: Sale = {
        ...sale,
        payment_status: status,
        products: products,
        total: total,
        final_amount: total,
        items: items,
        invoice_status: status === 'paid' ? 'paid' : 'pending',
        payment_due_date: sale.payment_due_date
      };

      localDB.update('sales', sale.id, updatedSale);
      
      toast.success('Transaction updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to update transaction');
      console.error(error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Transaction</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Sale['payment_status'])}
              className="w-full p-2 border rounded-lg"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Products
            </label>
            {products.map((product, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => {
                    const newProducts = [...products];
                    newProducts[index] = { ...product, name: e.target.value };
                    setProducts(newProducts);
                  }}
                  className="flex-1 p-2 border rounded-lg"
                  placeholder="Product name"
                />
                <input
                  type="number"
                  value={product.quantity}
                  onChange={(e) => {
                    const newProducts = [...products];
                    newProducts[index] = { ...product, quantity: parseInt(e.target.value) || 0 };
                    setProducts(newProducts);
                  }}
                  className="w-20 p-2 border rounded-lg"
                  placeholder="Qty"
                  min="1"
                />
                <input
                  type="number"
                  value={product.price}
                  onChange={(e) => {
                    const newProducts = [...products];
                    newProducts[index] = { ...product, price: parseFloat(e.target.value) || 0 };
                    setProducts(newProducts);
                  }}
                  className="w-24 p-2 border rounded-lg"
                  placeholder="Price"
                  min="0"
                  step="0.01"
                />
                <button
                  type="button"
                  onClick={() => {
                    setProducts(products.filter((_, i) => i !== index));
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 