-- SQLite Schema for Vehicle Weight Detection System

-- Users table for authentication and role management
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'police_officer', 'data_entry')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE Route (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    length REAL NOT NULL,
    weightRestriction REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE Vehicle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR(50) NOT NULL,
    weight REAL NOT NULL,
    licensePlate VARCHAR(50) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE Ticket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    route_id INTEGER NOT NULL,
    officer_id INTEGER,
    dateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    violationDetails VARCHAR(255) NOT NULL,
    fine_amount REAL DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'dismissed')),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(id),
    FOREIGN KEY (route_id) REFERENCES Route(id),
    FOREIGN KEY (officer_id) REFERENCES users(id)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, email, role) VALUES 
('admin', '$2a$10$I20dZ5oO90deD.MT0fQVN.tImaPB0oMTHrG6dPvDdddtXUCmCB6Ka', 'admin@vwds.com', 'admin');

-- Insert sample routes
INSERT INTO Route (name, length, weightRestriction) VALUES 
('Highway A1', 25.5, 40000.0),
('City Route B2', 15.2, 25000.0),
('Industrial Zone C3', 8.7, 60000.0);

-- Insert sample vehicles
INSERT INTO Vehicle (type, weight, licensePlate) VALUES 
('Heavy Truck', 35000.0, 'ABC-1234'),
('Medium Truck', 20000.0, 'XYZ-5678'),
('Light Truck', 15000.0, 'DEF-9012');