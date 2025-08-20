# Vehicle Weight Detection System (VWDS) - Frontend

A modern web-based frontend for the Vehicle Weight Detection System with role-based access control and comprehensive admin portal.

## Features

### **Admin Portal**
- **User Management**: Create, edit, and delete system users
- **Role-Based Access Control**: Admin, Police Officer, and Data Entry roles
- **Dashboard**: Real-time statistics and overview
- **Complete CRUD Operations**: Full management of all system entities

### **Police Officer Interface**
- **Ticket Generation**: Create violation tickets for vehicles
- **Vehicle Lookup**: Search and view vehicle information
- **Route Information**: Access route details and restrictions
- **Ticket History**: View generated tickets

### **Data Entry Interface**
- **Vehicle Management**: Add, edit, and delete vehicle records
- **Route Management**: Manage routes with weight restrictions
- **Data Validation**: Ensure data integrity and format compliance

### **Reports & Analytics**
- **Data Visualization**: Interactive charts showing ticket statistics and trends
- **Export Capabilities**: Generate reports in CSV and PDF formats
- **Real-time Analytics**: Dashboard with live statistics and performance metrics
- **Chart Types**: Pie charts for ticket types, line charts for monthly trends, bar charts for route and officer performance

## Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite3 (converted from MySQL)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: JWT-based authentication
- **Security**: bcrypt password hashing, role-based authorization
- **Charts**: Chart.js for data visualization
- **Reports**: PDFKit for PDF generation, json2csv for CSV exports

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database**
   ```bash
   sqlite3 vwds.db < schema.sql
   ```

3. **Start the Server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open your browser and go to: `http://localhost:3000`
   - Default admin credentials:
     - Username: `admin`
     - Password: `admin123`

## User Roles & Permissions

### **Admin**
- Full system access
- User management (create, edit, delete users)
- Vehicle and route management
- Ticket oversight
- System statistics and reporting
- Reports and analytics access (CSV/PDF export, data visualization)

### **Police Officer**
- Generate violation tickets
- View vehicles and routes (read-only)
- Access ticket history
- Dashboard statistics

### **Data Entry**
- Manage vehicle records (add, edit, delete)
- Manage route information (add, edit, delete)
- View tickets (read-only)
- Dashboard access

## API Endpoints

### Authentication
- `POST /api/login` - User authentication

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Vehicles
- `GET /api/vehicles` - List vehicles
- `POST /api/vehicles` - Create vehicle (Admin/Data Entry)
- `PUT /api/vehicles/:id` - Update vehicle (Admin/Data Entry)
- `DELETE /api/vehicles/:id` - Delete vehicle (Admin/Data Entry)

### Routes
- `GET /api/routes` - List routes
- `POST /api/routes` - Create route (Admin/Data Entry)
- `PUT /api/routes/:id` - Update route (Admin/Data Entry)
- `DELETE /api/routes/:id` - Delete route (Admin/Data Entry)

### Tickets
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Generate ticket (Admin/Police Officer)

### Reports
- `GET /api/reports/tickets/csv` - Export tickets as CSV (Admin only)
- `GET /api/reports/tickets/pdf` - Export tickets as PDF (Admin only)
- `GET /api/reports/analytics` - Get analytics data for charts (Admin only)

### Dashboard
- `GET /api/dashboard/stats` - System statistics

## Database Schema

The system uses SQLite with the following main tables:

- **users**: System users with role-based access
- **Vehicle**: Vehicle records with license plates and specifications
- **Route**: Routes with weight restrictions
- **Ticket**: Violation tickets linking vehicles, routes, and officers

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Authorization**: Middleware-enforced permissions
- **Input Validation**: Server-side validation for all inputs
- **CORS Configuration**: Secure cross-origin resource sharing

## Development

### Project Structure
```
/
├── server.js              # Express server and API routes
├── schema.sql            # SQLite database schema
├── vwds.db              # SQLite database file
├── package.json         # Node.js dependencies
├── public/              # Frontend assets
│   ├── index.html       # Main application HTML
│   ├── css/
│   │   └── style.css    # Application styles
│   └── js/
│       └── app.js       # Frontend JavaScript
└── README.md           # This file
```

### Adding New Features

1. **Backend**: Add routes in `server.js`
2. **Frontend**: Update `public/js/app.js` for new functionality
3. **Database**: Update `schema.sql` for schema changes
4. **Styling**: Modify `public/css/style.css` for UI changes

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure `vwds.db` exists in the project root
   - Run the schema initialization command

2. **Authentication Issues**
   - Check if JWT_SECRET is set (defaults to 'vwds-secret-key-2024')
   - Verify user credentials in the database

3. **Permission Denied**
   - Check user role assignments
   - Verify JWT token validity

### Database Reset
```bash
rm vwds.db
sqlite3 vwds.db < schema.sql
```

## Migration from Java Backend

This frontend replaces the console-based Java application with:
- Modern web interface
- Multi-user support with authentication
- Role-based access control
- RESTful API architecture
- Real-time dashboard and statistics

The original Java backend functionality has been preserved and enhanced with additional features for production use.

**Note**: The `Ticket_Issue_for_Trucks.iml` file is a legacy IntelliJ IDEA module file from the original Java implementation and is no longer needed for the current Node.js application.

## License

This project is part of the Vehicle Weight Detection System (VWDS) educational project.

---

**Note**: This system is designed for educational and demonstration purposes. For production deployment, consider additional security measures, monitoring, and backup strategies.