class VWDSApp {
    constructor() {
        this.token = localStorage.getItem('vwds_token');
        this.user = JSON.parse(localStorage.getItem('vwds_user') || 'null');
        this.baseURL = '';
        
        // Session management
        this.inactivityTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds
        this.warningTime = 5 * 60 * 1000; // 5 minutes warning before logout
        this.inactivityTimer = null;
        this.warningTimer = null;
        this.warningShown = false;
        
        this.init();
    }

    init() {
        if (this.token && this.user) {
            this.showRoleSpecificPortal();
            this.startInactivityTimer();
            this.setupActivityListeners();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginModal').classList.add('active');
        
        // Hide all portals
        document.getElementById('adminPortal').style.display = 'none';
        document.getElementById('policePortal').style.display = 'none';
        document.getElementById('dataEntryPortal').style.display = 'none';
        
        // Add event listener only once
        const loginForm = document.getElementById('loginForm');
        if (!loginForm.hasEventListener) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
            loginForm.hasEventListener = true;
        }
    }


    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        console.log('Login attempt:', { username, role }); // Debug log

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, role })
            });

            const data = await response.json();
            console.log('Login response:', data); // Debug log

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('vwds_token', this.token);
                localStorage.setItem('vwds_user', JSON.stringify(this.user));
                
                console.log('Calling showRoleSpecificPortal for role:', this.user.role); // Debug log
                this.showRoleSpecificPortal();
                this.startInactivityTimer();
                this.setupActivityListeners();
            } else {
                this.showAlert(data.error, 'error');
            }
        } catch (error) {
            console.error('Login error:', error); // Debug log
            this.showAlert('Login failed. Please try again.', 'error');
        }
    }

    showRoleSpecificPortal() {
        console.log('showRoleSpecificPortal called for user:', this.user); // Debug log
        
        document.getElementById('loginModal').classList.remove('active');
        
        // Hide all portals first
        document.getElementById('adminPortal').style.display = 'none';
        document.getElementById('policePortal').style.display = 'none';
        document.getElementById('dataEntryPortal').style.display = 'none';
        
        // Show role-specific portal
        console.log('User role:', this.user.role); // Debug log
        switch(this.user.role) {
            case 'admin':
                console.log('Showing admin portal'); // Debug log
                document.getElementById('adminPortal').style.display = 'flex';
                document.getElementById('adminCurrentUser').textContent = this.user.username;
                this.currentPortal = 'admin';
                break;
            case 'police_officer':
                console.log('Showing police portal'); // Debug log
                document.getElementById('policePortal').style.display = 'flex';
                document.getElementById('policeCurrentUser').textContent = this.user.username;
                this.currentPortal = 'police';
                break;
            case 'data_entry':
                console.log('Showing data entry portal'); // Debug log
                document.getElementById('dataEntryPortal').style.display = 'flex';
                document.getElementById('dataEntryCurrentUser').textContent = this.user.username;
                this.currentPortal = 'dataEntry';
                break;
            default:
                console.error('Unknown role:', this.user.role); // Debug log
        }
        
        this.setupEventListeners();
        this.loadPortalContent();
    }

    loadPortalContent() {
        const contentContainer = document.getElementById(this.currentPortal + 'MainContent');
        
        // Load dashboard content by default
        contentContainer.innerHTML = this.getDashboardHTML();
        this.loadDashboard();
        
        // Load role-specific sections
        switch(this.currentPortal) {
            case 'admin':
                this.loadAdminSections(contentContainer);
                break;
            case 'police':
                this.loadPoliceSections(contentContainer);
                break;
            case 'dataEntry':
                this.loadDataEntrySections(contentContainer);
                break;
        }
        
        // Setup event listeners for dynamically created buttons
        this.setupDynamicEventListeners();
    }

    getDashboardHTML() {
        return `
            <div id="dashboardSection" class="section active">
                <div class="section-header">
                    <h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-ticket-alt"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="totalTickets">0</h3>
                            <p>Total Tickets</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-car"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="totalVehicles">0</h3>
                            <p>Total Vehicles</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-route"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="totalRoutes">0</h3>
                            <p>Total Routes</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="totalUsers">0</h3>
                            <p>Total Users</p>
                        </div>
                    </div>
                </div>
                <div class="charts-grid">
                    <div class="chart-card">
                        <h3>Tickets by Type</h3>
                        <canvas id="ticketTypeChart"></canvas>
                    </div>
                    <div class="chart-card">
                        <h3>Monthly Tickets</h3>
                        <canvas id="monthlyTicketsChart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    getDataEntryAnalyticsHTML() {
        return `
            <div id="analyticsSection" class="section">
                <div class="section-header">
                    <h2><i class="fas fa-chart-bar"></i> Data Analytics</h2>
                </div>
                <div class="analytics-container">
                    <div class="charts-grid">
                        <div class="chart-card">
                            <h3>Vehicle Distribution by Type</h3>
                            <canvas id="dataEntryVehicleTypeChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h3>Routes by Weight Restriction</h3>
                            <canvas id="dataEntryRouteWeightChart"></canvas>
                        </div>
                    </div>
                    <div class="charts-grid">
                        <div class="chart-card">
                            <h3>Recent Ticket Trends</h3>
                            <canvas id="dataEntryTicketTrendChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h3>Data Entry Statistics</h3>
                            <canvas id="dataEntryStatsChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getDataEntryReportsHTML() {
        return `
            <div id="reportsSection" class="section">
                <div class="section-header">
                    <h2><i class="fas fa-chart-line"></i> Reports & Analytics</h2>
                    <p>Comprehensive data insights and export tools</p>
                </div>
                
                <!-- Export Controls -->
                <div class="report-card">
                    <h3><i class="fas fa-download"></i> Export Data</h3>
                    <div class="export-controls">
                        <div class="form-row">
                            <div class="form-col">
                                <label>Export Type</label>
                                <select id="dataEntryExportType">
                                    <option value="vehicles">Vehicle Data</option>
                                    <option value="routes">Route Data</option>
                                    <option value="summary">Summary Report</option>
                                </select>
                            </div>
                            <div class="form-col">
                                <label>Format</label>
                                <select id="dataEntryExportFormat">
                                    <option value="csv">CSV</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>
                        </div>
                        <div class="export-buttons">
                            <button id="dataEntryExportBtn" class="btn-primary">
                                <i class="fas fa-download"></i> Export Data
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Analytics Dashboard -->
                <div class="analytics-container">
                    <div class="section-header">
                        <h3><i class="fas fa-chart-bar"></i> Data Analytics Dashboard</h3>
                    </div>
                    
                    <!-- Summary Stats -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <i class="fas fa-car"></i>
                            <div class="stat-info">
                                <h3 id="reportVehicleCount">0</h3>
                                <p>Total Vehicles</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-route"></i>
                            <div class="stat-info">
                                <h3 id="reportRouteCount">0</h3>
                                <p>Total Routes</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-weight-hanging"></i>
                            <div class="stat-info">
                                <h3 id="avgVehicleWeight">0</h3>
                                <p>Avg Vehicle Weight (kg)</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <i class="fas fa-road"></i>
                            <div class="stat-info">
                                <h3 id="avgRouteLength">0</h3>
                                <p>Avg Route Length (km)</p>
                            </div>
                        </div>
                    </div>

                    <!-- Charts Grid -->
                    <div class="charts-grid">
                        <div class="chart-card">
                            <h3>Vehicle Distribution by Type</h3>
                            <canvas id="dataEntryVehicleTypeChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h3>Vehicle Weight Distribution</h3>
                            <canvas id="dataEntryVehicleWeightChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="charts-grid">
                        <div class="chart-card">
                            <h3>Routes by Weight Restriction</h3>
                            <canvas id="dataEntryRouteWeightChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h3>Route Length Distribution</h3>
                            <canvas id="dataEntryRouteLengthChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="charts-grid">
                        <div class="chart-card">
                            <h3>Recent Activity Trends</h3>
                            <canvas id="dataEntryActivityChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h3>Data Quality Overview</h3>
                            <canvas id="dataEntryQualityChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadAdminSections(container) {
        container.innerHTML += `
            <!-- Users Section -->
            <div id="usersSection" class="section">
                <div class="section-header">
                    <h2><i class="fas fa-users"></i> User Management</h2>
                    <button id="addUserBtn" class="btn-primary">
                        <i class="fas fa-plus"></i> Add User
                    </button>
                </div>
                <div class="table-container">
                    <table id="usersTable" class="data-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        ` + this.getVehiclesHTML() + this.getRoutesHTML() + this.getTicketsHTML() + this.getReportsHTML();
    }

    loadPoliceSections(container) {
        container.innerHTML += this.getTicketsHTML(true) + this.getVehiclesHTML(false) + this.getRoutesHTML(false);
    }

    loadDataEntrySections(container) {
        container.innerHTML += this.getVehiclesHTML() + this.getRoutesHTML() + this.getTicketsHTML(false) + this.getDataEntryReportsHTML();
    }

    getVehiclesHTML(canEdit = true) {
        return `
            <div id="vehiclesSection" class="section">
                <div class="section-header">
                    <h2><i class="fas fa-car"></i> ${canEdit ? 'Vehicle Management' : 'View Vehicles'}</h2>
                    ${canEdit ? '<button id="addVehicleBtn" class="btn-primary"><i class="fas fa-plus"></i> Add Vehicle</button>' : ''}
                </div>
                <div class="table-container">
                    <table id="vehiclesTable" class="data-table">
                        <thead>
                            <tr>
                                <th>License Plate</th>
                                <th>Type</th>
                                <th>Weight (kg)</th>
                                <th>Created</th>
                                ${canEdit ? '<th>Actions</th>' : ''}
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getRoutesHTML(canEdit = true) {
        return `
            <div id="routesSection" class="section">
                <div class="section-header">
                    <h2><i class="fas fa-route"></i> ${canEdit ? 'Route Management' : 'View Routes'}</h2>
                    ${canEdit ? '<button id="addRouteBtn" class="btn-primary"><i class="fas fa-plus"></i> Add Route</button>' : ''}
                </div>
                <div class="table-container">
                    <table id="routesTable" class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Length (km)</th>
                                <th>Weight Restriction (kg)</th>
                                <th>Created</th>
                                ${canEdit ? '<th>Actions</th>' : ''}
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getTicketsHTML(canGenerate = false) {
        return `
            <div id="ticketsSection" class="section">
                <div class="section-header">
                    <h2><i class="fas fa-ticket-alt"></i> ${canGenerate ? 'Generate Tickets' : 'View Tickets'}</h2>
                    ${canGenerate ? '<button id="addTicketBtn" class="btn-primary"><i class="fas fa-plus"></i> Generate Ticket</button>' : ''}
                </div>
                <div class="table-container">
                    <table id="ticketsTable" class="data-table">
                        <thead>
                            <tr>
                                <th>Date/Time</th>
                                <th>License Plate</th>
                                <th>Route</th>
                                <th>Officer</th>
                                <th>Type</th>
                                <th>Violation Details</th>
                                <th>Fine Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getReportsHTML() {
        return `
            <div id="reportsSection" class="section">
                <div class="section-header">
                    <h2><i class="fas fa-chart-bar"></i> Reports & Analytics</h2>
                </div>
                <div class="reports-container">
                    <div class="report-card">
                        <h3><i class="fas fa-download"></i> Export Reports</h3>
                        <div class="export-controls">
                            <div class="form-row">
                                <div class="form-col">
                                    <label>Start Date</label>
                                    <input type="date" id="reportStartDate">
                                </div>
                                <div class="form-col">
                                    <label>End Date</label>
                                    <input type="date" id="reportEndDate">
                                </div>
                                <div class="form-col">
                                    <label>Ticket Type</label>
                                    <select id="reportTicketType">
                                        <option value="all">All Types</option>
                                        <option value="speed">Speeding</option>
                                        <option value="overload">Overload</option>
                                        <option value="illegal_parking">Illegal Parking</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div class="export-buttons">
                                <button id="exportCsvBtn" class="btn-primary">
                                    <i class="fas fa-file-csv"></i> Export CSV
                                </button>
                                <button id="exportPdfBtn" class="btn-secondary">
                                    <i class="fas fa-file-pdf"></i> Export PDF
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="analytics-grid">
                        <div class="chart-card">
                            <h3>Top Violation Routes</h3>
                            <canvas id="topRoutesChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h3>Officer Performance</h3>
                            <canvas id="officerPerformanceChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    logout() {
        this.clearTimers();
        this.hideSessionWarning();
        localStorage.removeItem('vwds_token');
        localStorage.removeItem('vwds_user');
        this.token = null;
        this.user = null;
        location.reload();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Logout buttons for all portals
        const logoutBtns = ['adminLogoutBtn', 'policeLogoutBtn', 'dataEntryLogoutBtn'];
        logoutBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.logout();
                });
            }
        });
    }

    setupDynamicEventListeners() {
        // Add buttons - these are created dynamically after portal content is loaded
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn && !addUserBtn.hasListener) {
            addUserBtn.addEventListener('click', () => this.showUserForm());
            addUserBtn.hasListener = true;
        }

        const addVehicleBtn = document.getElementById('addVehicleBtn');
        if (addVehicleBtn && !addVehicleBtn.hasListener) {
            addVehicleBtn.addEventListener('click', () => this.showVehicleForm());
            addVehicleBtn.hasListener = true;
        }

        const addRouteBtn = document.getElementById('addRouteBtn');
        if (addRouteBtn && !addRouteBtn.hasListener) {
            addRouteBtn.addEventListener('click', () => this.showRouteForm());
            addRouteBtn.hasListener = true;
        }

        const addTicketBtn = document.getElementById('addTicketBtn');
        if (addTicketBtn && !addTicketBtn.hasListener) {
            addTicketBtn.addEventListener('click', () => this.showTicketForm());
            addTicketBtn.hasListener = true;
        }

        // Export buttons
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        if (exportCsvBtn && !exportCsvBtn.hasListener) {
            exportCsvBtn.addEventListener('click', () => this.exportReport('csv'));
            exportCsvBtn.hasListener = true;
        }

        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn && !exportPdfBtn.hasListener) {
            exportPdfBtn.addEventListener('click', () => this.exportReport('pdf'));
            exportPdfBtn.hasListener = true;
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionName + 'Section').classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionName}"]`).classList.add('active');

        // Load section data
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'vehicles':
                this.loadVehicles();
                break;
            case 'routes':
                this.loadRoutes();
                break;
            case 'tickets':
                this.loadTickets();
                break;
            case 'reports':
                if (this.user.role === 'admin') {
                    this.loadReports();
                } else if (this.user.role === 'data_entry') {
                    this.loadDataEntryReports();
                }
                break;
        }
    }

    async makeRequest(url, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            ...options
        };

        try {
            const response = await fetch(this.baseURL + url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            this.showAlert(error.message, 'error');
            throw error;
        }
    }

    async loadDashboard() {
        try {
            const stats = await this.makeRequest('/api/dashboard/stats');
            
            document.getElementById('totalTickets').textContent = stats.totalTickets;
            document.getElementById('totalVehicles').textContent = stats.totalVehicles;
            document.getElementById('totalRoutes').textContent = stats.totalRoutes;
            document.getElementById('totalUsers').textContent = stats.totalUsers;
            
            // Load analytics for charts
            if (this.user.role === 'admin') {
                await this.loadAnalytics();
            } else if (this.user.role === 'data_entry') {
                await this.loadDataEntryAnalytics();
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    }

    async loadUsers() {
        try {
            const users = await this.makeRequest('/api/users');
            this.renderUsersTable(users);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    renderUsersTable(users) {
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="role-badge">${user.role.replace('_', ' ').toUpperCase()}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-edit" onclick="app.editUser(${user.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-danger" onclick="app.deleteUser(${user.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadVehicles() {
        try {
            const vehicles = await this.makeRequest('/api/vehicles');
            this.renderVehiclesTable(vehicles);
        } catch (error) {
            console.error('Failed to load vehicles:', error);
        }
    }

    renderVehiclesTable(vehicles) {
        const tbody = document.querySelector('#vehiclesTable tbody');
        tbody.innerHTML = '';

        vehicles.forEach(vehicle => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${vehicle.licensePlate}</strong></td>
                <td>${vehicle.type}</td>
                <td>${vehicle.weight.toLocaleString()}</td>
                <td>${new Date(vehicle.created_at).toLocaleDateString()}</td>
                <td>
                    ${this.user.role === 'admin' || this.user.role === 'data_entry' ? `
                        <button class="btn-edit" onclick="app.editVehicle(${vehicle.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-danger" onclick="app.deleteVehicle(${vehicle.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadRoutes() {
        try {
            const routes = await this.makeRequest('/api/routes');
            this.renderRoutesTable(routes);
        } catch (error) {
            console.error('Failed to load routes:', error);
        }
    }

    renderRoutesTable(routes) {
        const tbody = document.querySelector('#routesTable tbody');
        tbody.innerHTML = '';

        routes.forEach(route => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${route.name}</strong></td>
                <td>${route.length}</td>
                <td>${route.weightRestriction.toLocaleString()}</td>
                <td>${new Date(route.created_at).toLocaleDateString()}</td>
                <td>
                    ${this.user.role === 'admin' || this.user.role === 'data_entry' ? `
                        <button class="btn-edit" onclick="app.editRoute(${route.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-danger" onclick="app.deleteRoute(${route.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadTickets() {
        try {
            const tickets = await this.makeRequest('/api/tickets');
            this.renderTicketsTable(tickets);
        } catch (error) {
            console.error('Failed to load tickets:', error);
        }
    }

    renderTicketsTable(tickets) {
        const tbody = document.querySelector('#ticketsTable tbody');
        tbody.innerHTML = '';

        tickets.forEach(ticket => {
            const row = document.createElement('tr');
            const ticketTypeDisplay = this.formatTicketType(ticket.ticket_type);
            row.innerHTML = `
                <td>${new Date(ticket.dateTime).toLocaleString()}</td>
                <td><strong>${ticket.licensePlate}</strong></td>
                <td>${ticket.routeName}</td>
                <td>${ticket.officerName || 'N/A'}</td>
                <td><span class="ticket-type-badge ticket-type-${ticket.ticket_type}">${ticketTypeDisplay}</span></td>
                <td>${ticket.violationDetails}</td>
                <td>$${ticket.fine_amount}</td>
                <td><span class="status-badge status-${ticket.status}">${ticket.status.toUpperCase()}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    formatTicketType(type) {
        switch(type) {
            case 'speed': return 'Speeding';
            case 'overload': return 'Overload';
            case 'illegal_parking': return 'Illegal Parking';
            case 'other': return 'Other';
            default: return 'Violation';
        }
    }

    showUserForm(userId = null) {
        const isEdit = userId !== null;
        const title = isEdit ? 'Edit User' : 'Add User';
        
        const form = `
            <form id="userForm">
                <div class="form-row">
                    <div class="form-col">
                        <label>Username</label>
                        <input type="text" id="userUsername" required>
                    </div>
                    <div class="form-col">
                        <label>Email</label>
                        <input type="email" id="userEmail" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-col">
                        <label>Role</label>
                        <select id="userRole" required>
                            <option value="">Select Role</option>
                            <option value="admin">Admin</option>
                            <option value="police_officer">Police Officer</option>
                            <option value="data_entry">Data Entry</option>
                        </select>
                    </div>
                    <div class="form-col">
                        <label>Password ${isEdit ? '(leave blank to keep current)' : ''}</label>
                        <input type="password" id="userPassword" ${!isEdit ? 'required' : ''}>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'} User</button>
                </div>
            </form>
        `;

        this.showModal(title, form);

        document.getElementById('userForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser(userId);
        });

        if (isEdit) {
            this.loadUserData(userId);
        }
    }

    async saveUser(userId = null) {
        const userData = {
            username: document.getElementById('userUsername').value,
            email: document.getElementById('userEmail').value,
            role: document.getElementById('userRole').value,
            password: document.getElementById('userPassword').value
        };

        try {
            if (userId) {
                await this.makeRequest(`/api/users/${userId}`, {
                    method: 'PUT',
                    body: JSON.stringify(userData)
                });
                this.showAlert('User updated successfully', 'success');
            } else {
                await this.makeRequest('/api/users', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
                this.showAlert('User created successfully', 'success');
            }

            this.closeModal();
            this.loadUsers();
        } catch (error) {
            console.error('Failed to save user:', error);
        }
    }

    async deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await this.makeRequest(`/api/users/${userId}`, {
                    method: 'DELETE'
                });
                this.showAlert('User deleted successfully', 'success');
                this.loadUsers();
            } catch (error) {
                console.error('Failed to delete user:', error);
            }
        }
    }

    showVehicleForm(vehicleId = null) {
        const isEdit = vehicleId !== null;
        const title = isEdit ? 'Edit Vehicle' : 'Add Vehicle';
        
        const form = `
            <form id="vehicleForm">
                <div class="form-row">
                    <div class="form-col">
                        <label>License Plate</label>
                        <input type="text" id="vehicleLicensePlate" placeholder="ABC-1234" required>
                    </div>
                    <div class="form-col">
                        <label>Type</label>
                        <input type="text" id="vehicleType" placeholder="Heavy Truck" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-col">
                        <label>Weight (kg)</label>
                        <input type="number" id="vehicleWeight" step="0.01" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'} Vehicle</button>
                </div>
            </form>
        `;

        this.showModal(title, form);

        document.getElementById('vehicleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveVehicle(vehicleId);
        });

        if (isEdit) {
            this.loadVehicleData(vehicleId);
        }
    }

    async saveVehicle(vehicleId = null) {
        const vehicleData = {
            licensePlate: document.getElementById('vehicleLicensePlate').value,
            type: document.getElementById('vehicleType').value,
            weight: parseFloat(document.getElementById('vehicleWeight').value)
        };

        try {
            if (vehicleId) {
                await this.makeRequest(`/api/vehicles/${vehicleId}`, {
                    method: 'PUT',
                    body: JSON.stringify(vehicleData)
                });
                this.showAlert('Vehicle updated successfully', 'success');
            } else {
                await this.makeRequest('/api/vehicles', {
                    method: 'POST',
                    body: JSON.stringify(vehicleData)
                });
                this.showAlert('Vehicle created successfully', 'success');
            }

            this.closeModal();
            this.loadVehicles();
        } catch (error) {
            console.error('Failed to save vehicle:', error);
        }
    }

    async deleteVehicle(vehicleId) {
        if (confirm('Are you sure you want to delete this vehicle?')) {
            try {
                await this.makeRequest(`/api/vehicles/${vehicleId}`, {
                    method: 'DELETE'
                });
                this.showAlert('Vehicle deleted successfully', 'success');
                this.loadVehicles();
            } catch (error) {
                console.error('Failed to delete vehicle:', error);
            }
        }
    }

    showRouteForm(routeId = null) {
        const isEdit = routeId !== null;
        const title = isEdit ? 'Edit Route' : 'Add Route';
        
        const form = `
            <form id="routeForm">
                <div class="form-row">
                    <div class="form-col">
                        <label>Route Name</label>
                        <input type="text" id="routeName" placeholder="Highway A1" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-col">
                        <label>Length (km)</label>
                        <input type="number" id="routeLength" step="0.1" required>
                    </div>
                    <div class="form-col">
                        <label>Weight Restriction (kg)</label>
                        <input type="number" id="routeWeightRestriction" step="0.01" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'} Route</button>
                </div>
            </form>
        `;

        this.showModal(title, form);

        document.getElementById('routeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRoute(routeId);
        });

        if (isEdit) {
            this.loadRouteData(routeId);
        }
    }

    async saveRoute(routeId = null) {
        const routeData = {
            name: document.getElementById('routeName').value,
            length: parseFloat(document.getElementById('routeLength').value),
            weightRestriction: parseFloat(document.getElementById('routeWeightRestriction').value)
        };

        try {
            if (routeId) {
                await this.makeRequest(`/api/routes/${routeId}`, {
                    method: 'PUT',
                    body: JSON.stringify(routeData)
                });
                this.showAlert('Route updated successfully', 'success');
            } else {
                await this.makeRequest('/api/routes', {
                    method: 'POST',
                    body: JSON.stringify(routeData)
                });
                this.showAlert('Route created successfully', 'success');
            }

            this.closeModal();
            this.loadRoutes();
        } catch (error) {
            console.error('Failed to save route:', error);
        }
    }

    async deleteRoute(routeId) {
        if (confirm('Are you sure you want to delete this route?')) {
            try {
                await this.makeRequest(`/api/routes/${routeId}`, {
                    method: 'DELETE'
                });
                this.showAlert('Route deleted successfully', 'success');
                this.loadRoutes();
            } catch (error) {
                console.error('Failed to delete route:', error);
            }
        }
    }

    async showTicketForm() {
        const form = `
            <form id="ticketForm">
                <div class="form-row">
                    <div class="form-col">
                        <label>License Plate Number *</label>
                        <div class="autocomplete-container">
                            <input type="text" id="ticketLicensePlate" placeholder="Enter license plate (e.g., ABC-1234)" required>
                            <div id="licensePlateDropdown" class="autocomplete-dropdown"></div>
                        </div>
                        <div id="vehicleInfo" class="vehicle-info" style="display: none;">
                            <small><strong>Vehicle:</strong> <span id="vehicleDetails"></span></small>
                        </div>
                    </div>
                    <div class="form-col">
                        <label>Route Name *</label>
                        <div class="autocomplete-container">
                            <input type="text" id="ticketRouteName" placeholder="Enter route name" required>
                            <div id="routeDropdown" class="autocomplete-dropdown"></div>
                        </div>
                        <div id="routeInfo" class="route-info" style="display: none;">
                            <small><strong>Weight Limit:</strong> <span id="routeDetails"></span></small>
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-col">
                        <label>Ticket Type *</label>
                        <select id="ticketType" required>
                            <option value="">Select Violation Type</option>
                            <option value="speed">Speeding</option>
                            <option value="overload">Overload</option>
                            <option value="illegal_parking">Illegal Parking</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-col">
                        <label>Fine Amount ($)</label>
                        <input type="number" id="ticketFineAmount" step="0.01" value="0" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-col">
                        <label>Violation Details *</label>
                        <textarea id="ticketViolationDetails" placeholder="Describe the violation details..." required></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Generate Ticket</button>
                </div>
            </form>
        `;

        this.showModal('Generate Ticket', form);

        // Setup autocomplete for license plates
        this.setupLicensePlateAutocomplete();
        this.setupRouteAutocomplete();

        document.getElementById('ticketForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTicket();
        });
    }

    setupLicensePlateAutocomplete() {
        const input = document.getElementById('ticketLicensePlate');
        const dropdown = document.getElementById('licensePlateDropdown');
        let debounceTimer;

        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                const query = e.target.value.trim();
                if (query.length < 1) {
                    dropdown.style.display = 'none';
                    document.getElementById('vehicleInfo').style.display = 'none';
                    return;
                }

                try {
                    const vehicles = await this.makeRequest(`/api/vehicles/search?query=${encodeURIComponent(query)}`);
                    this.showVehicleSuggestions(vehicles, dropdown);
                } catch (error) {
                    console.error('Error fetching vehicle suggestions:', error);
                }
            }, 300);
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    showVehicleSuggestions(vehicles, dropdown) {
        if (vehicles.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        dropdown.innerHTML = vehicles.map(vehicle => `
            <div class="autocomplete-item" data-plate="${vehicle.licensePlate}" data-type="${vehicle.type}" data-weight="${vehicle.weight}">
                <strong>${vehicle.licensePlate}</strong> - ${vehicle.type} (${vehicle.weight}kg)
            </div>
        `).join('');

        dropdown.style.display = 'block';

        // Add click handlers
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const plate = item.dataset.plate;
                const type = item.dataset.type;
                const weight = item.dataset.weight;

                document.getElementById('ticketLicensePlate').value = plate;
                document.getElementById('vehicleDetails').textContent = `${type} (${weight}kg)`;
                document.getElementById('vehicleInfo').style.display = 'block';
                dropdown.style.display = 'none';
            });
        });
    }

    setupRouteAutocomplete() {
        const input = document.getElementById('ticketRouteName');
        const dropdown = document.getElementById('routeDropdown');
        let debounceTimer;

        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                const query = e.target.value.trim();
                if (query.length < 1) {
                    dropdown.style.display = 'none';
                    document.getElementById('routeInfo').style.display = 'none';
                    return;
                }

                try {
                    const routes = await this.makeRequest(`/api/routes/search?query=${encodeURIComponent(query)}`);
                    this.showRouteSuggestions(routes, dropdown);
                } catch (error) {
                    console.error('Error fetching route suggestions:', error);
                }
            }, 300);
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    showRouteSuggestions(routes, dropdown) {
        if (routes.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        dropdown.innerHTML = routes.map(route => `
            <div class="autocomplete-item" data-name="${route.name}" data-weight="${route.weightRestriction}">
                <strong>${route.name}</strong> - Weight limit: ${route.weightRestriction}kg
            </div>
        `).join('');

        dropdown.style.display = 'block';

        // Add click handlers
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                const weightLimit = item.dataset.weight;

                document.getElementById('ticketRouteName').value = name;
                document.getElementById('routeDetails').textContent = `${weightLimit}kg`;
                document.getElementById('routeInfo').style.display = 'block';
                dropdown.style.display = 'none';
            });
        });
    }

    async saveTicket() {
        const ticketData = {
            licensePlate: document.getElementById('ticketLicensePlate').value,
            routeName: document.getElementById('ticketRouteName').value,
            ticket_type: document.getElementById('ticketType').value,
            violationDetails: document.getElementById('ticketViolationDetails').value,
            fine_amount: parseFloat(document.getElementById('ticketFineAmount').value)
        };

        try {
            await this.makeRequest('/api/tickets', {
                method: 'POST',
                body: JSON.stringify(ticketData)
            });
            this.showAlert('Ticket generated successfully', 'success');
            this.closeModal();
            this.loadTickets();
        } catch (error) {
            console.error('Failed to generate ticket:', error);
        }
    }

    showModal(title, content) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        document.getElementById('formModal').classList.add('active');
    }

    closeModal() {
        document.getElementById('formModal').classList.remove('active');
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        document.body.insertBefore(alertDiv, document.body.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    async editUser(userId) {
        this.showUserForm(userId);
    }

    async editVehicle(vehicleId) {
        this.showVehicleForm(vehicleId);
    }

    async editRoute(routeId) {
        this.showRouteForm(routeId);
    }

    // Placeholder methods for loading edit data
    async loadUserData(userId) {
        // Implementation would load user data and populate form
    }

    async loadVehicleData(vehicleId) {
        // Implementation would load vehicle data and populate form
    }

    async loadRouteData(routeId) {
        // Implementation would load route data and populate form
    }

    async loadAnalytics() {
        try {
            console.log('Loading analytics - user role:', this.user.role);
            console.log('Token exists:', !!this.token);
            
            const analytics = await this.makeRequest('/api/reports/analytics');
            console.log('Analytics data received:', analytics); // Debug log
            
            // Provide default empty data if no data exists
            const safeAnalytics = {
                ticketsByType: analytics.ticketsByType || [],
                ticketsByMonth: analytics.ticketsByMonth || [],
                topRoutes: analytics.topRoutes || [],
                topOfficers: analytics.topOfficers || []
            };
            
            this.renderCharts(safeAnalytics);
        } catch (error) {
            console.error('Failed to load analytics - full error:', error);
            console.error('Error message:', error.message);
            this.showAlert('Failed to load analytics data', 'error');
            
            // Render empty charts on error
            this.renderCharts({
                ticketsByType: [],
                ticketsByMonth: [],
                topRoutes: [],
                topOfficers: []
            });
        }
    }

    renderCharts(analytics) {
        console.log('renderCharts called with data:', analytics);
        
        // Destroy existing charts first
        if (this.charts) {
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.destroy();
            });
        }
        this.charts = {};
        
        // Tickets by Type Chart
        const typeCtx = document.getElementById('ticketTypeChart');
        console.log('ticketTypeChart element:', typeCtx);
        if (typeCtx) {
            try {
                const hasTypeData = analytics.ticketsByType && analytics.ticketsByType.length > 0;
                this.charts.typeChart = new Chart(typeCtx, {
                type: 'doughnut',
                data: {
                    labels: hasTypeData ? analytics.ticketsByType.map(item => this.formatTicketType(item.ticket_type)) : ['No Data'],
                    datasets: [{
                        data: hasTypeData ? analytics.ticketsByType.map(item => item.count) : [1],
                        backgroundColor: hasTypeData ? ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] : ['#e0e0e0']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: hasTypeData
                        }
                    }
                }
            });
            } catch (error) {
                console.error('Error creating ticket type chart:', error);
            }
        }

        // Monthly Tickets Chart
        const monthlyCtx = document.getElementById('monthlyTicketsChart');
        console.log('monthlyTicketsChart element:', monthlyCtx);
        if (monthlyCtx) {
            this.charts.monthlyChart = new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: analytics.ticketsByMonth.map(item => item.month),
                    datasets: [{
                        label: 'Tickets',
                        data: analytics.ticketsByMonth.map(item => item.count),
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Top Routes Chart
        const routesCtx = document.getElementById('topRoutesChart');
        console.log('topRoutesChart element:', routesCtx);
        if (routesCtx) {
            this.charts.routesChart = new Chart(routesCtx, {
                type: 'bar',
                data: {
                    labels: analytics.topRoutes.slice(0, 5).map(item => item.name),
                    datasets: [{
                        label: 'Violations',
                        data: analytics.topRoutes.slice(0, 5).map(item => item.violations),
                        backgroundColor: '#FF6384'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Officer Performance Chart
        const officerCtx = document.getElementById('officerPerformanceChart');
        console.log('officerPerformanceChart element:', officerCtx);
        if (officerCtx) {
            this.charts.officerChart = new Chart(officerCtx, {
                type: 'bar',
                data: {
                    labels: analytics.topOfficers.slice(0, 5).map(item => item.username),
                    datasets: [{
                        label: 'Tickets Issued',
                        data: analytics.topOfficers.slice(0, 5).map(item => item.tickets_issued),
                        backgroundColor: '#4BC0C0'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    async loadReports() {
        if (this.user.role === 'admin') {
            await this.loadAnalytics();
        }
    }

    async loadDataEntryAnalytics() {
        try {
            console.log('Loading data entry analytics');
            
            // Load vehicles and routes data for charts
            const [vehicles, routes, tickets] = await Promise.all([
                this.makeRequest('/api/vehicles'),
                this.makeRequest('/api/routes'), 
                this.makeRequest('/api/tickets')
            ]);
            
            this.renderDataEntryCharts({ vehicles, routes, tickets });
        } catch (error) {
            console.error('Failed to load data entry analytics:', error);
        }
    }

    async loadDataEntryReports() {
        try {
            console.log('Loading data entry reports');
            
            // Load all data for comprehensive analytics
            const [vehicles, routes, tickets] = await Promise.all([
                this.makeRequest('/api/vehicles'),
                this.makeRequest('/api/routes'), 
                this.makeRequest('/api/tickets')
            ]);
            
            // Update summary statistics
            this.updateDataEntryStats({ vehicles, routes, tickets });
            
            // Render comprehensive charts
            this.renderEnhancedDataEntryCharts({ vehicles, routes, tickets });
            
            // Setup export functionality
            this.setupDataEntryExport();
            
        } catch (error) {
            console.error('Failed to load data entry reports:', error);
            this.showAlert('Failed to load reports data', 'error');
        }
    }

    updateDataEntryStats(data) {
        const { vehicles, routes, tickets } = data;
        
        // Update stat cards
        document.getElementById('reportVehicleCount').textContent = vehicles.length;
        document.getElementById('reportRouteCount').textContent = routes.length;
        
        // Calculate averages
        const avgWeight = vehicles.length > 0 
            ? (vehicles.reduce((sum, v) => sum + v.weight, 0) / vehicles.length).toFixed(0)
            : 0;
        document.getElementById('avgVehicleWeight').textContent = avgWeight.toLocaleString();
        
        const avgLength = routes.length > 0 
            ? (routes.reduce((sum, r) => sum + r.length, 0) / routes.length).toFixed(1)
            : 0;
        document.getElementById('avgRouteLength').textContent = avgLength;
    }

    renderDataEntryCharts(data) {
        console.log('Rendering data entry charts with:', data);
        
        // Destroy existing charts first
        if (this.dataEntryCharts) {
            Object.values(this.dataEntryCharts).forEach(chart => {
                if (chart) chart.destroy();
            });
        }
        this.dataEntryCharts = {};
        
        // Vehicle Type Distribution Chart
        const vehicleCtx = document.getElementById('dataEntryVehicleTypeChart');
        if (vehicleCtx && data.vehicles) {
            const vehicleTypes = {};
            data.vehicles.forEach(vehicle => {
                vehicleTypes[vehicle.type] = (vehicleTypes[vehicle.type] || 0) + 1;
            });
            
            this.dataEntryCharts.vehicleChart = new Chart(vehicleCtx, {
                type: 'pie',
                data: {
                    labels: Object.keys(vehicleTypes),
                    datasets: [{
                        data: Object.values(vehicleTypes),
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        // Route Weight Distribution Chart
        const routeCtx = document.getElementById('dataEntryRouteWeightChart');
        if (routeCtx && data.routes) {
            const weightRanges = {
                'Light (< 30k kg)': 0,
                'Medium (30-50k kg)': 0,
                'Heavy (> 50k kg)': 0
            };
            
            data.routes.forEach(route => {
                if (route.weightRestriction < 30000) {
                    weightRanges['Light (< 30k kg)']++;
                } else if (route.weightRestriction <= 50000) {
                    weightRanges['Medium (30-50k kg)']++;
                } else {
                    weightRanges['Heavy (> 50k kg)']++;
                }
            });
            
            this.dataEntryCharts.routeChart = new Chart(routeCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(weightRanges),
                    datasets: [{
                        label: 'Number of Routes',
                        data: Object.values(weightRanges),
                        backgroundColor: '#36A2EB'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
        
        // Recent Ticket Trends Chart  
        const trendCtx = document.getElementById('dataEntryTicketTrendChart');
        if (trendCtx && data.tickets) {
            const last7Days = {};
            const today = new Date();
            
            // Initialize last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                last7Days[dateStr] = 0;
            }
            
            // Count tickets by day
            data.tickets.forEach(ticket => {
                const dateStr = ticket.dateTime.split(' ')[0];
                if (last7Days.hasOwnProperty(dateStr)) {
                    last7Days[dateStr]++;
                }
            });
            
            this.dataEntryCharts.trendChart = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: Object.keys(last7Days).map(date => new Date(date).toLocaleDateString()),
                    datasets: [{
                        label: 'Daily Tickets',
                        data: Object.values(last7Days),
                        borderColor: '#FF6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
        
        // Data Entry Statistics Chart
        const statsCtx = document.getElementById('dataEntryStatsChart');
        if (statsCtx) {
            this.dataEntryCharts.statsChart = new Chart(statsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Vehicles', 'Routes', 'Tickets'],
                    datasets: [{
                        data: [
                            data.vehicles ? data.vehicles.length : 0,
                            data.routes ? data.routes.length : 0, 
                            data.tickets ? data.tickets.length : 0
                        ],
                        backgroundColor: ['#4BC0C0', '#FFCE56', '#FF6384']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    renderEnhancedDataEntryCharts(data) {
        console.log('Rendering enhanced data entry charts with:', data);
        
        // Destroy existing charts first
        if (this.dataEntryCharts) {
            Object.values(this.dataEntryCharts).forEach(chart => {
                if (chart) chart.destroy();
            });
        }
        this.dataEntryCharts = {};
        
        const { vehicles, routes, tickets } = data;
        
        // 1. Vehicle Type Distribution Chart
        const vehicleTypeCtx = document.getElementById('dataEntryVehicleTypeChart');
        if (vehicleTypeCtx && vehicles) {
            const vehicleTypes = {};
            vehicles.forEach(vehicle => {
                vehicleTypes[vehicle.type] = (vehicleTypes[vehicle.type] || 0) + 1;
            });
            
            this.dataEntryCharts.vehicleTypeChart = new Chart(vehicleTypeCtx, {
                type: 'pie',
                data: {
                    labels: Object.keys(vehicleTypes),
                    datasets: [{
                        data: Object.values(vehicleTypes),
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        // 2. Vehicle Weight Distribution Chart
        const vehicleWeightCtx = document.getElementById('dataEntryVehicleWeightChart');
        if (vehicleWeightCtx && vehicles) {
            const weightRanges = {
                'Light (< 20k kg)': 0,
                'Medium (20-40k kg)': 0,
                'Heavy (40-60k kg)': 0,
                'Extra Heavy (> 60k kg)': 0
            };
            
            vehicles.forEach(vehicle => {
                if (vehicle.weight < 20000) {
                    weightRanges['Light (< 20k kg)']++;
                } else if (vehicle.weight <= 40000) {
                    weightRanges['Medium (20-40k kg)']++;
                } else if (vehicle.weight <= 60000) {
                    weightRanges['Heavy (40-60k kg)']++;
                } else {
                    weightRanges['Extra Heavy (> 60k kg)']++;
                }
            });
            
            this.dataEntryCharts.vehicleWeightChart = new Chart(vehicleWeightCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(weightRanges),
                    datasets: [{
                        label: 'Number of Vehicles',
                        data: Object.values(weightRanges),
                        backgroundColor: '#FF6384'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            });
        }
        
        // 3. Route Weight Restriction Chart
        const routeWeightCtx = document.getElementById('dataEntryRouteWeightChart');
        if (routeWeightCtx && routes) {
            const weightRanges = {
                'Light (< 30k kg)': 0,
                'Medium (30-50k kg)': 0,
                'Heavy (> 50k kg)': 0
            };
            
            routes.forEach(route => {
                if (route.weightRestriction < 30000) {
                    weightRanges['Light (< 30k kg)']++;
                } else if (route.weightRestriction <= 50000) {
                    weightRanges['Medium (30-50k kg)']++;
                } else {
                    weightRanges['Heavy (> 50k kg)']++;
                }
            });
            
            this.dataEntryCharts.routeWeightChart = new Chart(routeWeightCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(weightRanges),
                    datasets: [{
                        data: Object.values(weightRanges),
                        backgroundColor: ['#36A2EB', '#FFCE56', '#FF6384']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        // 4. Route Length Distribution Chart
        const routeLengthCtx = document.getElementById('dataEntryRouteLengthChart');
        if (routeLengthCtx && routes) {
            const lengthRanges = {
                'Short (< 10 km)': 0,
                'Medium (10-25 km)': 0,
                'Long (> 25 km)': 0
            };
            
            routes.forEach(route => {
                if (route.length < 10) {
                    lengthRanges['Short (< 10 km)']++;
                } else if (route.length <= 25) {
                    lengthRanges['Medium (10-25 km)']++;
                } else {
                    lengthRanges['Long (> 25 km)']++;
                }
            });
            
            this.dataEntryCharts.routeLengthChart = new Chart(routeLengthCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(lengthRanges),
                    datasets: [{
                        label: 'Number of Routes',
                        data: Object.values(lengthRanges),
                        backgroundColor: '#4BC0C0'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            });
        }
        
        // 5. Activity Trends Chart (Last 30 days)
        const activityCtx = document.getElementById('dataEntryActivityChart');
        if (activityCtx && tickets) {
            const last30Days = {};
            const today = new Date();
            
            // Initialize last 30 days
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                last30Days[dateStr] = 0;
            }
            
            // Count tickets by day
            tickets.forEach(ticket => {
                const dateStr = ticket.dateTime.split(' ')[0];
                if (last30Days.hasOwnProperty(dateStr)) {
                    last30Days[dateStr]++;
                }
            });
            
            this.dataEntryCharts.activityChart = new Chart(activityCtx, {
                type: 'line',
                data: {
                    labels: Object.keys(last30Days).map(date => {
                        const d = new Date(date);
                        return d.getDate() + '/' + (d.getMonth() + 1);
                    }),
                    datasets: [{
                        label: 'Daily Tickets',
                        data: Object.values(last30Days),
                        borderColor: '#9966FF',
                        backgroundColor: 'rgba(153, 102, 255, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            });
        }
        
        // 6. Data Quality Overview Chart
        const qualityCtx = document.getElementById('dataEntryQualityChart');
        if (qualityCtx) {
            const qualityMetrics = {
                'Complete Records': vehicles.length + routes.length,
                'Recent Activity': tickets.filter(t => {
                    const ticketDate = new Date(t.dateTime);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return ticketDate >= weekAgo;
                }).length,
                'Data Integrity': Math.floor(Math.random() * 10) + 90 // Simulated metric
            };
            
            this.dataEntryCharts.qualityChart = new Chart(qualityCtx, {
                type: 'radar',
                data: {
                    labels: Object.keys(qualityMetrics),
                    datasets: [{
                        label: 'Quality Score',
                        data: Object.values(qualityMetrics),
                        borderColor: '#FF6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: { beginAtZero: true }
                    }
                }
            });
        }
    }

    setupDataEntryExport() {
        const exportBtn = document.getElementById('dataEntryExportBtn');
        if (exportBtn && !exportBtn.hasListener) {
            exportBtn.addEventListener('click', () => this.exportDataEntryReport());
            exportBtn.hasListener = true;
        }
    }

    async exportDataEntryReport() {
        const exportType = document.getElementById('dataEntryExportType').value;
        const format = document.getElementById('dataEntryExportFormat').value;
        
        try {
            let endpoint = '';
            let filename = '';
            
            switch (exportType) {
                case 'vehicles':
                    endpoint = '/api/vehicles';
                    filename = `vehicles-export.${format}`;
                    break;
                case 'routes':
                    endpoint = '/api/routes';
                    filename = `routes-export.${format}`;
                    break;
                case 'summary':
                    // Create a summary report
                    await this.exportSummaryReport(format);
                    return;
            }
            
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Export failed');
            }
            
            const data = await response.json();
            
            if (format === 'csv') {
                this.downloadCSV(data, filename);
            } else {
                this.downloadPDF(data, filename, exportType);
            }
            
            this.showAlert(`${exportType.charAt(0).toUpperCase() + exportType.slice(1)} exported successfully`, 'success');
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showAlert('Export failed. Please try again.', 'error');
        }
    }

    downloadCSV(data, filename) {
        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value}"` : value;
            }).join(','))
        ].join('\n');
        
        return csvContent;
    }

    async exportSummaryReport(format) {
        // This would create a comprehensive summary report
        this.showAlert('Summary report export coming soon!', 'info');
    }

    downloadPDF(data, filename, type) {
        // This would generate a PDF report
        this.showAlert('PDF export coming soon!', 'info');
    }

    async exportReport(format) {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        const ticketType = document.getElementById('reportTicketType').value;

        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (ticketType) params.append('ticketType', ticketType);

        const url = `/api/reports/tickets/${format}?${params.toString()}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `tickets-report.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            this.showAlert(`Report exported successfully as ${format.toUpperCase()}`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showAlert('Failed to export report', 'error');
        }
    }

    // Session Management Methods
    startInactivityTimer() {
        this.clearTimers();
        
        // Set warning timer (25 minutes - 5 minutes before timeout)
        this.warningTimer = setTimeout(() => {
            this.showSessionWarning();
        }, this.inactivityTimeout - this.warningTime);
        
        // Set logout timer (30 minutes)
        this.inactivityTimer = setTimeout(() => {
            this.autoLogout();
        }, this.inactivityTimeout);
    }

    resetInactivityTimer() {
        if (this.warningShown) {
            this.hideSessionWarning();
        }
        this.startInactivityTimer();
    }

    clearTimers() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
            this.warningTimer = null;
        }
    }

    setupActivityListeners() {
        // Events that indicate user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.resetInactivityTimer();
            }, true);
        });
    }

    showSessionWarning() {
        this.warningShown = true;
        
        const warningModal = document.createElement('div');
        warningModal.id = 'sessionWarningModal';
        warningModal.className = 'modal active';
        warningModal.innerHTML = `
            <div class="modal-content session-warning">
                <div class="warning-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Session Timeout Warning</h2>
                </div>
                <div class="warning-body">
                    <p>Your session will expire in <span id="countdown">5:00</span> due to inactivity.</p>
                    <p>Click "Stay Logged In" to continue your session.</p>
                </div>
                <div class="warning-actions">
                    <button id="stayLoggedInBtn" class="btn-primary">
                        <i class="fas fa-clock"></i> Stay Logged In
                    </button>
                    <button id="logoutNowBtn" class="btn-secondary">
                        <i class="fas fa-sign-out-alt"></i> Logout Now
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(warningModal);
        
        // Start countdown
        this.startCountdown();
        
        // Event listeners
        document.getElementById('stayLoggedInBtn').addEventListener('click', () => {
            this.extendSession();
        });
        
        document.getElementById('logoutNowBtn').addEventListener('click', () => {
            this.autoLogout();
        });
    }

    startCountdown() {
        let timeLeft = this.warningTime / 1000; // Convert to seconds
        const countdownElement = document.getElementById('countdown');
        
        this.countdownInterval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            if (countdownElement) {
                countdownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(this.countdownInterval);
            }
        }, 1000);
    }

    hideSessionWarning() {
        const warningModal = document.getElementById('sessionWarningModal');
        if (warningModal) {
            warningModal.remove();
        }
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        this.warningShown = false;
    }

    extendSession() {
        this.hideSessionWarning();
        this.resetInactivityTimer();
        this.showAlert('Session extended successfully', 'success');
    }

    autoLogout() {
        this.clearTimers();
        this.hideSessionWarning();
        this.showAlert('Session expired due to inactivity', 'warning');
        
        setTimeout(() => {
            this.logout();
        }, 2000);
    }
}

// Global functions for onclick handlers
function closeModal() {
    app.closeModal();
}

// Initialize the app
const app = new VWDSApp();