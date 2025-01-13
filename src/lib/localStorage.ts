import { Product } from '../types/product';

export interface Sale {
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

interface CustomerSaleRecord {
  id: string;
  date: string;
  amount: number;
  items: number;
  invoice: string;
  status: 'paid' | 'pending';
  products: Array<{
    category: string;
    price: number;
  }>;
}

interface CustomerSalesData {
  total_purchases: number;
  total_spent: number;
  last_purchase: string | null;
  sales: CustomerSaleRecord[];
}

interface CustomerSalesMap {
  [key: string]: CustomerSalesData;
}

interface CacheStore {
  cache: Map<string, any>;
  getWithCache(key: string): any;
  setWithCache(key: string, data: any): void;
  clearCache(): void;
}

interface BackupLocation {
  id: string;
  name: string;
  type: 'local' | 'cloud' | 'external';
  path?: string;
  lastSync?: string;
  status: 'active' | 'inactive';
}

interface BackupCopy {
  id: string;
  timestamp: string;
  size: number;
  version: string;
  hash: string;
  locations: string[];  // IDs of backup locations
}

interface LocalDB extends CacheStore {
  getAll: (key: string) => any[];
  get: (key: string, id?: string) => any;
  set: (key: string, data: any) => void;
  add: (key: string, data: any) => any;
  remove: (key: string, id: string) => void;
  insert: (key: string, data: any) => any;
  update: (key: string, id: string, data: any) => void;
  delete: (key: string, id: string) => void;
  addSale: (sale: Sale) => Sale;
  getCustomerSales: (customerId: string) => CustomerSalesData;
  getCustomerSalesReport: (customerId: string, startDate: Date, endDate: Date) => CustomerSalesData;
  recalculateCustomerTotals: () => void;
  recalculateAllTotals: () => void;
  exportBackup: () => Promise<BackupMetadata>;
  restoreBackup: (file: File) => Promise<void>;
  checkVersion: () => void;
  migrateData: (fromVersion: number) => void;
  validateData: () => string[];
  indexData: () => void;
  validateDataIntegrity: () => DataValidationResult;
  searchProducts: (query: string) => Product[];
  searchCustomers: (query: string) => Customer[];
  getBackupStatus: () => BackupStatus;
  scheduleBackup: () => void;
  searchIndex: {
    products: Map<string, string[]>;
    customers: Map<string, string[]>;
  };
  lastValidation: DataValidationResult | null;
  checkSystemHealth: () => SystemHealth;
  validateBackupData: (data: any) => { isValid: boolean; errors: string[] };
  getAutoBackupSettings: () => AutoBackupSettings;
  setAutoBackupSettings: (settings: Partial<AutoBackupSettings>) => void;
  performAutoBackup: () => Promise<boolean>;
  calculateNextBackup: (frequency: AutoBackupSettings['frequency']) => string;
  getBackupLocations: () => BackupLocation[];
  addBackupLocation: (location: Omit<BackupLocation, 'id'>) => BackupLocation;
  removeBackupLocation: (id: string) => void;
  getBackupCopies: () => BackupCopy[];
  createBackupCopy: () => Promise<BackupCopy>;
  syncBackups: () => Promise<void>;
  calculateHash: (data: string) => Promise<string>;
  saveToLocation: (copy: BackupCopy, data: any, location: BackupLocation) => Promise<void>;
  loadBackupData: (backupId: string) => Promise<any>;
  getBackupHistory: () => BackupHistory;
  addBackupHistoryEntry: (entry: Omit<BackupHistoryEntry, 'id'>) => void;
  downloadBackup: (id: string) => Promise<void>;
  needsBackup: () => boolean;
  startAutoBackupChecker: () => void;
  isBackupInProgress: () => boolean;
  setBackupInProgress: (inProgress: boolean) => void;
  verifyBackup: (backupId: string) => Promise<boolean>;
  cleanupOldBackups: (policy: RetentionPolicy) => Promise<void>;
  notifyBackupStatus: (notification: BackupNotification) => void;
  createStartupBackup: () => Promise<void>;
  createShutdownBackup: () => Promise<void>;
  getStoredBackups: () => Array<{key: string; metadata: BackupMetadata}>;
  restoreFromStoredBackup: (backupKey: string) => Promise<void>;
  cleanupStoredBackups: (keepCount: number) => void;
  deleteBackup: (backupKey: string) => void;
  getBackupFrequency: () => string;
  getNextScheduledBackup: () => string | null;
  isAutoBackupEnabled: () => boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  total_purchases: number;
  total_spent: number;
  created_at: string;
}

interface DBVersion {
  version: number;
  lastUpdated: string;
}

const DB_VERSIONS = {
  V1: 1,  // Initial version
  V2: 2,  // Added product categories
  V3: 3,  // Added customer sales tracking
  CURRENT: 3
} as const;

interface DataValidationResult {
  isValid: boolean;
  issues: string[];
  lastChecked: string;
}

interface BackupStatus {
  lastBackup: string | null;
  nextScheduledBackup: string | null;
  totalBackups: number;
}

interface BackupMetadata {
  timestamp: string;
  size: number;
  version: string;
  dataTypes: {
    products: number;
    sales: number;
    customers: number;
  };
  hash?: string;  // Optional for backward compatibility
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  lastCheck: string;
  issues: Array<{
    type: 'error' | 'warning';
    message: string;
    timestamp: string;
  }>;
  metrics: {
    dataSize: number;
    lastBackup: string | null;
    backupCount: number;
  };
}

export interface BackupHistoryEntry {
  id: string;
  timestamp: string;
  size: number;
  type: 'manual' | 'auto';
  status: 'success' | 'failed';
  locations: string[];
  metadata: BackupMetadata;
  error?: string;
}

interface BackupHistory {
  entries: BackupHistoryEntry[];
  lastBackup: string | null;
  totalBackups: number;
  totalSize: number;
}

interface AutoBackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastAutoBackup: string | null;
  nextScheduledBackup: string | null;
  isEnabled: () => boolean;
  getNextBackupTime: () => string | null;
  getFrequency: () => string;
}

export interface RetentionPolicy {
  daily: number;    // days to keep daily backups
  weekly: number;   // weeks to keep weekly backups
  monthly: number;  // months to keep monthly backups
}

export interface BackupNotification {
  type: 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

export const encryption = {
  async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  },

  async encrypt(data: string, key: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data)
    );
    return { encrypted, iv };
  },

  async decrypt(encrypted: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    return new TextDecoder().decode(decrypted);
  }
};

export interface DataValidator {
  validateProduct: (product: Product) => string[];
  validateSale: (sale: Sale) => string[];
  validateCustomer: (customer: Customer) => string[];
}

const dataValidator: DataValidator = {
  validateProduct(product: Product) {
    const errors: string[] = [];
    if (!product.name) errors.push('Product name is required');
    if (!product.sku) errors.push('SKU is required');
    if (product.price < 0) errors.push('Price must be positive');
    if (product.current_stock < 0) errors.push('Stock cannot be negative');
    return errors;
  },
  validateSale(sale: Sale) {
    const errors: string[] = [];
    if (!sale.customer_id) errors.push('Customer ID is required');
    if (!Array.isArray(sale.products)) errors.push('Products must be an array');
    if (sale.total < 0) errors.push('Total must be positive');
    return errors;
  },
  validateCustomer(customer: Customer) {
    const errors: string[] = [];
    if (!customer.name) errors.push('Customer name is required');
    if (customer.total_purchases < 0) errors.push('Total purchases must be non-negative');
    if (customer.total_spent < 0) errors.push('Total spent must be non-negative');
    return errors;
  }
};

export const localDB: LocalDB = {
  getAll: (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },
  get: (key, id?) => {
    if (id) {
      const items = localDB.getAll(key);
      return items.find(item => item.id === id);
    }
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  set: (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  },
  add: (key: string, data: any) => {
    if (key === 'products') {
      const errors = dataValidator.validateProduct(data);
      if (errors.length > 0) {
        throw new Error(`Invalid product data: ${errors.join(', ')}`);
      }
    }
    const items = localDB.getAll(key);
    const newItem = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...data
    };
    items.push(newItem);
    localDB.set(key, items);
    return newItem;
  },
  remove: (key, id) => {
    const items = localDB.getAll(key);
    localDB.set(key, items.filter(item => item.id !== id));
  },
  insert: (key, data) => {
    const items = localDB.getAll(key);
    const newItem = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...data
    };
    items.push(newItem);
    localDB.set(key, items);
    return newItem;
  },
  update: (key, id, data) => {
    const items = localDB.getAll(key);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data };
      localDB.set(key, items);
    }
  },
  delete: (key, id) => {
    const items = localDB.getAll(key);
    localDB.set(key, items.filter(item => item.id !== id));
  },
  addSale(sale: Sale) {
    const sales = this.getAll('sales');
    sales.push(sale);
    this.set('sales', sales);

    sale.products.forEach(product => {
      const existingProduct = this.get('products', product.id);
      if (existingProduct) {
        this.update('products', product.id, {
          ...existingProduct,
          current_stock: existingProduct.current_stock - product.quantity
        });
      }
    });

    this.recalculateCustomerTotals();
    return sale;
  },
  getCustomerSales(customerId: string): CustomerSalesData {
    const customerSales = this.get('customer_sales') as CustomerSalesMap || {};
    return customerSales[customerId] || {
      total_purchases: 0,
      total_spent: 0,
      last_purchase: null,
      sales: []
    };
  },
  getCustomerSalesReport(customerId: string, startDate: Date, endDate: Date): CustomerSalesData {
    const customerSales = this.getCustomerSales(customerId);
    const filteredSales = customerSales.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const report: CustomerSalesData = {
      total_purchases: filteredSales.length,
      total_spent: filteredSales.reduce((sum, sale) => sum + sale.amount, 0),
      last_purchase: filteredSales[0]?.date || null,
      sales: filteredSales.map(sale => ({
        id: sale.id,
        date: sale.date,
        amount: sale.amount,
        items: sale.items,
        invoice: sale.invoice,
        status: sale.status,
        products: sale.products || []
      }))
    };

    return report;
  },
  recalculateCustomerTotals() {
    try {
      const customers = this.getAll('customers');
      const sales = this.getAll('sales');
      const customerSalesMap: { [key: string]: any } = {};

      // Reset all customer totals first
      customers.forEach(customer => {
        customer.total_purchases = 0;
        customer.total_spent = 0;
      });

      // Calculate totals from sales
      sales.forEach(sale => {
        const customer = customers.find(c => c.id === sale.customer_id);
        if (customer) {
          // Update customer totals
          customer.total_purchases += 1;
          customer.total_spent += Number(sale.total);

          // Update customer sales map
          if (!customerSalesMap[sale.customer_id]) {
            customerSalesMap[sale.customer_id] = {
              total_purchases: 0,
              total_spent: 0,
              sales: []
            };
          }

          customerSalesMap[sale.customer_id].total_purchases += 1;
          customerSalesMap[sale.customer_id].total_spent += Number(sale.total);
          customerSalesMap[sale.customer_id].sales.push({
            id: sale.id,
            date: sale.created_at,
            amount: sale.total,
            items: sale.products.length
          });
        }
      });

      // Save updated customers
      this.set('customers', customers);
      
      // Save updated customer sales map
      this.set('customer_sales', customerSalesMap);

      console.log('Updated customer totals:', {
        customers,
        customerSalesMap
      });
    } catch (error) {
      console.error('Error in recalculateCustomerTotals:', error);
      throw error;
    }
  },
  async recalculateAllTotals() {
    try {
      this.recalculateCustomerTotals();
      
      // Recalculate product totals
      const sales = this.getAll('sales');
      const products = this.getAll('products');
      
      products.forEach(product => {
        let total_sold = 0;
        let revenue = 0;
        
        sales.forEach(sale => {
          const productInSale = sale.products.find(p => p.id === product.id);
          if (productInSale) {
            total_sold += Number(productInSale.quantity);
            revenue += Number(productInSale.price) * Number(productInSale.quantity);
          }
        });
        
        this.update('products', product.id, {
          ...product,
          total_sold,
          revenue
        });
      });
    } catch (error) {
      console.error('Error in recalculateAllTotals:', error);
      throw error;
    }
  },
  async exportBackup(): Promise<BackupMetadata> {
    try {
      const data = {
        products: this.getAll('products'),
        sales: this.getAll('sales'),
        customers: this.getAll('customers'),
        customer_sales: this.get('customer_sales'),
      };

      // Check total localStorage size
      const totalSize = new Blob([JSON.stringify(localStorage)]).size;
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      
      if (totalSize > maxSize * 0.9) { // 90% of limit
        // Clean up old backups if near limit
        this.cleanupStoredBackups(5);
      }

      // Create backup metadata
      const metadata: BackupMetadata = {
        timestamp: new Date().toISOString(),
        size: new Blob([JSON.stringify(data)]).size,
        version: '1.0',
        dataTypes: {
          products: data.products.length,
          sales: data.sales.length,
          customers: data.customers.length
        },
        hash: await this.calculateHash(JSON.stringify(data))
      };

      const backupData = {
        metadata,
        data
      };

      // Store backup in localStorage
      const backupKey = `backup_${new Date().toISOString()}`;
      this.set(backupKey, backupData);
      
      // Update backup list
      const backupsList = this.get('backups_list') || [];
      backupsList.push(backupKey);
      this.set('backups_list', backupsList);

      return metadata;
    } catch (error) {
      throw new Error('Failed to create backup');
    }
  },
  async restoreBackup(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (!event.target) {
            throw new Error('Failed to read file');
          }

          const backupData = JSON.parse(event.target.result as string);
          
          // Validate backup structure
          if (!backupData.metadata || !backupData.data) {
            throw new Error('Invalid backup file format');
          }

          // Validate data integrity
          const validationResult = this.validateBackupData(backupData.data);
          if (!validationResult.isValid) {
            throw new Error(`Invalid backup data: ${validationResult.errors.join(', ')}`);
          }

          // Restore data
          this.set('products', backupData.data.products);
          this.set('sales', backupData.data.sales);
          this.set('customers', backupData.data.customers);
          this.set('customer_sales', backupData.data.customer_sales);

          // Update restore history
          const restoreHistory = this.get('restore_history') || [];
          restoreHistory.push({
            timestamp: new Date().toISOString(),
            backupMetadata: backupData.metadata
          });
          this.set('restore_history', restoreHistory);

          resolve();
        } catch (error) {
          reject(new Error('Failed to restore backup'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading backup file'));
      reader.readAsText(file);
    });
  },
  checkVersion() {
    const version = this.get('db_version') as DBVersion;
    if (!version || version.version < DB_VERSIONS.CURRENT) {
      this.migrateData(version?.version || 0);
    }
  },
  migrateData(fromVersion: number) {
    // Handle data migrations between versions
    if (fromVersion < 1) {
      // Migrate to version 1
      const products = this.getAll('products');
      products.forEach(product => {
        if (!product.category) product.category = 'Uncategorized';
      });
      this.set('products', products);
    }

    this.set('db_version', {
      version: DB_VERSIONS.CURRENT,
      lastUpdated: new Date().toISOString()
    });
  },
  validateData() {
    const issues: string[] = [];

    // Check product integrity
    const products = this.getAll('products');
    products.forEach(product => {
      if (product.current_stock < 0) {
        issues.push(`Invalid stock for product: ${product.name}`);
      }
      if (product.price < product.purchase_price) {
        issues.push(`Price less than cost for product: ${product.name}`);
      }
    });

    // Check sales integrity
    const sales = this.getAll('sales');
    sales.forEach(sale => {
      const calculatedTotal = sale.products.reduce(
        (sum: number, p: { price: number; quantity: number }) => 
          sum + (p.price * p.quantity), 
        0
      );
      if (Math.abs(calculatedTotal - sale.total) > 0.01) {
        issues.push(`Total mismatch in sale: ${sale.invoice_number}`);
      }
    });

    return issues;
  },
  indexData() {
    // Index products
    const products = this.getAll('products');
    products.forEach(product => {
      const terms = [
        product.name.toLowerCase(),
        product.sku.toLowerCase(),
        product.category.toLowerCase()
      ];
      terms.forEach(term => {
        const existing = this.searchIndex.products.get(term) || [];
        this.searchIndex.products.set(term, [...existing, product.id]);
      });
    });
  },
  cache: new Map(),
  searchIndex: {
    products: new Map(),
    customers: new Map()
  },
  lastValidation: null,

  getWithCache(key: string): any {
    if (!this.cache.has(key)) {
      const data = localStorage.getItem(key);
      this.cache.set(key, data ? JSON.parse(data) : null);
    }
    return this.cache.get(key);
  },

  setWithCache(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
    this.cache.set(key, data);
  },

  clearCache(): void {
    this.cache.clear();
  },

  validateDataIntegrity(): DataValidationResult {
    if (this.lastValidation && 
        Date.now() - new Date(this.lastValidation.lastChecked).getTime() < 3600000) {
      return this.lastValidation;
    }

    const issues: string[] = [];
    
    // Validate products
    const products = this.getAll('products');
    products.forEach(product => {
      if (!product.id || !product.name || product.price < 0) {
        issues.push(`Invalid product data: ${product.name || 'Unknown'}`);
      }
    });

    // Validate sales
    const sales = this.getAll('sales');
    sales.forEach(sale => {
      if (!sale.products?.length || !sale.total || !sale.customer_id) {
        issues.push(`Invalid sale data: ${sale.invoice_number}`);
      }
    });

    const result = {
      isValid: issues.length === 0,
      issues,
      lastChecked: new Date().toISOString()
    };

    this.lastValidation = result;
    return result;
  },

  searchProducts(query: string): Product[] {
    const searchTerm = query.toLowerCase();
    return this.getAll('products').filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  },

  searchCustomers(query: string): Customer[] {
    const searchTerm = query.toLowerCase();
    return this.getAll('customers').filter(customer => 
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm) ||
      customer.phone?.toLowerCase().includes(searchTerm)
    );
  },

  getBackupStatus(): BackupStatus {
    const backups = this.get('backups') || {
      lastBackup: null,
      nextScheduledBackup: null,
      totalBackups: 0
    };
    return backups;
  },

  scheduleBackup(): void {
    const nextBackup = new Date();
    nextBackup.setDate(nextBackup.getDate() + 1); // Schedule for tomorrow
    
    const backupStatus = this.getBackupStatus();
    this.set('backups', {
      ...backupStatus,
      nextScheduledBackup: nextBackup.toISOString()
    });
  },

  checkSystemHealth(): SystemHealth {
    const issues = [];
    const now = new Date();

    // Check backup status
    const lastBackup = this.getBackupStatus().lastBackup;
    if (!lastBackup || new Date(lastBackup).getTime() < now.getTime() - 7 * 24 * 60 * 60 * 1000) {
      issues.push({
        type: 'warning' as const,
        message: 'No recent backup found. Consider creating a new backup.',
        timestamp: now.toISOString()
      });
    }

    // Check data integrity
    const validationIssues = this.validateData();
    issues.push(...validationIssues.map(issue => ({
      type: 'error' as const,
      message: issue,
      timestamp: now.toISOString()
    })));

    // Calculate total data size
    const dataSize = new Blob([JSON.stringify({
      products: this.getAll('products'),
      sales: this.getAll('sales'),
      customers: this.getAll('customers')
    })]).size;

    return {
      status: issues.some(i => i.type === 'error') ? 'error' : 
              issues.length > 0 ? 'warning' : 'healthy',
      lastCheck: now.toISOString(),
      issues,
      metrics: {
        dataSize,
        lastBackup: this.getBackupStatus().lastBackup,
        backupCount: this.getBackupStatus().totalBackups
      }
    };
  },

  validateBackupData(data: any) {
    const errors: string[] = [];
    
    // Check required collections exist
    if (!Array.isArray(data.products)) {
      errors.push('Products data is missing or invalid');
    }
    if (!Array.isArray(data.sales)) {
      errors.push('Sales data is missing or invalid');
    }
    if (!Array.isArray(data.customers)) {
      errors.push('Customers data is missing or invalid');
    }

    // Validate product data
    data.products?.forEach((product: any, index: number) => {
      if (!product.id || !product.name || typeof product.price !== 'number') {
        errors.push(`Invalid product at index ${index}`);
      }
    });

    // Validate sales data
    data.sales?.forEach((sale: any, index: number) => {
      if (!sale.id || !sale.customer_id || !Array.isArray(sale.products)) {
        errors.push(`Invalid sale at index ${index}`);
      }
    });

    // Validate customer data
    data.customers?.forEach((customer: any, index: number) => {
      if (!customer.id || !customer.name) {
        errors.push(`Invalid customer at index ${index}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  getAutoBackupSettings(): AutoBackupSettings {
    return this.get('auto_backup_settings') || {
      enabled: false,
      frequency: 'daily',
      lastAutoBackup: null,
      nextScheduledBackup: null
    };
  },

  setAutoBackupSettings(settings: Partial<AutoBackupSettings>) {
    const current = this.getAutoBackupSettings();
    this.set('auto_backup_settings', { ...current, ...settings });
  },

  async performAutoBackup() {
    // Prevent multiple backups from running simultaneously
    if (this.isBackupInProgress()) {
      console.log('Backup already in progress, skipping...');
      return false;
    }

    try {
      this.setBackupInProgress(true);
      
      // Ensure backup history is initialized
      if (!this.get('backup_history')) {
        this.set('backup_history', { entries: [] });
      }
      
      const metadata = await this.exportBackup();
      
      const backupEntry: Omit<BackupHistoryEntry, 'id'> = {
        timestamp: new Date().toISOString(),
        size: metadata.size,
        type: 'auto',
        status: 'success',
        locations: ['local'],
        metadata,
      };
      
      this.addBackupHistoryEntry(backupEntry);

      // Update settings
      const settings = this.getAutoBackupSettings();
      settings.lastAutoBackup = new Date().toISOString();
      settings.nextScheduledBackup = this.calculateNextBackup(settings.frequency);
      this.setAutoBackupSettings(settings);

      return true;
    } catch (error: any) {
      console.error('Auto backup failed:', error);
      // Log failure with more details
      const failureEntry: Omit<BackupHistoryEntry, 'id'> = {
        timestamp: new Date().toISOString(),
        size: 0,
        type: 'auto',
        status: 'failed',
        locations: [],
        metadata: {
          timestamp: new Date().toISOString(),
          size: 0,
          version: '1.0',
          dataTypes: { products: 0, sales: 0, customers: 0 }
        },
        error: error.message
      };
      
      this.addBackupHistoryEntry(failureEntry);
      throw error; // Re-throw to handle in calling code
    } finally {
      this.setBackupInProgress(false);
    }
  },

  calculateNextBackup(frequency: AutoBackupSettings['frequency']): string {
    const next = new Date();
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next.toISOString();
  },

  getBackupLocations(): BackupLocation[] {
    return this.get('backup_locations') || [
      {
        id: 'local',
        name: 'Local Storage',
        type: 'local',
        path: 'localStorage',
        status: 'active'
      }
    ];
  },

  addBackupLocation(location: Omit<BackupLocation, 'id'>): BackupLocation {
    const locations = this.getBackupLocations();
    const newLocation = {
      ...location,
      id: crypto.randomUUID(),
      lastSync: undefined
    };
    locations.push(newLocation);
    this.set('backup_locations', locations);
    return newLocation;
  },

  removeBackupLocation(id: string): void {
    const locations = this.getBackupLocations();
    this.set('backup_locations', locations.filter(loc => loc.id !== id));
  },

  getBackupCopies(): BackupCopy[] {
    return this.get('backup_copies') || [];
  },

  async createBackupCopy(): Promise<BackupCopy> {
    const data = {
      products: this.getAll('products'),
      sales: this.getAll('sales'),
      customers: this.getAll('customers'),
      customer_sales: this.get('customer_sales')
    };

    const serializedData = JSON.stringify(data);
    const hash = await this.calculateHash(serializedData);
    const size = new Blob([serializedData]).size;

    const copy: BackupCopy = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      size,
      version: '1.0',
      hash,
      locations: ['local']  // Start with local storage
    };

    // Save to all active locations
    const locations = this.getBackupLocations().filter(loc => loc.status === 'active');
    
    for (const location of locations) {
      try {
        await this.saveToLocation(copy, data, location);
        copy.locations.push(location.id);
      } catch (error) {
        console.error(`Failed to save to location ${location.name}:`, error);
      }
    }

    // Update backup copies list
    const copies = this.getBackupCopies();
    copies.push(copy);
    this.set('backup_copies', copies);

    return copy;
  },

  async calculateHash(data: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async saveToLocation(
    copy: BackupCopy,
    data: any,
    location: BackupLocation
  ): Promise<void> {
    const backupData = {
      metadata: {
        id: copy.id,
        timestamp: copy.timestamp,
        size: copy.size,
        version: copy.version,
        hash: copy.hash
      },
      data
    };

    switch (location.type) {
      case 'local':
        // Save to localStorage
        const key = `backup_${copy.id}`;
        this.set(key, backupData);
        break;

      case 'cloud':
        // Implement cloud storage saving
        // This would integrate with your cloud storage service
        break;

      case 'external':
        // Create downloadable file
        const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `store_backup_${copy.timestamp}.json`;
        a.click();
        break;
    }
  },

  async syncBackups(): Promise<void> {
    const locations = this.getBackupLocations().filter(loc => loc.status === 'active');
    const copies = this.getBackupCopies();

    for (const copy of copies) {
      for (const location of locations) {
        if (!copy.locations.includes(location.id)) {
          try {
            const data = await this.loadBackupData(copy.id);
            await this.saveToLocation(copy, data, location);
            copy.locations.push(location.id);
          } catch (error) {
            console.error(`Failed to sync backup ${copy.id} to ${location.name}:`, error);
          }
        }
      }
    }

    this.set('backup_copies', copies);
  },

  async loadBackupData(backupId: string): Promise<any> {
    if (!backupId) {
      throw new Error('Invalid backup ID');
    }

    // Try both backup_history and backups_list
    let backup = this.get(backupId);
    
    if (!backup) {
      // Check in stored backups
      const storedBackups = this.getStoredBackups();
      const found = storedBackups.find(b => b.key === backupId);
      if (found) {
        backup = this.get(found.key);
      }
    }

    if (!backup) {
      console.warn(`Backup not found: ${backupId}`);
      throw new Error('Backup not found');
    }

    // Validate backup structure
    if (!backup.data || !backup.metadata) {
      console.error(`Invalid backup structure for ID: ${backupId}`);
      throw new Error('Invalid backup structure');
    }

    return backup;
  },

  getBackupHistory(): BackupHistory {
    const history = {
      entries: Array.isArray(this.get('backup_history')?.entries) 
        ? this.get('backup_history').entries 
        : []
    };
    
    const entries = history.entries.sort(
      (a: BackupHistoryEntry, b: BackupHistoryEntry) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return {
      entries,
      lastBackup: entries[0]?.timestamp || null,
      totalBackups: entries.length,
      totalSize: entries.reduce((sum: number, entry: BackupHistoryEntry) => sum + entry.size, 0)
    };
  },

  addBackupHistoryEntry(entry: Omit<BackupHistoryEntry, 'id'>): void {
    let currentHistory = this.get('backup_history');
    if (!currentHistory || !Array.isArray(currentHistory.entries)) {
      currentHistory = { entries: [] };
      this.set('backup_history', currentHistory);
    }
    const newEntry = {
      ...entry,
      id: crypto.randomUUID()
    };
    
    currentHistory.entries = [newEntry, ...currentHistory.entries];
    
    // Keep only last 100 entries
    if (currentHistory.entries.length > 100) {
      currentHistory.entries = currentHistory.entries.slice(0, 100);
    }
    
    this.set('backup_history', currentHistory);
  },

  async downloadBackup(id: string): Promise<void> {
    const history = this.getBackupHistory();
    const entry = history.entries.find(e => e.id === id);
    if (!entry) throw new Error('Backup not found');

    // Create downloadable file
    const backupData = await this.loadBackupData(id);
    const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${entry.timestamp}.json`;
    a.click();
    return Promise.resolve();
  },

  needsBackup(): boolean {
    const settings = this.getAutoBackupSettings();
    if (!settings.enabled) return false;
    
    const nextBackup = new Date(settings.nextScheduledBackup || '');
    return nextBackup <= new Date();
  },

  startAutoBackupChecker() {
    // Check every hour if backup is needed
    setInterval(() => {
      if (this.needsBackup()) {
        this.performAutoBackup();
      }
    }, 60 * 60 * 1000); // Every hour
  },

  isBackupInProgress(): boolean {
    return this.get('backup_in_progress') || false;
  },

  setBackupInProgress(inProgress: boolean): void {
    this.set('backup_in_progress', inProgress);
  },

  async verifyBackup(backupId: string): Promise<boolean> {
    try {
      const backup = await this.loadBackupData(backupId);
      if (!backup || !backup.data) {
        console.error('Invalid backup structure');
        return false;
      }

      const serializedData = JSON.stringify(backup.data);
      const calculatedHash = await this.calculateHash(serializedData);
      
      // If backup doesn't have a hash, consider it valid but warn
      if (!backup.metadata?.hash) {
        console.warn('Backup has no hash for verification');
        return true;
      }

      return calculatedHash === backup.metadata.hash;
    } catch (error) {
      console.error('Backup verification failed:', error);
      return false;
    }
  },

  async cleanupOldBackups(policy: RetentionPolicy): Promise<void> {
    const history = this.getBackupHistory();
    const now = new Date();
    
    const filtered = history.entries.filter(entry => {
      const age = now.getTime() - new Date(entry.timestamp).getTime();
      const daysOld = age / (24 * 60 * 60 * 1000);
      
      if (daysOld <= policy.daily) return true;
      if (daysOld <= policy.weekly * 7 && entry.type === 'auto') return true;
      if (daysOld <= policy.monthly * 30 && entry.type === 'auto') return true;
      
      return false;
    });

    const removed = history.entries.length - filtered.length;
    if (removed > 0) {
      console.log(`Cleaned up ${removed} old backups`);
    }

    this.set('backup_history', { entries: filtered });
  },

  notifyBackupStatus(notification: BackupNotification): void {
    const notifications = this.get('backup_notifications') || [];
    notifications.unshift(notification);
    
    // Keep last 50 notifications
    if (notifications.length > 50) {
      notifications.length = 50;
    }
    
    this.set('backup_notifications', notifications);
    
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification('Backup Status', {
        body: notification.message,
        icon: '/backup-icon.png'
      });
    }
  },

  async createStartupBackup(): Promise<void> {
    try {
      console.log('Creating startup backup...');
      const metadata = await this.exportBackup();
      
      // Add to backup history
      this.addBackupHistoryEntry({
        timestamp: new Date().toISOString(),
        size: metadata.size,
        type: 'auto',
        status: 'success',
        locations: ['local'],
        metadata,
      });

      console.log('Startup backup created successfully');
    } catch (error) {
      console.error('Failed to create startup backup:', error);
      throw error;
    }
  },

  async createShutdownBackup(): Promise<void> {
    try {
      console.log('Creating shutdown backup...');
      const metadata = await this.exportBackup();
      
      // Add to backup history
      this.addBackupHistoryEntry({
        timestamp: new Date().toISOString(),
        size: metadata.size,
        type: 'auto',
        status: 'success',
        locations: ['local'],
        metadata,
      });

      console.log('Shutdown backup created successfully');
    } catch (error) {
      console.error('Failed to create shutdown backup:', error);
      throw error;
    }
  },

  getStoredBackups(): Array<{key: string; metadata: BackupMetadata}> {
    const backupsList = this.get('backups_list') || [];
    return backupsList
      .map((key: string) => {
        const backup = this.get(key);
        return backup ? { key, metadata: backup.metadata } : null;
      })
      .filter((backup: {key: string; metadata: BackupMetadata} | null): backup is {key: string; metadata: BackupMetadata} => backup !== null);
  },

  async restoreFromStoredBackup(backupKey: string): Promise<void> {
    const backup = this.get(backupKey);
    if (!backup) {
      throw new Error('Backup not found');
    }
    
    // Validate backup structure
    if (!backup.metadata || !backup.data) {
      throw new Error('Invalid backup format');
    }
    
    // Validate data integrity
    const validationResult = this.validateBackupData(backup.data);
    if (!validationResult.isValid) {
      throw new Error(`Invalid backup data: ${validationResult.errors.join(', ')}`);
    }
    
    // Restore data
    this.set('products', backup.data.products);
    this.set('sales', backup.data.sales);
    this.set('customers', backup.data.customers);
    this.set('customer_sales', backup.data.customer_sales);
    
    // Update restore history
    const restoreHistory = this.get('restore_history') || [];
    restoreHistory.push({
      timestamp: new Date().toISOString(),
      backupMetadata: backup.metadata
    });
    this.set('restore_history', restoreHistory);
  },

  cleanupStoredBackups(keepCount: number = 10): void {
    const backupsList = this.get('backups_list') || [];
    
    if (backupsList.length > keepCount) {
      // Remove oldest backups
      const toRemove = backupsList.slice(0, backupsList.length - keepCount);
      toRemove.forEach((key: string) => {
        localStorage.removeItem(key);
      });
      
      // Update list
      this.set('backups_list', backupsList.slice(-keepCount));
    }
  },

  deleteBackup(backupKey: string): void {
    try {
      // Get current backups list
      const backupsList = this.get('backups_list') || [];
      
      // Remove backup data
      localStorage.removeItem(backupKey);
      
      // Update backups list
      const updatedList = backupsList.filter((key: string) => key !== backupKey);
      this.set('backups_list', updatedList);
      
      // Add to backup history
      this.addBackupHistoryEntry({
        timestamp: new Date().toISOString(),
        size: 0,
        type: 'manual',
        status: 'success',
        locations: [],
        metadata: {
          timestamp: new Date().toISOString(),
          size: 0,
          version: '1.0',
          dataTypes: { products: 0, sales: 0, customers: 0 }
        }
      });
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw new Error('Failed to delete backup');
    }
  },

  getBackupFrequency(): string {
    const settings = this.getAutoBackupSettings();
    return settings.frequency;
  },

  getNextScheduledBackup(): string | null {
    const settings = this.getAutoBackupSettings();
    return settings.nextScheduledBackup;
  },

  isAutoBackupEnabled(): boolean {
    const settings = this.getAutoBackupSettings();
    return settings.enabled;
  }
};

// Initialize default data if not exists
if (!localStorage.getItem('products')) {
  localDB.set('products', []);
}
if (!localStorage.getItem('sales')) {
  localDB.set('sales', []);
}
if (!localStorage.getItem('customers')) {
  localDB.set('customers', [{
    id: 'walk-in',
    name: 'Walk-in Customer',
    email: null,
    phone: null,
    total_purchases: 0,
    total_spent: 0,
    created_at: new Date().toISOString()
  }]);
}
if (!localStorage.getItem('customer_sales')) {
  localDB.set('customer_sales', {});
}
// Initialize backup related structures
if (!localStorage.getItem('backup_history')) {
  localDB.set('backup_history', { entries: [] });
}
if (!localStorage.getItem('backups_list')) {
  localDB.set('backups_list', []);
}
if (!localStorage.getItem('backup_notifications')) {
  localDB.set('backup_notifications', []);
}

// Add version check on initialization
if (!localStorage.getItem('db_version')) {
  localDB.set('db_version', {
    version: DB_VERSIONS.CURRENT,
    lastUpdated: new Date().toISOString()
  });
}

// Start auto backup checker
localDB.startAutoBackupChecker();

export const debugDB = {
  checkData() {
    console.log('Customers:', localDB.getAll('customers'));
    console.log('Sales:', localDB.getAll('sales'));
    console.log('Customer Sales:', localDB.get('customer_sales'));
  },
  
  async recalculateAndCheck() {
    console.log('Before recalculation:', {
      customers: localDB.getAll('customers'),
      sales: localDB.getAll('sales')
    });
    
    await localDB.recalculateAllTotals();
    
    console.log('After recalculation:', {
      customers: localDB.getAll('customers'),
      sales: localDB.getAll('sales')
    });
  }
};

// Make it available in console
(window as any).debugDB = debugDB;

export const clearLocalStorage = () => {
  // Clear all data
  localStorage.clear();

  // Reinitialize with default empty data structure
  localDB.set('products', []);
  localDB.set('sales', []);
  localDB.set('customers', [{
    id: 'walk-in',
    name: 'Walk-in Customer',
    email: null,
    phone: null,
    total_purchases: 0,
    total_spent: 0,
    created_at: new Date().toISOString()
  }]);
  localDB.set('customer_sales', {});

  console.log('LocalStorage cleared and reinitialized with default empty data');
};

export const addSampleProducts = () => {
  const sampleProducts = [
    {
      name: "iPhone 13 Pro",
      description: "Apple's flagship smartphone with Pro camera system",
      sku: "IPH13P-256",
      price: 999,
      current_stock: 15,
      min_stock_level: 5,
      category: "Smartphones",
      total_sold: 0,
      revenue: 0
    },
    {
      name: "Samsung Galaxy S22",
      description: "Samsung's latest Android flagship",
      sku: "SGGS22-256",
      price: 899,
      current_stock: 12,
      min_stock_level: 4,
      category: "Smartphones",
      total_sold: 0,
      revenue: 0
    },
    {
      name: "AirPods Pro",
      description: "Wireless earbuds with active noise cancellation",
      sku: "APP-2GEN",
      price: 249,
      current_stock: 25,
      min_stock_level: 8,
      category: "Accessories",
      total_sold: 0,
      revenue: 0
    },
    {
      name: "Samsung Galaxy Watch 5",
      description: "Advanced health tracking smartwatch",
      sku: "SGW5-44",
      price: 329,
      current_stock: 10,
      min_stock_level: 3,
      category: "Wearables",
      total_sold: 0,
      revenue: 0
    },
    {
      name: "iPad Air",
      description: "Powerful and portable tablet",
      sku: "IPAD-AIR-64",
      price: 599,
      current_stock: 8,
      min_stock_level: 3,
      category: "Tablets",
      total_sold: 0,
      revenue: 0
    },
    {
      name: "Google Pixel 7",
      description: "Google's latest smartphone with advanced AI",
      sku: "GP7-128",
      price: 699,
      current_stock: 7,
      min_stock_level: 3,
      category: "Smartphones",
      total_sold: 0,
      revenue: 0
    },
    {
      name: "Phone Case",
      description: "Protective case for smartphones",
      sku: "CASE-GEN",
      price: 29.99,
      current_stock: 50,
      min_stock_level: 20,
      category: "Accessories",
      total_sold: 0,
      revenue: 0
    },
    {
      name: "Screen Protector",
      description: "Tempered glass screen protection",
      sku: "SCRN-PRO",
      price: 14.99,
      current_stock: 100,
      min_stock_level: 30,
      category: "Accessories",
      total_sold: 0,
      revenue: 0
    }
  ];

  // Add each product using localDB.add
  sampleProducts.forEach(product => {
    localDB.insert('products', {
      ...product,
      total_sold: 0,
      revenue: 0,
      created_at: new Date().toISOString()
    });
  });

  console.log(`Added ${sampleProducts.length} sample products to the database`);
  return sampleProducts;
};

// Make it available globally for console access
(window as any).addSampleProducts = addSampleProducts;
(window as any).clearLocalStorage = clearLocalStorage;

export const testBackupRestore = async () => {
  try {
    // 1. Add some test data
    localDB.insert('products', {
      name: "Test iPhone",
      sku: "TEST-123",
      price: 999,
      current_stock: 10,
      category: "Smartphones"
    });

    // 2. Create backup
    localDB.exportBackup();
    console.log("✅ Backup created successfully");

    // 3. Clear all data
    localStorage.clear();
    console.log("🗑️ Local storage cleared");

    // 4. Verify data is gone
    const productsBeforeRestore = localDB.getAll('products');
    console.log("Products before restore:", productsBeforeRestore);

    // 5. Simulate file selection and restore
    // Note: You'll need to manually select the backup file
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await localDB.restoreBackup(file);
        console.log("✅ Restore completed");
        console.log("Products after restore:", localDB.getAll('products'));
      }
    };
    fileInput.click();

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Make it available in console
(window as any).testBackupRestore = testBackupRestore;

export const testAutoBackup = async () => {
  try {
    console.log('🔄 Testing Automatic Backup System...');

    // 1. Configure auto-backup settings
    localDB.setAutoBackupSettings({
      enabled: true,
      frequency: 'daily',
      lastAutoBackup: null,
      nextScheduledBackup: null
    });
    console.log('✅ Auto-backup enabled with daily frequency');

    // 2. Add some test data
    const testProduct = localDB.insert('products', {
      name: "Auto-Backup Test Product",
      sku: "AUTO-TEST-123",
      price: 99.99,
      current_stock: 5,
      category: "Test"
    });
    console.log('✅ Added test product:', testProduct.name);

    // 3. Trigger auto backup
    const backupSuccess = await localDB.performAutoBackup();
    if (backupSuccess) {
      console.log('✅ Auto-backup completed successfully');
    } else {
      console.log('❌ Auto-backup failed');
    }

    // 4. Check backup history
    const history = localDB.getBackupHistory();
    console.log('📋 Backup History:', {
      totalBackups: history.totalBackups,
      lastBackup: history.lastBackup,
      totalSize: `${(history.totalSize / 1024).toFixed(2)} KB`
    });

    // 5. Check next scheduled backup
    const settings = localDB.getAutoBackupSettings();
    console.log('⏰ Next backup scheduled for:', new Date(settings.nextScheduledBackup!).toLocaleString());

    // 6. Simulate backup rotation (create multiple backups)
    console.log('🔄 Testing backup rotation...');
    for (let i = 0; i < 3; i++) {
      await localDB.performAutoBackup();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between backups
    }

    const finalHistory = localDB.getBackupHistory();
    console.log('📋 Final Backup History:', {
      totalBackups: finalHistory.totalBackups,
      recentBackups: finalHistory.entries.slice(0, 3).map(entry => ({
        timestamp: new Date(entry.timestamp).toLocaleString(),
        size: `${(entry.size / 1024).toFixed(2)} KB`,
        type: entry.type
      }))
    });

  } catch (error) {
    console.error('❌ Auto-backup test failed:', error);
  }
};

// Make it available in console
(window as any).testAutoBackup = testAutoBackup;

export const testStoredBackups = async () => {
  try {
    console.log('🧪 Testing Stored Backups System...');

    // 1. Add some test data
    console.log('📝 Adding test data...');
    localDB.insert('products', {
      name: "Stored Backup Test Product",
      sku: "STORE-TEST-123",
      price: 199.99,
      current_stock: 10,
      category: "Test"
    });

    // 2. Create multiple backups
    console.log('💾 Creating backups...');
    for (let i = 0; i < 3; i++) {
      await localDB.performAutoBackup();
      console.log(`✅ Backup ${i + 1} created`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. List stored backups
    const storedBackups = localDB.getStoredBackups();
    console.log('📋 Stored Backups:', storedBackups.map(b => ({
      timestamp: new Date(b.metadata.timestamp).toLocaleString(),
      size: `${(b.metadata.size / 1024).toFixed(2)} KB`
    })));

    // 4. Test backup cleanup
    console.log('🧹 Testing backup cleanup...');
    localDB.cleanupStoredBackups(2); // Keep only 2 most recent backups
    const remainingBackups = localDB.getStoredBackups();
    console.log(`✅ Backups after cleanup: ${remainingBackups.length}`);

    // 5. Test restore
    console.log('🔄 Testing backup restore...');
    if (remainingBackups.length > 0) {
      const latestBackup = remainingBackups[0];
      await localDB.restoreFromStoredBackup(latestBackup.key);
      console.log('✅ Restore completed');
    }

    // 6. Verify storage usage
    const totalSize = new Blob([JSON.stringify(localStorage)]).size;
    console.log(`📊 Total localStorage usage: ${(totalSize / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Make it available in console
(window as any).testStoredBackups = testStoredBackups;

// Add automatic backup before risky operations
const withBackup = async (operation: () => void) => {
  try {
    // Create quick backup
    const snapshot = {
      timestamp: new Date().toISOString(),
      data: { ...localStorage }
    };
    sessionStorage.setItem('last_backup', JSON.stringify(snapshot));
    
    // Perform operation
    operation();
  } catch (error) {
    // Restore from backup if operation fails
    const backup = sessionStorage.getItem('last_backup');
    if (backup) {
      const { data } = JSON.parse(backup);
      Object.keys(data).forEach(key => {
        localStorage.setItem(key, data[key]);
      });
    }
    throw error;
  }
};

// Use in risky operations
localDB.recalculateAllTotals = async () => {
  await withBackup(() => {
    // Existing recalculation logic...
  });
};

// Add periodic integrity checks
const integrityChecker = {
  checkRelations() {
    const sales = localDB.getAll('sales');
    const products = localDB.getAll('products');
    const customers = localDB.getAll('customers');

    const orphanedSales = sales.filter(sale => 
      !customers.find(c => c.id === sale.customer_id)
    );

    interface ProductItem {
      id: string;
      quantity: number;
      price: number;
    }

    const invalidProducts = sales.flatMap(sale =>
      sale.products.filter((p: ProductItem) => 
        !products.find(prod => prod.id === p.id)
      )
    );

    return {
      orphanedSales,
      invalidProducts
    };
  }
};

// Run periodic checks
setInterval(() => {
  const issues = integrityChecker.checkRelations();
  if (issues.orphanedSales.length || issues.invalidProducts.length) {
    console.warn('Data integrity issues found:', issues);
  }
}, 60 * 60 * 1000); // Check every hour 