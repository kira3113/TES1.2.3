import { localDB } from '../../lib/localStorage';

export function InventoryReports() {
  const products = localDB.getAll('products');
  const sales = localDB.getAll('sales');

  // Calculate total inventory value
  const inventoryValue = products.reduce((total, product) => {
    return total + (product.price * product.current_stock);
  }, 0);

  // Calculate sales value
  const salesValue = sales.reduce((total, sale) => {
    return total + (sale.total || 0);
  }, 0);

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-bold mb-2">Inventory Value</h3>
          <p className="text-2xl font-bold text-blue-600">
            ${inventoryValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-bold mb-2">Total Sales Value</h3>
          <p className="text-2xl font-bold text-green-600">
            ${salesValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  ${product.price?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {product.current_stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  ${(product.price * product.current_stock).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 