CREATE TABLE cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100),
    state VARCHAR(100) NOT NULL,
    is_metro BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gold_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NOT NULL,
    price_date DATE NOT NULL,
    gold_24k_per_gram DECIMAL(10,2) NOT NULL,
    gold_22k_per_gram DECIMAL(10,2) NOT NULL,
    gold_18k_per_gram DECIMAL(10,2),
    gold_24k_per_10gram DECIMAL(12,2),
    gold_22k_per_10gram DECIMAL(12,2),
    change_amount DECIMAL(10,2) DEFAULT 0,
    change_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id),
    UNIQUE KEY unique_city_date (city_id, price_date)
);

CREATE TABLE silver_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NOT NULL,
    price_date DATE NOT NULL,
    silver_per_gram DECIMAL(10,2) NOT NULL,
    silver_per_kg DECIMAL(12,2) NOT NULL,
    change_amount DECIMAL(10,2) DEFAULT 0,
    change_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id),
    UNIQUE KEY unique_city_date (city_id, price_date)
);

CREATE TABLE fuel_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NOT NULL,
    price_date DATE NOT NULL,
    petrol_price DECIMAL(8,2) NOT NULL,
    diesel_price DECIMAL(8,2) NOT NULL,
    petrol_change DECIMAL(6,2) DEFAULT 0,
    diesel_change DECIMAL(6,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id),
    UNIQUE KEY unique_city_date (city_id, price_date)
);

CREATE TABLE lpg_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    state VARCHAR(100) NOT NULL,
    price_date DATE NOT NULL,
    domestic_14kg DECIMAL(8,2) NOT NULL,
    commercial_19kg DECIMAL(8,2),
    subsidy_amount DECIMAL(8,2) DEFAULT 0,
    change_amount DECIMAL(6,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_state_date (state, price_date)
);

CREATE TABLE schemes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(200) UNIQUE NOT NULL,
    name VARCHAR(300) NOT NULL,
    name_hi VARCHAR(300),
    category VARCHAR(50) NOT NULL,
    level VARCHAR(50) NOT NULL,
    ministry VARCHAR(200),
    description TEXT NOT NULL,
    description_hi TEXT,
    benefit_summary VARCHAR(500) NOT NULL,
    benefit_amount_max INT,
    apply_url VARCHAR(500),
    official_url VARCHAR(500),
    deadline DATE,
    min_age INT,
    max_age INT,
    gender ENUM('all','male','female','transgender') DEFAULT 'all',
    states JSON,
    categories JSON,
    max_income INT,
    occupations JSON,
    education_min VARCHAR(50),
    area ENUM('all','urban','rural') DEFAULT 'all',
    bpl_required BOOLEAN DEFAULT FALSE,
    minority_only BOOLEAN DEFAULT FALSE,
    disability_only BOOLEAN DEFAULT FALSE,
    how_to_apply TEXT,
    documents_required JSON,
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    is_active BOOLEAN DEFAULT TRUE,
    source_url VARCHAR(500),
    last_verified DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    logo_url VARCHAR(500),
    type ENUM('public','private','small_finance','cooperative') NOT NULL,
    website VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bank_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_id INT NOT NULL,
    rate_type ENUM('fd','savings','home_loan','personal_loan','car_loan','education_loan') NOT NULL,
    tenure VARCHAR(100),
    general_rate DECIMAL(5,2) NOT NULL,
    senior_citizen_rate DECIMAL(5,2),
    effective_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES banks(id)
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    plan ENUM('free','premium') DEFAULT 'free',
    plan_expires_at DATETIME,
    razorpay_customer_id VARCHAR(100),
    age INT,
    gender VARCHAR(20),
    state VARCHAR(100),
    district VARCHAR(100),
    area VARCHAR(20),
    category VARCHAR(20),
    income INT,
    occupation VARCHAR(50),
    education VARCHAR(50),
    email_alerts BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    scheme_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bookmark (user_id, scheme_id)
);

CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    scheme_id INT NOT NULL,
    status ENUM('not_started','applied','under_review','approved','rejected') DEFAULT 'not_started',
    reference_number VARCHAR(100),
    applied_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (scheme_id) REFERENCES schemes(id) ON DELETE CASCADE
);

CREATE INDEX idx_gold_date ON gold_prices(price_date);
CREATE INDEX idx_silver_date ON silver_prices(price_date);
CREATE INDEX idx_fuel_date ON fuel_prices(price_date);
CREATE INDEX idx_schemes_category ON schemes(category);
CREATE INDEX idx_schemes_level ON schemes(level);
CREATE INDEX idx_schemes_active ON schemes(is_active);
CREATE INDEX idx_rates_type ON bank_rates(rate_type);

CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(300) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description VARCHAR(500) NOT NULL,
    content LONGTEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'finance',
    tags JSON,
    cover_image VARCHAR(500),
    author VARCHAR(100) NOT NULL DEFAULT 'Paisa Reality',
    read_time VARCHAR(20) NOT NULL DEFAULT '5 min read',
    is_published BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    published_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_blog_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_category ON blog_posts(category);
CREATE INDEX idx_blog_slug ON blog_posts(slug);
