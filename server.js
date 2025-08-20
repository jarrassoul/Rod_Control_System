const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const json2csv = require('json2csv');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'vwds-secret-key-2024';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database connection
const db = new sqlite3.Database('./vwds.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

// Routes

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    db.get('SELECT * FROM users WHERE username = ? AND role = ?', [username, role], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials or role' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    });
});

// Users endpoints (Admin only)
app.get('/api/users', authenticateToken, authorizeRole(['admin']), (req, res) => {
    db.all('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC', (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(users);
    });
});

app.post('/api/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { username, password, email, role } = req.body;

    if (!username || !password || !email || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
            'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, role],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Username or email already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({ id: this.lastID, message: 'User created successfully' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Password hashing error' });
    }
});

app.put('/api/users/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { username, email, role, password } = req.body;

    let query = 'UPDATE users SET username = ?, email = ?, role = ?';
    let params = [username, email, role];

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += ', password = ?';
        params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.run(query, params, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    });
});

app.delete('/api/users/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

// Vehicles endpoints (Data Entry and Admin)
app.get('/api/vehicles', authenticateToken, authorizeRole(['admin', 'data_entry', 'police_officer']), (req, res) => {
    db.all('SELECT * FROM Vehicle ORDER BY created_at DESC', (err, vehicles) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(vehicles);
    });
});

app.post('/api/vehicles', authenticateToken, authorizeRole(['admin', 'data_entry']), (req, res) => {
    const { type, weight, licensePlate } = req.body;

    db.run(
        'INSERT INTO Vehicle (type, weight, licensePlate) VALUES (?, ?, ?)',
        [type, weight, licensePlate],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'License plate already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ id: this.lastID, message: 'Vehicle created successfully' });
        }
    );
});

app.put('/api/vehicles/:id', authenticateToken, authorizeRole(['admin', 'data_entry']), (req, res) => {
    const { id } = req.params;
    const { type, weight, licensePlate } = req.body;

    db.run(
        'UPDATE Vehicle SET type = ?, weight = ?, licensePlate = ? WHERE id = ?',
        [type, weight, licensePlate, id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }
            res.json({ message: 'Vehicle updated successfully' });
        }
    );
});

app.delete('/api/vehicles/:id', authenticateToken, authorizeRole(['admin', 'data_entry']), (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM Vehicle WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json({ message: 'Vehicle deleted successfully' });
    });
});

// Routes endpoints (Data Entry and Admin)
app.get('/api/routes', authenticateToken, authorizeRole(['admin', 'data_entry', 'police_officer']), (req, res) => {
    db.all('SELECT * FROM Route ORDER BY created_at DESC', (err, routes) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(routes);
    });
});

app.post('/api/routes', authenticateToken, authorizeRole(['admin', 'data_entry']), (req, res) => {
    const { name, length, weightRestriction } = req.body;

    db.run(
        'INSERT INTO Route (name, length, weightRestriction) VALUES (?, ?, ?)',
        [name, length, weightRestriction],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ id: this.lastID, message: 'Route created successfully' });
        }
    );
});

app.put('/api/routes/:id', authenticateToken, authorizeRole(['admin', 'data_entry']), (req, res) => {
    const { id } = req.params;
    const { name, length, weightRestriction } = req.body;

    db.run(
        'UPDATE Route SET name = ?, length = ?, weightRestriction = ? WHERE id = ?',
        [name, length, weightRestriction, id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Route not found' });
            }
            res.json({ message: 'Route updated successfully' });
        }
    );
});

app.delete('/api/routes/:id', authenticateToken, authorizeRole(['admin', 'data_entry']), (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM Route WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Route not found' });
        }
        res.json({ message: 'Route deleted successfully' });
    });
});

// Tickets endpoints
app.get('/api/tickets', authenticateToken, (req, res) => {
    const query = `
        SELECT t.*, v.licensePlate, v.type as vehicleType, r.name as routeName, u.username as officerName
        FROM Ticket t
        LEFT JOIN Vehicle v ON t.vehicle_id = v.id
        LEFT JOIN Route r ON t.route_id = r.id
        LEFT JOIN users u ON t.officer_id = u.id
        ORDER BY t.dateTime DESC
    `;

    db.all(query, (err, tickets) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(tickets);
    });
});

app.post('/api/tickets', authenticateToken, authorizeRole(['admin', 'police_officer']), (req, res) => {
    const { vehicle_id, route_id, violationDetails, fine_amount, ticket_type, licensePlate, routeName } = req.body;
    const officer_id = req.user.id;

    // If license plate is provided instead of vehicle_id, find the vehicle
    if (licensePlate && !vehicle_id) {
        db.get('SELECT id FROM Vehicle WHERE licensePlate = ?', [licensePlate], (err, vehicle) => {
            if (err) {
                return res.status(500).json({ error: 'Database error finding vehicle' });
            }
            if (!vehicle) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }
            
            // Continue with route lookup if needed
            if (routeName && !route_id) {
                db.get('SELECT id FROM Route WHERE name = ?', [routeName], (err, route) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error finding route' });
                    }
                    if (!route) {
                        return res.status(404).json({ error: 'Route not found' });
                    }
                    
                    // Create ticket with found IDs
                    createTicket(vehicle.id, route.id);
                });
            } else {
                createTicket(vehicle.id, route_id);
            }
        });
    } else if (routeName && !route_id) {
        db.get('SELECT id FROM Route WHERE name = ?', [routeName], (err, route) => {
            if (err) {
                return res.status(500).json({ error: 'Database error finding route' });
            }
            if (!route) {
                return res.status(404).json({ error: 'Route not found' });
            }
            createTicket(vehicle_id, route.id);
        });
    } else {
        createTicket(vehicle_id, route_id);
    }

    function createTicket(vId, rId) {
        db.run(
            'INSERT INTO Ticket (vehicle_id, route_id, officer_id, violationDetails, fine_amount, ticket_type) VALUES (?, ?, ?, ?, ?, ?)',
            [vId, rId, officer_id, violationDetails, fine_amount || 0, ticket_type || 'violation'],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error creating ticket' });
                }
                res.status(201).json({ id: this.lastID, message: 'Ticket created successfully' });
            }
        );
    }
});

// Auto-complete endpoints
app.get('/api/vehicles/search', authenticateToken, (req, res) => {
    const { query } = req.query;
    if (!query || query.length < 1) {
        return res.json([]);
    }

    db.all(
        'SELECT licensePlate, type, weight FROM Vehicle WHERE licensePlate LIKE ? OR type LIKE ? LIMIT 10',
        [`%${query}%`, `%${query}%`],
        (err, vehicles) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(vehicles);
        }
    );
});

app.get('/api/routes/search', authenticateToken, (req, res) => {
    const { query } = req.query;
    if (!query || query.length < 1) {
        return res.json([]);
    }

    db.all(
        'SELECT name, weightRestriction FROM Route WHERE name LIKE ? LIMIT 10',
        [`%${query}%`],
        (err, routes) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(routes);
        }
    );
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const queries = {
        totalTickets: 'SELECT COUNT(*) as count FROM Ticket',
        totalVehicles: 'SELECT COUNT(*) as count FROM Vehicle',
        totalRoutes: 'SELECT COUNT(*) as count FROM Route',
        totalUsers: 'SELECT COUNT(*) as count FROM users'
    };

    Promise.all([
        new Promise((resolve, reject) => {
            db.get(queries.totalTickets, (err, result) => {
                if (err) reject(err);
                else resolve(result.count);
            });
        }),
        new Promise((resolve, reject) => {
            db.get(queries.totalVehicles, (err, result) => {
                if (err) reject(err);
                else resolve(result.count);
            });
        }),
        new Promise((resolve, reject) => {
            db.get(queries.totalRoutes, (err, result) => {
                if (err) reject(err);
                else resolve(result.count);
            });
        }),
        new Promise((resolve, reject) => {
            db.get(queries.totalUsers, (err, result) => {
                if (err) reject(err);
                else resolve(result.count);
            });
        })
    ]).then(([tickets, vehicles, routes, users]) => {
        res.json({
            totalTickets: tickets,
            totalVehicles: vehicles,
            totalRoutes: routes,
            totalUsers: users
        });
    }).catch(err => {
        res.status(500).json({ error: 'Database error' });
    });
});

// Reports endpoints
app.get('/api/reports/tickets/csv', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const { startDate, endDate, ticketType } = req.query;
    
    let query = `
        SELECT t.*, v.licensePlate, v.type as vehicleType, r.name as routeName, u.username as officerName
        FROM Ticket t
        LEFT JOIN Vehicle v ON t.vehicle_id = v.id
        LEFT JOIN Route r ON t.route_id = r.id
        LEFT JOIN users u ON t.officer_id = u.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
        query += ' AND DATE(t.dateTime) >= ?';
        params.push(startDate);
    }
    
    if (endDate) {
        query += ' AND DATE(t.dateTime) <= ?';
        params.push(endDate);
    }
    
    if (ticketType && ticketType !== 'all') {
        query += ' AND t.ticket_type = ?';
        params.push(ticketType);
    }
    
    query += ' ORDER BY t.dateTime DESC';
    
    db.all(query, params, (err, tickets) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        try {
            const fields = [
                'dateTime',
                'licensePlate',
                'vehicleType',
                'routeName',
                'officerName',
                'ticket_type',
                'violationDetails',
                'fine_amount',
                'status'
            ];
            
            const csv = json2csv.parse(tickets, { fields });
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="tickets-report.csv"');
            res.send(csv);
        } catch (error) {
            res.status(500).json({ error: 'Error generating CSV' });
        }
    });
});

app.get('/api/reports/tickets/pdf', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const { startDate, endDate, ticketType } = req.query;
    
    let query = `
        SELECT t.*, v.licensePlate, v.type as vehicleType, r.name as routeName, u.username as officerName
        FROM Ticket t
        LEFT JOIN Vehicle v ON t.vehicle_id = v.id
        LEFT JOIN Route r ON t.route_id = r.id
        LEFT JOIN users u ON t.officer_id = u.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
        query += ' AND DATE(t.dateTime) >= ?';
        params.push(startDate);
    }
    
    if (endDate) {
        query += ' AND DATE(t.dateTime) <= ?';
        params.push(endDate);
    }
    
    if (ticketType && ticketType !== 'all') {
        query += ' AND t.ticket_type = ?';
        params.push(ticketType);
    }
    
    query += ' ORDER BY t.dateTime DESC';
    
    db.all(query, params, (err, tickets) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        try {
            const doc = new PDFDocument();
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="tickets-report.pdf"');
            
            doc.pipe(res);
            
            // Header
            doc.fontSize(20).text('VWDS Tickets Report', { align: 'center' });
            doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
            doc.moveDown();
            
            if (startDate || endDate) {
                doc.text(`Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`);
            }
            if (ticketType && ticketType !== 'all') {
                doc.text(`Ticket Type: ${ticketType}`);
            }
            doc.text(`Total Tickets: ${tickets.length}`);
            doc.moveDown();
            
            // Table headers
            const startY = doc.y;
            const colWidths = [60, 80, 60, 80, 60, 80, 60];
            const headers = ['Date', 'License', 'Type', 'Route', 'Officer', 'Violation', 'Fine'];
            
            let x = 50;
            headers.forEach((header, i) => {
                doc.fontSize(10).text(header, x, startY, { width: colWidths[i], align: 'left' });
                x += colWidths[i];
            });
            
            doc.moveDown();
            
            // Table data
            tickets.forEach((ticket) => {
                const y = doc.y;
                x = 50;
                
                const rowData = [
                    new Date(ticket.dateTime).toLocaleDateString(),
                    ticket.licensePlate || 'N/A',
                    ticket.ticket_type || 'N/A',
                    ticket.routeName || 'N/A',
                    ticket.officerName || 'N/A',
                    (ticket.violationDetails || '').substring(0, 20) + '...',
                    `$${ticket.fine_amount || 0}`
                ];
                
                rowData.forEach((data, i) => {
                    doc.fontSize(8).text(data, x, y, { width: colWidths[i], align: 'left' });
                    x += colWidths[i];
                });
                
                doc.moveDown(0.5);
                
                if (doc.y > 700) {
                    doc.addPage();
                }
            });
            
            doc.end();
        } catch (error) {
            res.status(500).json({ error: 'Error generating PDF' });
        }
    });
});

app.get('/api/reports/analytics', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const queries = {
        ticketsByType: `
            SELECT ticket_type, COUNT(*) as count 
            FROM Ticket 
            GROUP BY ticket_type
        `,
        ticketsByMonth: `
            SELECT 
                strftime('%Y-%m', dateTime) as month,
                COUNT(*) as count
            FROM Ticket 
            WHERE dateTime >= date('now', '-12 months')
            GROUP BY strftime('%Y-%m', dateTime)
            ORDER BY month
        `,
        topRoutes: `
            SELECT r.name, COUNT(t.id) as violations
            FROM Route r
            LEFT JOIN Ticket t ON r.id = t.route_id
            GROUP BY r.id, r.name
            ORDER BY violations DESC
            LIMIT 10
        `,
        topOfficers: `
            SELECT u.username, COUNT(t.id) as tickets_issued
            FROM users u
            LEFT JOIN Ticket t ON u.id = t.officer_id
            WHERE u.role = 'police_officer'
            GROUP BY u.id, u.username
            ORDER BY tickets_issued DESC
            LIMIT 10
        `
    };
    
    Promise.all([
        new Promise((resolve, reject) => {
            db.all(queries.ticketsByType, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(queries.ticketsByMonth, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(queries.topRoutes, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(queries.topOfficers, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        })
    ]).then(([ticketsByType, ticketsByMonth, topRoutes, topOfficers]) => {
        res.json({
            ticketsByType,
            ticketsByMonth,
            topRoutes,
            topOfficers
        });
    }).catch(err => {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    });
});

// Serve frontend - MUST be last route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});