import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, X, Filter, Download } from 'lucide-react';
import { localDB } from '../lib/localStorage';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import type { Product } from '../types/product';

interface SaleItem {
  product_id: string;
  quantity: number;
}

interface Sale {
  id: string;
  items: SaleItem[];
}

function EditModal({ product, onClose, onSave }: {
  product: Product;
  onClose: () => void;
  onSave: (updatedProduct: Product) => void;
}) {
  const [form, setForm] = useState({
    name: product.name,
    sku: product.sku,
    description: product.description || '',
    purchase_price: product.purchase_price || 0,
    price: product.price || 0,
    current_stock: product.current_stock,
    min_stock_level: product.min_stock_level,
    category: product.category
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Product</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Purchase Price</label>
            <input
              type="number"
              value={form.purchase_price}
              onChange={(e) => setForm(prev => ({ ...prev, purchase_price: Number(e.target.value) }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Selling Price</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm(prev => ({ ...prev, price: Number(e.target.value) }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Current Stock</label>
            <input
              type="number"
              value={form.current_stock}
              onChange={(e) => setForm(prev => ({ ...prev, current_stock: Number(e.target.value) }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Min Stock Level</label>
            <input
              type="number"
              value={form.min_stock_level}
              onChange={(e) => setForm(prev => ({ ...prev, min_stock_level: Number(e.target.value) }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...product, ...form })}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 w-16 bg-gray-200 rounded"></div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
        <div className="h-4 w-full bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default function Products() {
  const { session } = useAuth();
  const { hasPermission } = usePermissions(session?.roleId || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [quickAdd, setQuickAdd] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);

  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    price: '',
    costPrice: '',
    stock: '',
    category: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = localDB.getAll('products');
      setProducts(data);
    } catch (error) {
      toast.error('Error loading products');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddProduct();
  };

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return order * a.name.localeCompare(b.name);
        case 'stock':
          return order * (a.current_stock - b.current_stock);
        case 'price':
          return order * ((a.price || 0) - (b.price || 0));
        default:
          return 0;
      }
    });

  const handleEdit = (updatedProduct: Product) => {
    try {
      localDB.update('products', updatedProduct.id, updatedProduct);
      loadProducts();
      setEditingProduct(null);
      toast.success('Product updated successfully');
    } catch (error) {
      toast.error('Error updating product');
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    // Check if product has been sold
    const sales = localDB.getAll('sales') as Sale[];
    const hasBeenSold = sales.some(sale => 
      sale.items.some((item: SaleItem) => item.product_id === productId)
    );

    if (hasBeenSold) {
      toast.error('Cannot delete product with sales history');
      return;
    }

    // Show confirmation with product name
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      try {
        localDB.delete('products', productId);
        loadProducts();
        toast.success('Product deleted successfully');
      } catch (error) {
        toast.error('Error deleting product');
      }
    }
  };

  const handleAddProduct = () => {
    try {
      // Validate inputs
      if (!newProduct.name || !newProduct.sku || !newProduct.costPrice || 
          !newProduct.price || !newProduct.stock || !newProduct.category) {
        throw new Error('All fields are required');
      }

      // Convert values to numbers
      const purchase_price = Number(newProduct.costPrice);
      const selling_price = Number(newProduct.price);
      const current_stock = Number(newProduct.stock);
      
      if (isNaN(purchase_price) || purchase_price <= 0) {
        throw new Error('Invalid cost price');
      }
      if (isNaN(selling_price) || selling_price <= 0) {
        throw new Error('Invalid selling price');
      }
      if (selling_price <= purchase_price) {
        throw new Error('Selling price must be higher than cost price');
      }
      if (isNaN(current_stock) || current_stock < 0) {
        throw new Error('Invalid stock quantity');
      }

      // Add product to storage
      localDB.add('products', {
        name: newProduct.name,
        sku: newProduct.sku,
        description: '',
        purchase_price,
        price: selling_price,
        current_stock,
        min_stock_level: Math.max(1, Math.floor(current_stock * 0.1)),
        category: newProduct.category.toLowerCase(),
        total_sold: 0,
        revenue: 0,
        created_at: new Date().toISOString()
      });

      // Clear form and reload products
      setNewProduct({
        name: '',
        sku: '',
        price: '',
        costPrice: '',
        stock: '',
        category: ''
      });
      setError('');
      loadProducts();
      toast.success('Product added successfully');
      setQuickAdd(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error adding product');
      }
    }
  };

  // Export products to CSV
  const handleExport = () => {
    const headers = ['Name', 'SKU', 'Category', 'Stock', 'Price', 'Total Sales'];
    const csvData = [
      headers.join(','),
      ...products.map(p => [
        p.name,
        p.sku,
        p.category,
        p.current_stock,
        p.price,
        p.total_sold || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-500">Manage your inventory and products</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200"
          >
            <Download size={20} /> Export
          </button>
          {hasPermission('manage_products') && (
            <button
              onClick={() => setQuickAdd(!quickAdd)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
            >
              <Plus size={20} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-gray-500 text-sm">Total Products</h3>
          <p className="text-2xl font-semibold">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-gray-500 text-sm">Low Stock Items</h3>
          <p className="text-2xl font-semibold text-yellow-500">
            {products.filter(p => p.current_stock <= p.min_stock_level).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-gray-500 text-sm">Out of Stock</h3>
          <p className="text-2xl font-semibold text-red-500">
            {products.filter(p => p.current_stock === 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-gray-500 text-sm">Total Value</h3>
          <p className="text-2xl font-semibold text-green-500">
            ${products.reduce((sum, p) => sum + (p.current_stock * p.price), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-10 border rounded-lg"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border rounded-lg min-w-[150px]"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 border rounded-lg min-w-[150px]"
          >
            <option value="name">Sort by Name</option>
            <option value="stock">Sort by Stock</option>
            <option value="price">Sort by Price</option>
          </select>
          <button
            onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
          <div className="border-l pl-4 flex gap-2">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg ${view === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
            >
              <Package size={20} />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-2 rounded-lg ${view === 'table' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
            >
              <Filter size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <Package size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  {hasPermission('manage_products') && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-blue-600">
                    ${product.price?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Cost: ${product.purchase_price?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>

              <div className="border-t px-4 py-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {product.current_stock <= product.min_stock_level ? (
                      <AlertTriangle size={16} className="text-yellow-500" />
                    ) : (
                      <Package size={16} className="text-green-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      product.current_stock === 0 ? 'text-red-600' :
                      product.current_stock <= product.min_stock_level ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {product.current_stock} in stock
                    </span>
                  </div>
                  {product.total_sold != null && product.total_sold > 0 && (
                    <span className="text-sm text-gray-500">
                      {product.total_sold} sold
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    {product.current_stock <= product.min_stock_level && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Low Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className={product.current_stock === 0 ? 'text-red-600' : 'text-gray-900'}>
                      {product.current_stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${product.price?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {hasPermission('manage_products') && (
                      <>
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-600 hover:text-blue-900 mx-2"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="text-red-600 hover:text-red-900 mx-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingProduct && (
        <EditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleEdit}
        />
      )}

      {error && (
        <div className="text-red-600 mb-4">
          {error}
        </div>
      )}
      {/* Product form */}

      {/* Quick Add Form */}
      {quickAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl transform transition-all">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Add New Product</h2>
                <p className="text-sm text-gray-500 mt-1">Fill in the product details below</p>
              </div>
              <button 
                onClick={() => setQuickAdd(false)}
                className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleQuickAdd} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Product Name */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., iPhone 14 Pro Max"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    autoFocus
                  />
                </div>

                {/* SKU and Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU/Barcode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., IPH14-PRO-128"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Select or enter category"
                      list="categories"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <datalist id="categories">
                      {categories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Price Fields */}
                <div className="col-span-2 grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newProduct.costPrice}
                        onChange={(e) => {
                          const cost = Number(e.target.value);
                          setNewProduct(prev => ({ 
                            ...prev, 
                            costPrice: e.target.value,
                            // Automatically update selling price to maintain margin
                            price: cost > 0 ? String(cost * 1.3) : prev.price 
                          }));
                        }}
                        className="w-full p-2.5 pl-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Your purchase cost per unit</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full p-2.5 pl-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Margin: {newProduct.costPrice && newProduct.price ? 
                        `${(((Number(newProduct.price) / Number(newProduct.costPrice)) - 1) * 100).toFixed(1)}%` 
                        : '0%'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Enter quantity"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    min="0"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
                  <AlertTriangle size={20} className="mr-2" />
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setQuickAdd(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium flex items-center"
                >
                  <Plus size={20} className="mr-1" />
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}