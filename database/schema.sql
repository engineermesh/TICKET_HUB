CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer','admin','organizer','inspector')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  sport_id INTEGER REFERENCES sports(id),
  event_name VARCHAR(200) NOT NULL,
  home_team VARCHAR(150),
  away_team VARCHAR(150),
  venue VARCHAR(200) NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  description TEXT,
  image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','cancelled','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_types (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_name VARCHAR(100) NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  total_quantity INTEGER NOT NULL CHECK (total_quantity >= 0),
  available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
  CHECK (available_quantity <= total_quantity)
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','cancelled','expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id INTEGER NOT NULL REFERENCES ticket_types(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0)
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  phone_number VARCHAR(20) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  checkout_request_id TEXT UNIQUE,
  mpesa_receipt_number VARCHAR(50) UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','successful','failed')),
  result_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id),
  ticket_code UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  qr_token TEXT NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'valid'
    CHECK (status IN ('valid','used','cancelled')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS check_ins (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER UNIQUE NOT NULL REFERENCES tickets(id),
  inspector_id INTEGER NOT NULL REFERENCES users(id),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_token ON tickets(qr_token);

INSERT INTO sports(name) VALUES
 ('Football'), ('Rugby'), ('Athletics'), ('Basketball'), ('Volleyball')
ON CONFLICT (name) DO NOTHING;
