import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
  Shield,
  History,
} from 'lucide-react';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/sales', icon: ShoppingCart, label: 'Sales' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/admin', icon: Shield, label: 'Admin' },
  { path: '/sales-history', label: 'Sales History', icon: History }
];

function Layout() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-blue-600">MobileStore</h1>
        </div>
        <nav className="mt-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600'
                    : ''
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => logout()}
            className="w-full flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;