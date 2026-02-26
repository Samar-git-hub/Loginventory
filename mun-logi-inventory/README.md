# Logi Inventory

A logistics inventory management system for MUN Society. Built with React, Vite, Tailwind CSS, and Supabase.

Tracks items in a central inventory, dispatches them to committees, and maintains a full dispatch log.

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

4. Run the Supabase SQL queries listed below in the Supabase SQL Editor.

5. Create a user account in Supabase Authentication (Dashboard > Authentication > Users > Add User).

6. Start the development server:

```
npm run dev
```

The app will be available at `http://localhost:5173`.

## Supabase Schema

Run these queries in order in the Supabase SQL Editor.

### Query 1 -- Tables, seed data, and RLS

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE main_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(item_id)
);

CREATE TABLE committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE committee_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID REFERENCES committees(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(committee_id, item_id)
);

CREATE TABLE dispatch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID REFERENCES committees(id),
  item_id UUID REFERENCES items(id),
  quantity INTEGER NOT NULL,
  dispatched_at TIMESTAMPTZ DEFAULT now(),
  note TEXT,
  item_name TEXT,
  committee_name TEXT
);

INSERT INTO items (name) VALUES
  ('Folder'), ('Notepad'), ('Pen'), ('ID'), ('Lanyard'),
  ('Placard'), ('Sticker'), ('Badge'), ('Markers'),
  ('Extension Board'), ('Water Bottle');

INSERT INTO main_inventory (item_id, quantity)
SELECT id, 0 FROM items;

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access" ON items FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated full access" ON main_inventory FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated full access" ON committees FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated full access" ON committee_inventory FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated full access" ON dispatch_log FOR ALL TO authenticated USING (true);
```

### Query 2 -- Dispatch function

```sql
CREATE OR REPLACE FUNCTION dispatch_item(
  p_committee_id UUID,
  p_item_id UUID,
  p_quantity INTEGER
) RETURNS void AS $$
BEGIN
  IF (SELECT quantity FROM main_inventory WHERE item_id = p_item_id) < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock in main inventory';
  END IF;

  UPDATE main_inventory
    SET quantity = quantity - p_quantity
    WHERE item_id = p_item_id;

  INSERT INTO committee_inventory (committee_id, item_id, quantity)
    VALUES (p_committee_id, p_item_id, p_quantity)
    ON CONFLICT (committee_id, item_id)
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
$$ LANGUAGE plpgsql;
```

### Query 3 -- Allow item and committee deletion without losing dispatch logs

```sql
ALTER TABLE dispatch_log DROP CONSTRAINT dispatch_log_committee_id_fkey;
ALTER TABLE dispatch_log ADD CONSTRAINT dispatch_log_committee_id_fkey
  FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE SET NULL;

ALTER TABLE dispatch_log DROP CONSTRAINT dispatch_log_item_id_fkey;
ALTER TABLE dispatch_log ADD CONSTRAINT dispatch_log_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;
```

## Build for Production

```
npm run build
```

Output will be in the `dist` folder.
