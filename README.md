# Logi Inventory

A logistics inventory management system for MUN Society. Built with React, Vite, Tailwind CSS, and Supabase.

Tracks items in a central inventory, dispatches them to committees, and maintains a full dispatch log. Each account has its own isolated data with a default inventory created on sign-up.

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

5. In Supabase, go to Authentication > Providers > Email and turn off "Confirm email" so new accounts can sign in immediately.

6. Start the development server:

```
npm run dev
```

The app will be available at `http://localhost:5173`. Create an account from the login page. The default inventory items will be created automatically.

## Supabase SQL

Copy and run this entire block in the Supabase SQL Editor.

```sql
-- Tables (each row is scoped to the signed-in user)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, user_id)
);

CREATE TABLE main_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(item_id, user_id)
);

CREATE TABLE committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, user_id)
);

CREATE TABLE committee_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(committee_id, item_id, user_id)
);

CREATE TABLE dispatch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  committee_id UUID,
  item_id UUID,
  quantity INTEGER NOT NULL,
  dispatched_at TIMESTAMPTZ DEFAULT now(),
  note TEXT,
  item_name TEXT,
  committee_name TEXT
);

-- Row-level security (users can only access their own data)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_log ENABLE ROW LEVEL SECURITY;

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

-- Default inventory created automatically for every new user on sign-up
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

-- Dispatch function (moves items from main inventory to a committee)
CREATE OR REPLACE FUNCTION dispatch_item(
  p_committee_id UUID,
  p_item_id UUID,
  p_quantity INTEGER
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

  INSERT INTO dispatch_log (committee_id, item_id, quantity, item_name, committee_name)
    VALUES (
      p_committee_id,
      p_item_id,
      p_quantity,
      (SELECT name FROM items WHERE id = p_item_id),
      (SELECT name FROM committees WHERE id = p_committee_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Account deletion (lets users delete their own account from the app)
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
