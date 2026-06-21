-- =============================================================================
-- Migration 001: Create all application tables in PostgreSQL
-- Replaces the MySQL schema from scripts/init-db.sql
-- =============================================================================
-- Run with:  psql "$DATABASE_URL" -f scripts/migrations/001_create_all_tables.sql
-- Idempotent: uses IF NOT EXISTS throughout.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- cities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cities (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug       text   NOT NULL,
    name       text   NOT NULL,
    name_hi    text,
    state      text   NOT NULL,
    is_metro   boolean NOT NULL DEFAULT false,
    latitude   numeric(10,7),
    longitude  numeric(10,7),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cities_slug_unique UNIQUE (slug)
);

-- -----------------------------------------------------------------------------
-- gold_prices
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gold_prices (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    city_id             bigint NOT NULL REFERENCES cities(id),
    price_date          date   NOT NULL,
    gold_24k_per_gram   numeric(10,2) NOT NULL,
    gold_22k_per_gram   numeric(10,2) NOT NULL,
    gold_18k_per_gram   numeric(10,2),
    gold_24k_per_10gram numeric(12,2),
    gold_22k_per_10gram numeric(12,2),
    change_amount       numeric(10,2) NOT NULL DEFAULT 0,
    change_percent      numeric(5,2)  NOT NULL DEFAULT 0,
    created_at          timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT gold_prices_city_date_unique UNIQUE (city_id, price_date)
);

-- -----------------------------------------------------------------------------
-- silver_prices
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS silver_prices (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    city_id         bigint NOT NULL REFERENCES cities(id),
    price_date      date   NOT NULL,
    silver_per_gram numeric(10,2) NOT NULL,
    silver_per_kg   numeric(12,2) NOT NULL,
    change_amount   numeric(10,2) NOT NULL DEFAULT 0,
    change_percent  numeric(5,2)  NOT NULL DEFAULT 0,
    created_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT silver_prices_city_date_unique UNIQUE (city_id, price_date)
);

-- -----------------------------------------------------------------------------
-- fuel_prices
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fuel_prices (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    city_id       bigint NOT NULL REFERENCES cities(id),
    price_date    date   NOT NULL,
    petrol_price  numeric(8,2) NOT NULL,
    diesel_price  numeric(8,2) NOT NULL,
    petrol_change numeric(6,2) NOT NULL DEFAULT 0,
    diesel_change numeric(6,2) NOT NULL DEFAULT 0,
    created_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT fuel_prices_city_date_unique UNIQUE (city_id, price_date)
);

-- -----------------------------------------------------------------------------
-- lpg_prices
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lpg_prices (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    state           text   NOT NULL,
    price_date      date   NOT NULL,
    domestic_14kg   numeric(8,2) NOT NULL,
    commercial_19kg numeric(8,2),
    subsidy_amount  numeric(8,2) NOT NULL DEFAULT 0,
    change_amount   numeric(6,2) NOT NULL DEFAULT 0,
    created_at      timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT lpg_prices_state_date_unique UNIQUE (state, price_date)
);

-- -----------------------------------------------------------------------------
-- schemes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schemes (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug                text   NOT NULL,
    name                text   NOT NULL,
    name_hi             text,
    category            text   NOT NULL,
    level               text   NOT NULL,
    ministry            text,
    description         text   NOT NULL,
    description_hi      text,
    benefit_summary     text   NOT NULL,
    benefit_amount_max  int,
    apply_url           text,
    official_url        text,
    deadline            date,
    min_age             int,
    max_age             int,
    gender              text   NOT NULL DEFAULT 'all' CHECK (gender IN ('all','male','female','transgender')),
    states              jsonb,
    categories          jsonb,
    max_income          int,
    occupations         jsonb,
    education_min       text,
    area                text   NOT NULL DEFAULT 'all' CHECK (area IN ('all','urban','rural')),
    bpl_required        boolean NOT NULL DEFAULT false,
    minority_only       boolean NOT NULL DEFAULT false,
    disability_only     boolean NOT NULL DEFAULT false,
    how_to_apply        text,
    documents_required  jsonb,
    meta_title          text,
    meta_description    text,
    is_active           boolean NOT NULL DEFAULT true,
    source_url          text,
    last_verified       date,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT schemes_slug_unique UNIQUE (slug)
);

-- -----------------------------------------------------------------------------
-- banks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS banks (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug       text   NOT NULL,
    name       text   NOT NULL,
    logo_url   text,
    type       text   NOT NULL CHECK (type IN ('public','private','small_finance','cooperative')),
    website    text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT banks_slug_unique UNIQUE (slug)
);

-- -----------------------------------------------------------------------------
-- bank_rates
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_rates (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bank_id            bigint NOT NULL REFERENCES banks(id),
    rate_type          text   NOT NULL CHECK (rate_type IN ('fd','savings','home_loan','personal_loan','car_loan','education_loan')),
    tenure             text,
    general_rate       numeric(5,2) NOT NULL,
    senior_citizen_rate numeric(5,2),
    effective_date     date,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email                text   NOT NULL,
    password_hash        text   NOT NULL,
    name                 text,
    plan                 text   NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium')),
    plan_expires_at      timestamptz,
    razorpay_customer_id text,
    age                  int,
    gender               text,
    state                text,
    district             text,
    area                 text,
    category             text,
    income               int,
    occupation           text,
    education            text,
    email_alerts         boolean NOT NULL DEFAULT false,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive email uniqueness (MySQL was case-insensitive by default)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));

-- -----------------------------------------------------------------------------
-- bookmarks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookmarks (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheme_id  bigint NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bookmarks_user_scheme_unique UNIQUE (user_id, scheme_id)
);

-- -----------------------------------------------------------------------------
-- applications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheme_id        bigint NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    status           text   NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','applied','under_review','approved','rejected')),
    reference_number text,
    applied_date     date,
    notes            text,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- blog_posts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug             text   NOT NULL,
    title            text   NOT NULL,
    description      text   NOT NULL,
    content          text   NOT NULL,
    category         text   NOT NULL DEFAULT 'finance',
    tags             jsonb,
    cover_image      text,
    author           text   NOT NULL DEFAULT 'Paisa Reality',
    read_time        text   NOT NULL DEFAULT '5 min read',
    is_published     boolean NOT NULL DEFAULT false,
    meta_title       text,
    meta_description text,
    published_at     timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT blog_posts_slug_unique UNIQUE (slug)
);

-- =============================================================================
-- INDEXES (matching the MySQL originals)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_gold_prices_date    ON gold_prices (price_date);
CREATE INDEX IF NOT EXISTS idx_silver_prices_date  ON silver_prices (price_date);
CREATE INDEX IF NOT EXISTS idx_fuel_prices_date    ON fuel_prices (price_date);
CREATE INDEX IF NOT EXISTS idx_schemes_category    ON schemes (category);
CREATE INDEX IF NOT EXISTS idx_schemes_level       ON schemes (level);
CREATE INDEX IF NOT EXISTS idx_schemes_active      ON schemes (is_active);
CREATE INDEX IF NOT EXISTS idx_bank_rates_type     ON bank_rates (rate_type);
CREATE INDEX IF NOT EXISTS idx_blog_published      ON blog_posts (is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_category       ON blog_posts (category);

-- =============================================================================
-- updated_at trigger (replaces MySQL ON UPDATE CURRENT_TIMESTAMP)
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_schemes_updated_at') THEN
    CREATE TRIGGER trg_schemes_updated_at BEFORE UPDATE ON schemes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bank_rates_updated_at') THEN
    CREATE TRIGGER trg_bank_rates_updated_at BEFORE UPDATE ON bank_rates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_applications_updated_at') THEN
    CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_blog_posts_updated_at') THEN
    CREATE TRIGGER trg_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
