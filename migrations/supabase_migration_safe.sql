-- ============================================
-- Supabase Migration Script for Facepet (SAFE VERSION)
-- Migrating from Firebase Firestore to Supabase
-- This version uses IF NOT EXISTS to avoid errors on re-runs
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS (with IF NOT EXISTS equivalent)
-- ============================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ad_type AS ENUM ('image', 'video');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ad_status AS ENUM ('active', 'inactive', 'scheduled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_type AS ENUM ('email_verification', 'password_reset', 'email_change');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM (
    'registration',
    'phone_verification',
    'pet_creation',
    'pet_share',
    'app_share',
    'admin_adjustment',
    'prize_claim'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE coupon_status AS ENUM ('active', 'inactive', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_coupon_status AS ENUM ('available', 'used', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone VARCHAR(15),
  password TEXT,
  role user_role NOT NULL DEFAULT 'user',
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  last_activity_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional Firebase fields
  display_name VARCHAR(255),
  uid TEXT UNIQUE,
  profile_image TEXT,
  address TEXT,
  coordinates JSONB,
  geocoded_at TIMESTAMPTZ,
  place_id TEXT,
  accept_cookies BOOLEAN DEFAULT FALSE,
  language VARCHAR(10) DEFAULT 'en',
  audience_ids TEXT[],
  free_coupon_price BOOLEAN DEFAULT FALSE,
  
  -- Restriction fields
  is_restricted BOOLEAN DEFAULT FALSE,
  restriction_reason TEXT,
  restricted_at TIMESTAMPTZ
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================
-- PET RELATED TABLES
-- ============================================

-- Genders Table
CREATE TABLE IF NOT EXISTS genders (
  id INTEGER PRIMARY KEY,
  en VARCHAR(50) NOT NULL,
  he VARCHAR(50) NOT NULL
);

-- Insert default genders (only if table is empty)
INSERT INTO genders (id, en, he) 
SELECT 1, 'Male', 'זכר'
WHERE NOT EXISTS (SELECT 1 FROM genders WHERE id = 1);

INSERT INTO genders (id, en, he) 
SELECT 2, 'Female', 'נקבה'
WHERE NOT EXISTS (SELECT 1 FROM genders WHERE id = 2);

-- Breeds Table
CREATE TABLE IF NOT EXISTS breeds (
  id INTEGER PRIMARY KEY,
  en VARCHAR(100) NOT NULL,
  he VARCHAR(100) NOT NULL
);

-- Pet Types Table
CREATE TABLE IF NOT EXISTS pet_types (
  id INTEGER PRIMARY KEY,
  en VARCHAR(50) NOT NULL,
  he VARCHAR(50) NOT NULL
);

-- Insert default pet types (only if table is empty)
INSERT INTO pet_types (id, en, he) 
SELECT 1, 'Dog', 'כלב'
WHERE NOT EXISTS (SELECT 1 FROM pet_types WHERE id = 1);

INSERT INTO pet_types (id, en, he) 
SELECT 2, 'Cat', 'חתול'
WHERE NOT EXISTS (SELECT 1 FROM pet_types WHERE id = 2);

-- Owners Table
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  home_address TEXT NOT NULL,
  is_phone_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_email_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_address_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vets Table
CREATE TABLE IF NOT EXISTS vets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  is_name_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_phone_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_email_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_address_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pets Table (owner_id is now nullable)
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  gender_id INTEGER NOT NULL REFERENCES genders(id) ON DELETE CASCADE,
  breed_id INTEGER NOT NULL REFERENCES breeds(id) ON DELETE CASCADE,
  birth_date DATE,
  notes TEXT,
  user_email VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  vet_id UUID REFERENCES vets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for pets
CREATE INDEX IF NOT EXISTS idx_pets_id ON pets(id);
CREATE INDEX IF NOT EXISTS idx_pets_user_email ON pets(user_email);
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_vet_id ON pets(vet_id);
CREATE INDEX IF NOT EXISTS idx_pets_gender_id ON pets(gender_id);
CREATE INDEX IF NOT EXISTS idx_pets_breed_id ON pets(breed_id);

-- Pet IDs Pool Table
CREATE TABLE IF NOT EXISTS pet_ids_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_used BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================
-- ADVERTISEMENTS & SERVICES
-- ============================================

CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  type ad_type NOT NULL,
  content TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 5,
  status ad_status NOT NULL DEFAULT 'inactive',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  phone VARCHAR(50),
  location TEXT,
  description TEXT,
  tags TEXT[],
  pets TEXT[],
  area TEXT,
  city TEXT[],
  pet_type TEXT,
  breed TEXT,
  age_range TEXT[],
  weight TEXT[],
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_advertisements_status ON advertisements(status);
CREATE INDEX IF NOT EXISTS idx_advertisements_created_by ON advertisements(created_by);
CREATE INDEX IF NOT EXISTS idx_advertisements_created_at ON advertisements(created_at);

-- ============================================
-- COMMENTS & REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  advertisement_id UUID REFERENCES advertisements(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_advertisement_id ON comments(advertisement_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- ============================================
-- VERIFICATION & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  type verification_type NOT NULL DEFAULT 'email_verification',
  expires TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  hashed_password TEXT,
  new_email VARCHAR(255),
  hashed_new_password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- ============================================
-- CONTACT & SUBMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);

CREATE TABLE IF NOT EXISTS contact_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POINTS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);

CREATE TABLE IF NOT EXISTS user_points_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  registration_points INTEGER NOT NULL DEFAULT 0,
  phone_points INTEGER NOT NULL DEFAULT 0,
  pet_points INTEGER NOT NULL DEFAULT 0,
  share_points INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_points_summary_user_id ON user_points_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_summary_total_points ON user_points_summary(total_points);

-- ============================================
-- COUPONS & PROMOTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(50) UNIQUE,
  discount_type VARCHAR(50),
  discount_value DECIMAL(10,2),
  points_cost INTEGER DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  status coupon_status DEFAULT 'active',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  terms_and_conditions TEXT,
  image_url TEXT,
  business_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_business_id ON coupons(business_id);

CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  status user_coupon_status DEFAULT 'available',
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon_id ON user_coupons(coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_status ON user_coupons(status);

CREATE TABLE IF NOT EXISTS promos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  audience_ids TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promos_status ON promos(status);
CREATE INDEX IF NOT EXISTS idx_promos_created_at ON promos(created_at);

CREATE TABLE IF NOT EXISTS audiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  options JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS cookie_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled BOOLEAN DEFAULT TRUE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS install_banner_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled BOOLEAN DEFAULT TRUE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist, then recreate
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pets_updated_at ON pets;
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advertisements_updated_at ON advertisements;
CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON advertisements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_submissions_updated_at ON contact_submissions;
CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promos_updated_at ON promos;
CREATE TRIGGER update_promos_updated_at BEFORE UPDATE ON promos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_audiences_updated_at ON audiences;
CREATE TRIGGER update_audiences_updated_at BEFORE UPDATE ON audiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration schema created successfully!';
  RAISE NOTICE '📊 Ready to migrate data from Firebase';
END $$;
