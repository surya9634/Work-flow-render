import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddOrderModal = ({ onClose, onSave, saving }) => {
  const [form, setForm] = useState({
    product: '',
    quantity: 1,
    amount: '',
    customer: '',
    status: 'completed',
    source: 'manual'
  });

  const canSave = form.product && form.amount && form.customer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Add Order</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Product</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.product}
              onChange={e => setForm({ ...form, product: e.target.value })}
              placeholder="Pro Plan"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: Number(e.target.value || 1) })}
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Amount ($)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: Number(e.target.value || 0) })}
                min={0}
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Customer</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={form.customer}
              onChange={e => setForm({ ...form, customer: e.target.value })}
              placeholder="jane@acme.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Source</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.source}
                onChange={e => setForm({ ...form, source: e.target.value })}
              >
                <option value="manual">Manual</option>
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="messenger">Messenger</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">Cancel</button>
          <button
            disabled={!canSave || saving}
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-300"
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOrderModal;