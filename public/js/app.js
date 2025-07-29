class VWDSApp {
    constructor() {
        this.token = localStorage.getItem('vwds_token');
        this.user = JSON.parse(localStorage.getItem('vwds_user') || 'null');
        this.baseURL = '';
        
        this.init();
    }

    init() {
        if (this.token && this.user) {
            this.showApp();
            this.setupEventListeners();
            this.loadDashboard();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginModal').classList.add('active');
        document.getElementById('app').style.display = 'none';
        
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
    }

    showApp() {
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('app').style.display = 'flex';
        
        // Update user info
        document.getElementById('currentUser').textContent = this.user.username;
        document.getElementById('currentRole').textContent = this.user.role.replace('_', ' ').toUpperCase();
        
        // Show/hide menu items based on role
        this.setupRoleBasedUI();
    }

    setupRoleBasedUI() {
        const role = this.user.role;
        
        // Show menus based on role
        if (role === 'admin') {
            document.getElementById('usersMenu').style.display = 'block';
            document.getElementById('vehiclesMenu').style.display = 'block';
            document.getElementById('routesMenu').style.display = 'block';
        } else if (role === 'data_entry') {
            document.getElementById('vehiclesMenu').style.display = 'block';
            document.getElementById('routesMenu').style.display = 'block';
        }
        // police_officer can only see dashboard and tickets (already visible)
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('vwds_token', this.token);
                localStorage.setItem('vwds_user', JSON.stringify(this.user));
                
                this.showApp();
                this.setupEventListeners();
                this.loadDashboard();
            } else {
                this.showAlert(data.error, 'error');
            }
        } catch (error) {
            this.showAlert('Login failed. Please try again.', 'error');
        }
    }

    logout() {
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

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Add buttons
        document.getElementById('addUserBtn')?.addEventListener('click', () => this.showUserForm());
        document.getElementById('addVehicleBtn')?.addEventListener('click', () => this.showVehicleForm());
        document.getElementById('addRouteBtn')?.addEventListener('click', () => this.showRouteForm());
        document.getElementById('addTicketBtn')?.addEventListener('click', () => this.showTicketForm());
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
            row.innerHTML = `
                <td>${new Date(ticket.dateTime).toLocaleString()}</td>
                <td><strong>${ticket.licensePlate}</strong></td>
                <td>${ticket.routeName}</td>
                <td>${ticket.officerName || 'N/A'}</td>
                <td>${ticket.violationDetails}</td>
                <td>$${ticket.fine_amount}</td>
                <td><span class="status-badge status-${ticket.status}">${ticket.status.toUpperCase()}</span></td>
            `;
            tbody.appendChild(row);
        });
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
        try {
            const [vehicles, routes] = await Promise.all([
                this.makeRequest('/api/vehicles'),
                this.makeRequest('/api/routes')
            ]);

            const vehicleOptions = vehicles.map(v => `<option value="${v.id}">${v.licensePlate} - ${v.type}</option>`).join('');
            const routeOptions = routes.map(r => `<option value="${r.id}">${r.name} (${r.weightRestriction}kg limit)</option>`).join('');

            const form = `
                <form id="ticketForm">
                    <div class="form-row">
                        <div class="form-col">
                            <label>Vehicle</label>
                            <select id="ticketVehicle" required>
                                <option value="">Select Vehicle</option>
                                ${vehicleOptions}
                            </select>
                        </div>
                        <div class="form-col">
                            <label>Route</label>
                            <select id="ticketRoute" required>
                                <option value="">Select Route</option>
                                ${routeOptions}
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-col">
                            <label>Fine Amount ($)</label>
                            <input type="number" id="ticketFineAmount" step="0.01" value="0" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-col">
                            <label>Violation Details</label>
                            <textarea id="ticketViolationDetails" placeholder="Describe the weight violation..." required></textarea>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Generate Ticket</button>
                    </div>
                </form>
            `;

            this.showModal('Generate Ticket', form);

            document.getElementById('ticketForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTicket();
            });
        } catch (error) {
            console.error('Failed to load ticket form data:', error);
        }
    }

    async saveTicket() {
        const ticketData = {
            vehicle_id: parseInt(document.getElementById('ticketVehicle').value),
            route_id: parseInt(document.getElementById('ticketRoute').value),
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
}

// Global functions for onclick handlers
function closeModal() {
    app.closeModal();
}

// Initialize the app
const app = new VWDSApp();