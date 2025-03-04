-- Create tables for photo studio booking system

-- Table for studios
CREATE TABLE IF NOT EXISTS studios (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for photo packages
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for time slots
CREATE TABLE IF NOT EXISTS slots (
  id SERIAL PRIMARY KEY,
  studio_id INTEGER REFERENCES studios(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(studio_id, date, start_time)
);

-- Table for bookings
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  studio_id INTEGER REFERENCES studios(id),
  package_id INTEGER REFERENCES packages(id),
  slot_id INTEGER REFERENCES slots(id),
  booking_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Insert some example data
INSERT INTO studios (name, description, image_url) VALUES
('Studio A', 'Our flagship studio with professional lighting setup', 'https://example.com/studio-a.jpg'),
('Studio B', 'Cozy studio perfect for portrait photography', 'https://example.com/studio-b.jpg'),
('Studio C', 'Large studio for group photoshoots', 'https://example.com/studio-c.jpg');

INSERT INTO packages (name, price, description, duration_minutes) VALUES
('Basic', 150000, 'Simple photoshoot with 5 edited photos', 60),
('Standard', 300000, 'Professional photoshoot with 10 edited photos', 90),
('Premium', 500000, 'Complete photoshoot experience with 20 edited photos and printed album', 120);

-- Create some example time slots for the next 7 days
DO $$
DECLARE
  current_date DATE := CURRENT_DATE;
  i INTEGER;
BEGIN
  FOR i IN 0..6 LOOP
    -- Studio A slots (9 AM to 5 PM, hourly)
    FOR hour IN 9..16 LOOP
      INSERT INTO slots (studio_id, date, start_time, end_time) 
      VALUES (1, current_date + i, make_time(hour, 0, 0), make_time(hour+1, 0, 0));
    END LOOP;
    
    -- Studio B slots (10 AM to 6 PM, hourly)
    FOR hour IN 10..17 LOOP
      INSERT INTO slots (studio_id, date, start_time, end_time) 
      VALUES (2, current_date + i, make_time(hour, 0, 0), make_time(hour+1, 0, 0));
    END LOOP;
    
    -- Studio C slots (11 AM to 7 PM, hourly)
    FOR hour IN 11..18 LOOP
      INSERT INTO slots (studio_id, date, start_time, end_time) 
      VALUES (3, current_date + i, make_time(hour, 0, 0), make_time(hour+1, 0, 0));
    END LOOP;
  END LOOP;
END $$;