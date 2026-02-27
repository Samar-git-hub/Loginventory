# Logi Inventory

A logistics inventory management system for MUN Society. Built with React, Vite, Tailwind CSS, and Supabase.

Two roles: Admin (inventory team) manages stock, dispatches runners. Requester (floor in-charges) makes item requests, tracks delivery.

## Prerequisites

- Node.js (v18 or later)
- A Supabase project

## Setup

1. Clone the repository and navigate to the project folder:

```
cd mun-logi-inventory
```

2. Install dependencies:

```
npm install
```

3. Create a `.env` file in the `mun-logi-inventory` directory with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project under Settings > API.

4. Run the Supabase SQL query below in the Supabase SQL Editor.

5. In Supabase, go to Authentication > Providers > Email and turn off "Confirm email".

6. Start the development server:

```
npm run dev
```

The app will be available at `http://localhost:5173`.

## Supabase SQL

Copy and run this entire block in the Supabase SQL Editor.

```sql
-- Items
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Main inventory
CREATE TABLE main_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(item_id, user_id)
);

-- Committees
CREATE TABLE committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Committee inventory
CREATE TABLE committee_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(committee_id, item_id, user_id)
);

-- Activity log
CREATE TABLE dispatch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  committee_id UUID,
  item_id UUID,
  quantity INTEGER NOT NULL,
  dispatched_at TIMESTAMPTZ DEFAULT now(),
  note TEXT,
  item_name TEXT,
  committee_name TEXT,
  dispatcher_name TEXT,
  action_type TEXT DEFAULT 'dispatch'
);

-- User profiles (admin PIN)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY,
  admin_pin TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Requests
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  committee_id UUID,
  item_id UUID,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'requested',
  requester_name TEXT,
  dispatcher_name TEXT,
  note TEXT,
  item_name TEXT,
  committee_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row-level security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User owns data" ON items FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "User owns data" ON main_inventory FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "User owns data" ON committees FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "User owns data" ON committee_inventory FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "User owns data" ON dispatch_log FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "User owns profile" ON profiles FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "User owns data" ON requests FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Default inventory on sign-up
CREATE OR REPLACE FUNCTION public.create_default_inventory()
RETURNS trigger AS $$
DECLARE
  item_names TEXT[] := ARRAY[
    'Folder', 'Notepad', 'Pen', 'ID & Lanyard', 'Placard',
    'Sticker', 'Badge', 'Markers', 'Extension Boards', 'Water Bottles'
  ];
  item_name TEXT;
  new_item_id UUID;
BEGIN
  FOREACH item_name IN ARRAY item_names LOOP
    INSERT INTO public.items (user_id, name)
      VALUES (NEW.id, item_name) RETURNING id INTO new_item_id;
    INSERT INTO public.main_inventory (user_id, item_id, quantity)
      VALUES (NEW.id, new_item_id, 0);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_inventory();

-- Dispatch item (admin: direct dispatch to committee)
CREATE OR REPLACE FUNCTION dispatch_item(
  p_committee_id UUID,
  p_item_id UUID,
  p_quantity INTEGER,
  p_dispatcher TEXT DEFAULT ''
) RETURNS void AS $$
BEGIN
  IF (SELECT quantity FROM main_inventory WHERE item_id = p_item_id AND user_id = auth.uid()) < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock in main inventory';
  END IF;

  UPDATE main_inventory
    SET quantity = quantity - p_quantity
    WHERE item_id = p_item_id AND user_id = auth.uid();

  INSERT INTO committee_inventory (committee_id, item_id, quantity)
    VALUES (p_committee_id, p_item_id, p_quantity)
    ON CONFLICT (committee_id, item_id, user_id)
    DO UPDATE SET quantity = committee_inventory.quantity + p_quantity;

  INSERT INTO dispatch_log (committee_id, item_id, quantity, item_name, committee_name, dispatcher_name, action_type)
    VALUES (
      p_committee_id, p_item_id, p_quantity,
      (SELECT name FROM items WHERE id = p_item_id),
      (SELECT name FROM committees WHERE id = p_committee_id),
      p_dispatcher, 'dispatch'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Return item (admin: return from committee to main)
CREATE OR REPLACE FUNCTION return_item(
  p_committee_id UUID,
  p_item_id UUID,
  p_quantity INTEGER,
  p_dispatcher TEXT DEFAULT ''
) RETURNS void AS $$
BEGIN
  IF (SELECT quantity FROM committee_inventory WHERE committee_id = p_committee_id AND item_id = p_item_id AND user_id = auth.uid()) < p_quantity THEN
    RAISE EXCEPTION 'Insufficient quantity to return';
  END IF;

  UPDATE committee_inventory
    SET quantity = quantity - p_quantity
    WHERE committee_id = p_committee_id AND item_id = p_item_id AND user_id = auth.uid();

  UPDATE main_inventory
    SET quantity = quantity + p_quantity
    WHERE item_id = p_item_id AND user_id = auth.uid();

  INSERT INTO dispatch_log (committee_id, item_id, quantity, item_name, committee_name, dispatcher_name, action_type)
    VALUES (
      p_committee_id, p_item_id, p_quantity,
      (SELECT name FROM items WHERE id = p_item_id),
      (SELECT name FROM committees WHERE id = p_committee_id),
      p_dispatcher, 'return'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Dispatch request (admin: sends runner, deducts from main inventory)
CREATE OR REPLACE FUNCTION dispatch_request(
  p_request_id UUID,
  p_dispatcher TEXT
) RETURNS void AS $$
DECLARE
  req RECORD;
BEGIN
  SELECT * INTO req FROM requests WHERE id = p_request_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF req.status != 'requested' THEN RAISE EXCEPTION 'Request already processed'; END IF;

  IF (SELECT quantity FROM main_inventory WHERE item_id = req.item_id AND user_id = auth.uid()) < req.quantity THEN
    RAISE EXCEPTION 'Insufficient stock in main inventory';
  END IF;

  UPDATE main_inventory
    SET quantity = quantity - req.quantity
    WHERE item_id = req.item_id AND user_id = auth.uid();

  UPDATE requests
    SET status = 'dispatched', dispatcher_name = p_dispatcher, updated_at = now()
    WHERE id = p_request_id;

  INSERT INTO dispatch_log (committee_id, item_id, quantity, item_name, committee_name, dispatcher_name, action_type)
    VALUES (
      req.committee_id, req.item_id, req.quantity,
      req.item_name, req.committee_name,
      p_dispatcher, 'request'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fulfill request (requester: confirms receipt, moves to committee inventory)
CREATE OR REPLACE FUNCTION fulfill_request(
  p_request_id UUID
) RETURNS void AS $$
DECLARE
  req RECORD;
BEGIN
  SELECT * INTO req FROM requests WHERE id = p_request_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF req.status != 'dispatched' THEN RAISE EXCEPTION 'Request not in dispatched state'; END IF;

  INSERT INTO committee_inventory (committee_id, item_id, quantity)
    VALUES (req.committee_id, req.item_id, req.quantity)
    ON CONFLICT (committee_id, item_id, user_id)
    DO UPDATE SET quantity = committee_inventory.quantity + req.quantity;

  UPDATE requests
    SET status = 'fulfilled', updated_at = now()
    WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Account deletion
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
```

## Build for Production

```
npm run build
```

Output will be in the `dist` folder.
