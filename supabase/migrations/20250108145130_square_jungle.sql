/*
  # Initial Schema for Mobile Store Management System

  1. New Tables
    - users (managed by Supabase Auth)
    - products
      - Basic product information
      - Stock tracking
      - Price management
    - sales
      - Sales transaction records
      - Customer information
    - customers
      - Customer details for CRM
    - inventory_logs
      - Track stock changes
      - Audit trail

  2. Security
    - RLS policies for all tables
    - Role-based access control
*/

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sku text UNIQUE NOT NULL,
  purchase_price decimal(10,2) NOT NULL,
  selling_price decimal(10,2) NOT NULL,
  current_stock integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 5,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  total_purchases decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  total_amount decimal(10,2) NOT NULL,
  discount_amount decimal(10,2) DEFAULT 0,
  final_amount decimal(10,2) NOT NULL,
  payment_method text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Inventory Logs Table
CREATE TABLE IF NOT EXISTS inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  change_amount integer NOT NULL,
  change_type text NOT NULL,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated read access" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert access" ON products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update access" ON products
  FOR UPDATE TO authenticated USING (true);

-- Similar policies for other tables
CREATE POLICY "Allow authenticated full access" ON customers
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access" ON sales
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access" ON sale_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated full access" ON inventory_logs
  FOR ALL TO authenticated USING (true);

-- Functions
CREATE OR REPLACE FUNCTION update_stock_on_sale() RETURNS TRIGGER AS $$
BEGIN
  -- Update product stock
  UPDATE products
  SET current_stock = current_stock - NEW.quantity
  WHERE id = NEW.product_id;
  
  -- Create inventory log
  INSERT INTO inventory_logs (
    product_id,
    change_amount,
    change_type,
    previous_stock,
    new_stock,
    notes,
    created_by
  )
  SELECT
    NEW.product_id,
    -NEW.quantity,
    'SALE',
    current_stock + NEW.quantity,
    current_stock,
    'Sale transaction: ' || NEW.sale_id,
    (SELECT created_by FROM sales WHERE id = NEW.sale_id)
  FROM products
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_sale_item_insert
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_sale();