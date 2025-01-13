import { useState, useEffect } from 'react';
import { X, ShoppingCart, Search, Plus, RefreshCw, Users } from 'lucide-react';
import { localDB } from '../lib/localStorage';
import toast from 'react-hot-toast';
import { InvoicePrint } from '../components/InvoicePrint';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

interface Product {
  id: string;
  name: string;
  price: number;
  current_stock: number;
  category: string;
  total_sold?: number;
  sku: string;
  min_stock_level: number;
  revenue?: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  total_purchases: number;
  note?: string;
}

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Sale {
  id: string;
  customer_id: string;
  customer_name: string;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    category: string;
  }>;
  total: number;
  created_at: string;
  payment_status: 'paid' | 'pending';
  invoice_number: string;
}

interface PrintConfirmation {
  show: boolean;
  sale: Sale | null;
}

// Add quick categories for walk-in customers
interface WalkInCategory {
  id: string;
  label: string;
  icon: string;
}

const WALK_IN_CATEGORIES: WalkInCategory[] = [
  { id: 'regular', label: 'Regular Customer', icon: '👤' },
  { id: 'tourist', label: 'Tourist', icon: '✈️' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'student', label: 'Student', icon: '🎓' }
];

function Sales() {
  const { session, user } = useAuth();
  const { hasPermission } = usePermissions(session?.roleId || '');
  const canManageSales = user?.role?.permissions?.['manage_sales'] || hasPermission('manage_sales');

  if (!hasPermission('view_sales')) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">You don't have permission to view sales.</p>
      </div>
    );
  }

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>({
    id: 'walk-in',
    name: 'Walk-in Customer',
    phone: '',
    total_purchases: 0
  });
  const [selectedProducts, setSelectedProducts] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickProducts, setQuickProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [printConfirmation, setPrintConfirmation] = useState<PrintConfirmation>({
    show: false,
    sale: null
  });
  const [walkInNote, setWalkInNote] = useState('');
  const [quickContact, setQuickContact] = useState('');

  useEffect(() => {
    loadSales();
    loadProducts();
    loadCustomers();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Alt + S: Quick Search
      if (e.altKey && e.key === 's') {
        document.querySelector<HTMLInputElement>('[placeholder="Search product..."]')?.focus();
      }
      // Alt + P: Complete Sale
      if (e.altKey && e.key === 'p' && selectedProducts.length > 0) {
        createSale();
      }
      // Numbers 1-9 for quick quantity
      if (e.altKey && /^[1-9]$/.test(e.key)) {
        const quantityInput = document.getElementById('quickAddQuantity') as HTMLInputElement;
        if (quantityInput) {
          quantityInput.value = e.key;
        }
      }
      // Alt + Enter to add product with quantity
      if (e.altKey && e.key === 'Enter') {
        const product = products.find(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku === searchQuery
        );
        const quantity = parseInt((document.getElementById('quickAddQuantity') as HTMLInputElement)?.value || '1');
        if (product) {
          addProductToSale(product, quantity);
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [searchQuery, products]);

  useEffect(() => {
    const popular = products
      .sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0))
      .slice(0, 8);
    setQuickProducts(popular);
  }, [products]);

  const loadSales = async () => {
    try {
      const data = localDB.getAll('sales');
      setSales(data);
    } catch (error) {
      toast.error('Error loading sales');
    }
  };

  const loadProducts = async () => {
    try {
      const data = localDB.getAll('products');
      setProducts(data);
    } catch (error) {
      toast.error('Error loading products');
    }
  };

  const loadCustomers = async () => {
    try {
      const data = localDB.getAll('customers');
      setCustomers(data);
    } catch (error) {
      toast.error('Error loading customers');
    }
  };

  const validateQuantity = (productId: string, quantity: number): boolean => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('Product not found');
      return false;
    }
    
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return false;
    }

    if (quantity > product.current_stock) {
      toast.error(`Only ${product.current_stock} units available`);
      return false;
    }

    return true;
  };

  const validatePayment = (): boolean => {
    if (paymentMethod !== 'cash') {
      // For card or UPI, assume exact amount
      setPaymentAmount(calculateTotals().finalAmount);
      return true;
    }

    if (!paymentAmount) {
      toast.error('Please enter payment amount');
      return false;
    }

    if (paymentAmount < calculateTotals().finalAmount) {
      toast.error('Payment amount is less than total amount');
      return false;
    }

    return true;
  };

  const addProductToSale = (product: Product, quantity: number) => {
    // Validate product
    if (!product.id || !product.name || !product.price) {
      toast.error('Invalid product data');
      return;
    }

    // Check current stock
    const currentItem = selectedProducts.find(item => item.product_id === product.id);
    const currentQuantity = currentItem ? currentItem.quantity : 0;
    const totalQuantity = currentQuantity + quantity;

    if (!validateQuantity(product.id, totalQuantity)) {
      return;
    }

    // Add or update product in cart
    const existingItem = selectedProducts.find(item => item.product_id === product.id);
    if (existingItem) {
      setSelectedProducts(prev => prev.map(item => 
        item.product_id === product.id
          ? { 
              ...item, 
              quantity: totalQuantity,
              total_price: Number((product.price * totalQuantity).toFixed(2))
            }
          : item
      ));
    } else {
      setSelectedProducts(prev => [...prev, {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        total_price: Number((product.price * quantity).toFixed(2))
      }]);
    }
  };

  const removeProductFromSale = (productId: string) => {
    setSelectedProducts(prev => prev.filter(item => item.product_id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = selectedProducts.reduce((sum, item) => sum + item.total_price, 0);
    const finalAmount = subtotal - discount;
    return { subtotal, finalAmount };
  };

  const createSale = async () => {
    try {
      // Check if session exists
      if (!session) {
        toast.error('Authentication error');
        return;
      }

      if (selectedProducts.length === 0) {
        toast.error('Please add products to the sale');
        return;
      }

      if (!validatePayment()) {
        return;
      }

      const newSale = {
        id: crypto.randomUUID(),
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.name,
        products: selectedProducts.map(item => ({
          id: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
          category: products.find(p => p.id === item.product_id)?.category || ''
        })),
        total: calculateTotals().finalAmount,
        created_at: new Date().toISOString(),
        payment_status: 'paid' as const,
        invoice_number: `INV-${Date.now()}`,
        staff_id: session.userId,
        staff_name: session.userName,
      };

      // Add sale and update totals
      localDB.addSale(newSale);
      
      // Reset the sale form
      resetSale();
      
      toast.success('Sale completed successfully');
      setPrintConfirmation({ show: true, sale: newSale });

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error creating sale');
    }
  };

  const printInvoice = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          </head>
          <body>
            ${document.getElementById(`invoice-${sale.id}`)?.innerHTML}
            <script>window.onload = () => window.print()</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (!validateQuantity(productId, newQuantity)) {
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    setSelectedProducts(prev => prev.map(item => 
      item.product_id === productId
        ? { 
            ...item, 
            quantity: newQuantity,
            total_price: Number((product.price * newQuantity).toFixed(2))
          }
        : item
    ));
  };

  const resetSale = () => {
    setSelectedCustomer({
      id: 'walk-in',
      name: 'Walk-in Customer',
      phone: '',
      total_purchases: 0
    });
    setWalkInNote('');
    setQuickContact('');
    setSelectedProducts([]);
    setDiscount(0);
    setPaymentAmount(0);
    setPaymentMethod('cash');
  };

  return (
    <div className="h-screen flex">
      {/* Left Side - Product Selection */}
      <div className={`w-2/3 p-6 bg-gray-50 overflow-y-auto ${!canManageSales ? 'pointer-events-none opacity-50' : ''}`}>
        {/* Search and Quick Actions */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search product or scan barcode... (Alt + S)"
              className="w-full p-4 pl-12 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const product = products.find(p => 
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.sku === searchQuery
                  );
                  if (product) {
                    addProductToSale(product, 1);
                    setSearchQuery('');
                  }
                }
              }}
            />
            <Search className="absolute left-4 top-4 text-gray-400" size={20} />
          </div>
          <input
            type="number"
            placeholder="Quantity (Alt + 1-9)"
            className="p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            defaultValue="1"
            id="quickAddQuantity"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-full shadow-sm transition-all ${
              selectedCategory === 'all' 
                ? 'bg-blue-500 text-white shadow-blue-200' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            All Products
          </button>
          {Array.from(new Set(products.map(p => p.category))).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full shadow-sm transition-all whitespace-nowrap ${
                selectedCategory === category 
                  ? 'bg-blue-500 text-white shadow-blue-200' 
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(selectedCategory === 'all' ? quickProducts : products
            .filter(p => p.category === selectedCategory))
            .map(product => (
              <button
                key={product.id}
                onClick={() => addProductToSale(product, 1)}
                className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-blue-200"
              >
                <div className="text-sm font-medium text-gray-800">{product.name}</div>
                <div className="text-lg font-bold text-blue-600 mt-1">${product.price}</div>
                <div className={`text-xs mt-2 ${
                  product.current_stock <= product.min_stock_level 
                    ? 'text-red-500' 
                    : 'text-gray-500'
                }`}>
                  Stock: {product.current_stock} units
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className={`w-1/3 bg-white border-l flex flex-col h-screen ${!canManageSales ? 'pointer-events-none opacity-50' : ''}`}>
        {/* Customer Section */}
        <div className="p-4 border-b bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-lg font-semibold text-gray-800">Customer Details</label>
            {selectedCustomer.id !== 'walk-in' && (
              <div className="text-sm">
                <span className="text-gray-500">Total Purchases:</span>
                <span className="ml-2 font-medium text-blue-600">
                  ${selectedCustomer.total_purchases}
                </span>
              </div>
            )}
          </div>
          
          {/* Customer Selection and Walk-in Options */}
          <div className="space-y-4">
            {/* Customer Selection Dropdown */}
            <div className="relative">
              <select
                className="w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:bg-white
                  transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  appearance-none cursor-pointer"
                value={selectedCustomer?.id || 'walk-in'}
                onChange={(e) => {
                  if (e.target.value === 'walk-in') {
                    setSelectedCustomer({
                      id: 'walk-in',
                      name: 'Walk-in Customer',
                      phone: '',
                      total_purchases: 0
                    });
                  } else {
                    const customer = customers.find(c => c.id === e.target.value);
                    if (customer) {
                      setSelectedCustomer(customer);
                      setWalkInNote('');
                      setQuickContact('');
                    }
                  }
                }}
              >
                <option value="walk-in">Walk-in Customer</option>
                <optgroup label="Registered Customers">
                  {customers
                    .filter(c => c.id !== 'walk-in')
                    .map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                      </option>
                    ))}
                </optgroup>
              </select>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {selectedCustomer.id === 'walk-in' ? '👤' : '🎯'}
              </span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▼</span>
            </div>

            {/* Walk-in Customer Options */}
            {selectedCustomer.id === 'walk-in' && (
              <div className="space-y-3">
                {/* Note Input with Emoji */}
                <div className="relative">
                  <input
                    type="text"
                    value={walkInNote}
                    onChange={(e) => setWalkInNote(e.target.value)}
                    placeholder="Add customer note (optional)"
                    className="w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:bg-white
                      transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📝</span>
                </div>

                {/* Quick Contact Input with Icon */}
                <div className="relative">
                  <input
                    type="text"
                    value={quickContact}
                    onChange={(e) => setQuickContact(e.target.value)}
                    placeholder="Quick contact (phone/email)"
                    className="w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:bg-white
                      transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📱</span>
                </div>

                {/* Register Customer Button */}
                {quickContact && (
                  <button
                    onClick={() => {
                      // Convert walk-in to registered customer
                      const newCustomer = localDB.insert('customers', {
                        name: walkInNote || 'Walk-in Customer',
                        phone: quickContact,
                        total_purchases: 0
                      });
                      setSelectedCustomer(newCustomer);
                      setQuickContact('');
                      setWalkInNote('');
                      toast.success('Customer registered!');
                    }}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                      text-white rounded-lg hover:from-blue-600 hover:to-blue-700
                      transition-all transform active:scale-[0.98] shadow-md
                      flex items-center justify-center gap-2 font-medium"
                  >
                    <Plus size={18} />
                    Register as Customer
                  </button>
                )}

                {/* Customer Categories */}
                <div className="flex gap-2 overflow-x-auto py-2 scrollbar-thin 
                  scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  {WALK_IN_CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setWalkInNote(category.label)}
                      className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all
                        flex items-center gap-2
                        ${walkInNote === category.label
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'bg-white hover:bg-gray-50 border hover:border-blue-200'
                        }`}
                    >
                      {category.icon}
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <button
                onClick={() => resetSale()}
                className="p-2 text-sm text-gray-600 hover:bg-gray-50 
                  rounded-lg flex items-center justify-center gap-1 border"
              >
                <RefreshCw size={14} /> Reset
              </button>
              <button
                onClick={() => window.location.href = '/customers'}
                className="p-2 text-sm text-blue-600 hover:bg-blue-50
                  rounded-lg flex items-center justify-center gap-1 border border-blue-200"
              >
                <Users size={14} /> All Customers
              </button>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedProducts.length === 0 ? (
            <div className="text-center text-gray-500 mt-8 bg-gray-50 p-6 rounded-lg border-2 border-dashed">
              <ShoppingCart size={40} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">Cart is Empty</p>
              <p className="text-sm mt-1">Search or select products to add them to cart</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedProducts.map((item) => (
                <div key={item.product_id} 
                  className="flex items-center justify-between p-3 bg-white rounded-lg border
                    hover:border-blue-200 transition-all shadow-sm"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{item.product_name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Unit Price: ${item.unit_price} × {item.quantity} = 
                      <span className="font-medium text-blue-600 ml-1">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-50 rounded-lg border">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-l-lg
                          border-r transition-colors"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-r-lg
                          border-l transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeProductFromSale(item.product_id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary and Payment - Fixed at Bottom */}
        <div className="border-t bg-gradient-to-b from-white to-gray-50 p-4 sticky bottom-0">
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg border space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">${calculateTotals().subtotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Discount</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-20 p-1.5 border rounded-lg text-right focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">$</span>
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-blue-600">${calculateTotals().finalAmount}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-3 gap-2">
              {['cash', 'card', 'upi'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-2 rounded-lg border text-center transition-all
                    ${paymentMethod === method
                      ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-200'
                      : 'bg-white hover:bg-gray-50'
                    }`}
                >
                  {method === 'cash' && '💵'}
                  {method === 'card' && '💳'}
                  {method === 'upi' && '📱'}
                  <div className="text-sm font-medium capitalize mt-1">{method}</div>
                </button>
              ))}
            </div>

            {/* Payment Amount */}
            <div className="relative">
              <input
                type="number"
                placeholder="Enter payment amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                onFocus={() => {
                  if (!paymentAmount) {
                    setPaymentAmount(calculateTotals().finalAmount);
                  }
                }}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">$</div>
            </div>

            {/* Change Due */}
            {paymentAmount > calculateTotals().finalAmount && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-green-700 font-medium">Change Due:</div>
                <div className="text-xl font-bold text-green-600">
                  ${(paymentAmount - calculateTotals().finalAmount).toFixed(2)}
                </div>
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              onClick={createSale}
              disabled={selectedProducts.length === 0 || !canManageSales}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium text-lg shadow-lg
                ${!canManageSales 
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200'
                }
                transition-all transform active:scale-[0.99]`}
            >
              <ShoppingCart size={20} />
              {canManageSales ? 'Complete Sale (Alt + P)' : 'No Permission to Create Sales'}
            </button>

            {!canManageSales && (
              <div className="mt-2 text-center text-red-600 text-sm bg-red-50 p-2 rounded-lg border border-red-200">
                You do not have permission to create sales. Please contact your administrator.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Invoice Templates */}
      {sales.map(sale => (
        <div key={sale.id} id={`invoice-${sale.id}`} style={{ display: 'none' }}>
          <InvoicePrint sale={sale} />
        </div>
      ))}

      {/* Print Confirmation Modal */}
      {printConfirmation.show && printConfirmation.sale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Print Invoice</h3>
            <p className="text-gray-600 mb-6">Would you like to print the invoice for this sale?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setPrintConfirmation({ show: false, sale: null })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                No, Skip
              </button>
              <button
                onClick={() => {
                  printInvoice(printConfirmation.sale!);
                  setPrintConfirmation({ show: false, sale: null });
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Yes, Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add a permission warning banner at the top if needed */}
      {!canManageSales && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white py-2 px-4 text-center z-50">
          You do not have permission to create sales. View-only mode enabled.
        </div>
      )}
    </div>
  );
}

export default Sales;