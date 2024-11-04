-- CREATE TABLE Ticket (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     vehicle_id INT NOT NULL,
--     route_id INT NOT NULL,
--     dateTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     violationDetails VARCHAR(255) NOT NULL,
--     FOREIGN KEY (vehicle_id) REFERENCES Vehicle(id),
--     FOREIGN KEY (route_id) REFERENCES Route(id)
-- );


-- CREATE TABLE Route (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     name VARCHAR(100) NOT NULL,
--     length DOUBLE NOT NULL,
--     weightRestriction DOUBLE NOT NULL
-- );
-- CREATE TABLE Vehicle (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     type VARCHAR(50) NOT NULL,
--     weight DOUBLE NOT NULL,
--     licensePlate VARCHAR(50) UNIQUE NOT NULL
-- );

