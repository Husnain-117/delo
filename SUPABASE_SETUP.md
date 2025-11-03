# Supabase Setup Instructions

Your `.env` file has been updated with your Supabase credentials.

## Next Steps

### 1. Run SQL Migrations in Supabase

Go to your Supabase Dashboard → SQL Editor and run these queries **in order**:

---

#### Migration 1: Main Schema (Tables, RLS, Functions)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier', 'waiter', 'chef', 'delivery');
CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE public.order_type AS ENUM ('dine_in', 'takeout', 'delivery');
CREATE TYPE public.table_status AS ENUM ('available', 'occupied', 'reserved', 'cleaning');
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'digital_wallet', 'split');
CREATE TYPE public.reservation_status AS ENUM ('confirmed', 'pending', 'cancelled', 'no_show');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create menu_categories table
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  prep_time_minutes INTEGER DEFAULT 15,
  allergens TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tables (restaurant tables) table
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL,
  section TEXT,
  status table_status DEFAULT 'available',
  current_order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  waiter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_type order_type NOT NULL DEFAULT 'dine_in',
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  service_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method,
  special_instructions TEXT,
  delivery_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  item_total DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  is_ready BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  min_threshold DECIMAL(10,2) NOT NULL DEFAULT 10,
  max_threshold DECIMAL(10,2),
  unit_price DECIMAL(10,2),
  supplier TEXT,
  last_purchase_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create staff table
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  department TEXT,
  hire_date DATE NOT NULL,
  salary DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create customers table (CRM)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  phone TEXT,
  email TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  membership_tier TEXT DEFAULT 'bronze',
  birthday DATE,
  dietary_restrictions TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  party_size INTEGER NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  status reservation_status DEFAULT 'pending',
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Create function to check if user is staff
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'manager', 'cashier', 'waiter', 'chef', 'delivery')
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_staff(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for menu_categories
CREATE POLICY "Everyone can view menu categories"
  ON public.menu_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can manage categories"
  ON public.menu_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies for menu_items
CREATE POLICY "Everyone can view available menu items"
  ON public.menu_items FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can manage menu items"
  ON public.menu_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies for tables
CREATE POLICY "Staff can view all tables"
  ON public.tables FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins and managers can manage tables"
  ON public.tables FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies for orders
CREATE POLICY "Staff can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Customers can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Staff can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_staff(auth.uid()));

-- RLS Policies for order_items
CREATE POLICY "Staff can view all order items"
  ON public.order_items FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage order items"
  ON public.order_items FOR ALL
  USING (public.is_staff(auth.uid()));

-- RLS Policies for inventory_items
CREATE POLICY "Staff can view inventory"
  ON public.inventory_items FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins and managers can manage inventory"
  ON public.inventory_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies for staff
CREATE POLICY "Staff can view staff"
  ON public.staff FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage staff"
  ON public.staff FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for customers
CREATE POLICY "Staff can view customers"
  ON public.customers FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Customers can view own record"
  ON public.customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can manage customers"
  ON public.customers FOR ALL
  USING (public.is_staff(auth.uid()));

-- RLS Policies for reservations
CREATE POLICY "Staff can view reservations"
  ON public.reservations FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Customers can view their reservations"
  ON public.reservations FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Everyone can create reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can manage reservations"
  ON public.reservations FOR ALL
  USING (public.is_staff(auth.uid()));

-- Create function to auto-generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  SELECT 'ORD-' || LPAD(CAST(COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1 AS TEXT), 6, '0')
  INTO new_number
  FROM public.orders;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
```

---

#### Migration 2: Allow Self-Assign Roles

```sql
-- Allow newly signed-in users to self-assign a limited set of roles
-- NOTE: This intentionally excludes privileged roles like 'admin' and 'manager'
CREATE POLICY "Self-assign limited roles on signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('customer','waiter','chef')
  );
```

---

#### Migration 3: Sample Data (Optional)

```sql
-- Insert sample menu categories
INSERT INTO public.menu_categories (name, description, display_order) VALUES
('Appetizers', 'Start your meal right', 1),
('Main Course', 'Hearty dishes', 2),
('Desserts', 'Sweet endings', 3),
('Beverages', 'Drinks and refreshments', 4);

-- Insert sample tables
INSERT INTO public.tables (table_number, capacity, section, status) VALUES
('1', 4, 'Main Hall', 'available'),
('2', 2, 'Main Hall', 'available'),
('3', 6, 'Patio', 'available'),
('4', 4, 'Main Hall', 'available');

-- Insert sample menu items
INSERT INTO public.menu_items (name, description, category_id, price, prep_time_minutes, is_available)
SELECT 
  'Caesar Salad',
  'Fresh romaine lettuce with parmesan and croutons',
  id,
  12.99,
  10,
  true
FROM public.menu_categories WHERE name = 'Appetizers'
LIMIT 1;

INSERT INTO public.menu_items (name, description, category_id, price, prep_time_minutes, is_available)
SELECT 
  'Grilled Salmon',
  'Atlantic salmon with seasonal vegetables',
  id,
  24.99,
  20,
  true
FROM public.menu_categories WHERE name = 'Main Course'
LIMIT 1;
```

---

### 2. Restart Your Dev Server

After running the migrations, restart your development server to pick up the new `.env` values:

```bash
npm run dev
```

---

### 3. Test the Application

1. **Sign Up** with a role (Customer, Waiter, or Chef)
2. **Verify** that you can access the appropriate panel
3. If you need admin/manager access, manually insert a role:
   ```sql
   -- Replace YOUR_USER_ID with your actual auth.users.id
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('YOUR_USER_ID', 'admin');
   ```

---

## Troubleshooting

- **Can't see any panels after signup?**
  - Check Supabase → Table Editor → `user_roles` to confirm your role was inserted
  - Check browser console for errors
  
- **RLS errors?**
  - Ensure all migrations ran successfully
  - Check Supabase → Authentication → Policies to verify RLS policies exist

- **Need to reset?**
  - Drop all tables and re-run migrations
  - Or use Supabase Dashboard → Database → Reset Database
