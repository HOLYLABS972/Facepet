-- ============================================
-- Supabase Migration Script for Facepet
-- Migrating from Firebase Firestore to Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE ad_type AS ENUM ('image', 'video');
CREATE TYPE ad_status AS ENUM ('active', 'inactive', 'scheduled');
CREATE TYPE verification_type AS ENUM ('email_verification', 'password_reset', 'email_change');
CREATE TYPE transaction_type AS ENUM (
  'registration',
  'phone_verification',
  'pet_creation',
  'pet_share',
  'app_share',
  'admin_adjustment',
  'prize_claim'
);
CREATE TYPE coupon_status AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE user_coupon_status AS ENUM ('available', 'used', 'expired');

-- ============================================
-- CORE TABLES
-- ============================================

-- Users Table
CREATE TABLE users (
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
  uid TEXT UNIQUE, -- Firebase UID for migration reference
  profile_image TEXT,
  address TEXT,
  coordinates JSONB, -- {lat: number, lng: number}
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
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uid ON users(uid);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================
-- PET RELATED TABLES
-- ============================================

-- Genders Table
CREATE TABLE genders (
  id INTEGER PRIMARY KEY,
  en VARCHAR(50) NOT NULL,
  he VARCHAR(50) NOT NULL
);

-- Insert default genders
INSERT INTO genders (id, en, he) VALUES
(1, 'Male', 'זכר'),
(2, 'Female', 'נקבה');

-- Breeds Table
CREATE TABLE breeds (
  id INTEGER PRIMARY KEY,
  en VARCHAR(100) NOT NULL,
  he VARCHAR(100) NOT NULL
);

-- Pet Types Table
CREATE TABLE pet_types (
  id INTEGER PRIMARY KEY,
  en VARCHAR(50) NOT NULL,
  he VARCHAR(50) NOT NULL
);

-- Insert default pet types
INSERT INTO pet_types (id, en, he) VALUES
(1, 'Dog', 'כלב'),
(2, 'Cat', 'חתול');

-- Owners Table
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  home_address TEXT NOT NULL,
  
  -- Privacy settings
  is_phone_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_email_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_address_private BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vets Table
CREATE TABLE vets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  
  -- Privacy settings
  is_name_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_phone_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_email_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_address_private BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pets Table
CREATE TABLE pets (
  id UUID PRIMARY KEY,
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
CREATE INDEX idx_pets_id ON pets(id);
CREATE INDEX idx_pets_user_email ON pets(user_email);
CREATE INDEX idx_pets_owner_id ON pets(owner_id);
CREATE INDEX idx_pets_vet_id ON pets(vet_id);
CREATE INDEX idx_pets_gender_id ON pets(gender_id);
CREATE INDEX idx_pets_breed_id ON pets(breed_id);

-- Pet IDs Pool Table
CREATE TABLE pet_ids_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_used BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================
-- ADVERTISEMENTS & SERVICES
-- ============================================

-- Advertisements Table
CREATE TABLE advertisements (
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
  
  -- Service-specific fields
  phone VARCHAR(50),
  location TEXT,
  description TEXT,
  tags TEXT[],
  pets TEXT[], -- Array of pet IDs
  
  -- Pet-specific fields
  area TEXT,
  city TEXT[],
  pet_type TEXT,
  breed TEXT,
  age_range TEXT[],
  weight TEXT[],
  
  -- Review aggregates
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0
);

CREATE INDEX idx_advertisements_status ON advertisements(status);
CREATE INDEX idx_advertisements_created_by ON advertisements(created_by);
CREATE INDEX idx_advertisements_created_at ON advertisements(created_at);

-- ============================================
-- COMMENTS & REVIEWS
-- ============================================

-- Comments Table (for service reviews)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  advertisement_id UUID REFERENCES advertisements(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_advertisement_id ON comments(advertisement_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- ============================================
-- VERIFICATION & AUTHENTICATION
-- ============================================

-- Verification Codes Table
CREATE TABLE verification_codes (
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

CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires);

-- Password Reset Tokens Table
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- ============================================
-- CONTACT & SUBMISSIONS
-- ============================================

-- Contact Submissions Table
CREATE TABLE contact_submissions (
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

CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at);

-- Contact Info Table
CREATE TABLE contact_info (
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

-- Points Transactions Table
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX idx_points_transactions_type ON points_transactions(type);
CREATE INDEX idx_points_transactions_created_at ON points_transactions(created_at);

-- User Points Summary Table
CREATE TABLE user_points_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  registration_points INTEGER NOT NULL DEFAULT 0,
  phone_points INTEGER NOT NULL DEFAULT 0,
  pet_points INTEGER NOT NULL DEFAULT 0,
  share_points INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_points_summary_user_id ON user_points_summary(user_id);
CREATE INDEX idx_user_points_summary_total_points ON user_points_summary(total_points);

-- ============================================
-- COUPONS & PROMOTIONS
-- ============================================

-- Coupons Table
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(50) UNIQUE,
  discount_type VARCHAR(50), -- 'percentage' or 'fixed'
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

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupons_business_id ON coupons(business_id);

-- User Coupons Table
CREATE TABLE user_coupons (
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

CREATE INDEX idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_coupon_id ON user_coupons(coupon_id);
CREATE INDEX idx_user_coupons_status ON user_coupons(status);

-- Promos Table
CREATE TABLE promos (
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

CREATE INDEX idx_promos_status ON promos(status);
CREATE INDEX idx_promos_created_at ON promos(created_at);

-- Audiences Table
CREATE TABLE audiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses Table
CREATE TABLE businesses (
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

-- Filters Table
CREATE TABLE filters (
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

-- Cookie Settings Table
CREATE TABLE cookie_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled BOOLEAN DEFAULT TRUE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Install Banner Settings Table
CREATE TABLE install_banner_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled BOOLEAN DEFAULT TRUE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON advertisements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promos_updated_at BEFORE UPDATE ON promos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audiences_updated_at BEFORE UPDATE ON audiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (customize based on your needs)
-- Users can read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid()::text = uid);

-- Users can update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid()::text = uid);

-- Admins can read all users
CREATE POLICY users_select_admin ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE uid = auth.uid()::text
      AND role IN ('admin', 'super_admin')
    )
  );

-- Users can read their own pets
CREATE POLICY pets_select_own ON pets
  FOR SELECT
  USING (
    user_email = (
      SELECT email FROM users WHERE uid = auth.uid()::text
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Main users table migrated from Firebase Auth and Firestore';
COMMENT ON TABLE pets IS 'Pet profiles with owner and vet information';
COMMENT ON TABLE advertisements IS 'Advertisements and services listings';
COMMENT ON TABLE comments IS 'User reviews and comments for services';
COMMENT ON TABLE coupons IS 'Promotional coupons and vouchers';
COMMENT ON TABLE user_coupons IS 'User-claimed coupons tracking';
COMMENT ON TABLE points_transactions IS 'Points system transaction history';
COMMENT ON TABLE user_points_summary IS 'Aggregated points summary per user';
