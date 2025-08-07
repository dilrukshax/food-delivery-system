# Admin Functionality Setup Guide

## 🎯 Overview
The admin functionality has been successfully implemented with the following features:
- Create and manage users with different roles
- Create restaurant owners
- View user statistics and dashboard
- Role-based access control
- Full backend API and frontend interface

## 🔧 Technical Resolution
✅ **Fixed Lombok Compatibility Issues**: Removed Lombok dependency and implemented manual getters/setters to resolve Java 24 compatibility problems.
✅ **Backend API**: Complete admin endpoints in `AdminController`
✅ **Frontend Interface**: Angular admin dashboard and forms
✅ **Database Integration**: Enhanced UserRepository with admin query methods

## 📝 Backend API Endpoints

### Admin User Management
- `POST /api/admin/users` - Create new user with any role
- `GET /api/admin/users` - List all users with pagination and filtering
- `GET /api/admin/stats` - Get admin statistics dashboard

### Request Examples:

#### Create User:
```json
POST /api/admin/users
{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "password": "password123",
    "phone": "1234567890",
    "city": "New York",
    "role": "CUSTOMER",
    "isActive": true
}
```

#### Get Users with Filtering:
```
GET /api/admin/users?page=0&size=10&search=john&role=CUSTOMER&isActive=true
```

## 🔐 Initial Admin Account Setup

### Option 1: SQL Script (Recommended)
Run the provided SQL script `create-admin.sql`:
```sql
-- Creates admin@fooddelivery.com with password: admin123
-- Located at: /create-admin.sql
```

### Option 2: Manual Database Insert
```sql
INSERT INTO users (uuid, email, first_name, last_name, password, phone, city, role, is_active, created_at, updated_at) 
VALUES (
    gen_random_uuid()::text,
    'admin@fooddelivery.com',
    'System',
    'Administrator', 
    '$2a$10$D4z8fmvQ5xmT4ZX8KnE.O.mGiJNtF2FJRHMnRJr6f3Q0P1Y.aS7S6',
    '+1234567890',
    'System',
    'SYSTEM_ADMIN',
    true,
    NOW(),
    NOW()
);
```

## 🎨 Frontend Access

### Admin Dashboard Routes:
- `/admin` - Main admin dashboard with statistics
- `/admin/users` - User management page
- `/admin/create-user` - Create new user form
- `/admin/create-restaurant-owner` - Create restaurant owner form

### Login Credentials:
- **Email**: admin@fooddelivery.com
- **Password**: admin123

## 👥 User Roles Available:
- `SYSTEM_ADMIN` - Full system administration
- `RESTAURANT_ADMIN` - Restaurant owner/manager
- `CUSTOMER` - Regular app user
- `DELIVERY_DRIVER` - Delivery personnel

## 🚀 Getting Started

1. **Start the Backend**:
   ```bash
   cd backend/user-service
   ./mvnw spring-boot:run
   ```

2. **Create Admin Account**:
   ```bash
   # Run the SQL script in your PostgreSQL database
   psql -d your_database -f create-admin.sql
   ```

3. **Start the Frontend**:
   ```bash
   cd frontend
   npm start
   ```

4. **Access Admin Panel**:
   - Navigate to `http://localhost:4200/auth/login`
   - Login with admin credentials
   - Access admin features at `http://localhost:4200/admin`

## 📊 Admin Dashboard Features

### Statistics Overview:
- Total users count
- Users by role (Restaurant Owners, Customers, Delivery Drivers)
- Active vs Inactive users
- Recent user activity

### User Management:
- Create new users with any role
- Search and filter users
- View detailed user information
- Manage user status (active/inactive)
- Role assignment and modification

### Restaurant Owner Creation:
- Specialized form for creating restaurant owners
- Automatic role assignment
- Restaurant-specific information capture

## 🔒 Security Features

- **Role-based Access Control**: Only SYSTEM_ADMIN can access admin features
- **JWT Authentication**: Secure token-based authentication
- **Password Encryption**: BCrypt password hashing
- **Route Protection**: Frontend guards prevent unauthorized access

## 🛠 Development Notes

### Code Structure:
- **Controller**: `AdminController.java` - REST API endpoints
- **Service**: `UserService.java` - Business logic for admin operations
- **Repository**: `UserRepository.java` - Database queries with admin methods
- **DTOs**: `CreateUserRequest.java`, `AdminStatsResponse.java`, etc.
- **Frontend**: Angular admin module with dashboard and forms

### Key Improvements Made:
1. **Removed Lombok**: Replaced with manual getters/setters for Java 24 compatibility
2. **Enhanced Queries**: Added search and filtering capabilities
3. **Statistics API**: Real-time admin dashboard metrics
4. **Complete Frontend**: User-friendly admin interface

## 🧪 Testing

### Backend Testing:
```bash
cd backend/user-service
./mvnw test
```

### Frontend Testing:
```bash
cd frontend
npm test
```

### Manual Testing:
1. Create admin account using SQL script
2. Login via frontend
3. Test user creation with different roles
4. Verify statistics display correctly
5. Test search and filtering functionality

## 📈 Next Steps

The admin functionality is now fully operational. You can:
1. Create additional admin accounts if needed
2. Customize the admin dashboard layout
3. Add more user management features
4. Implement audit logging for admin actions
5. Add bulk operations for user management

---

**Admin Setup Complete!** 🎉

Your food delivery system now has full admin functionality for managing users and restaurant owners. The system is ready for production use with proper security and role-based access control.
