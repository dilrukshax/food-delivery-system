# Direct Cloud Database Admin Setup Guide

## Overview
This guide helps you create an admin user by directly connecting to your PostgreSQL database in the cloud.

## Prerequisites
- kubectl configured and connected to your EKS cluster
- PostgreSQL client installed locally

## Method 1: Port Forwarding to Cloud Database

### Step 1: Forward PostgreSQL Port
```bash
# Forward the PostgreSQL port to your local machine
kubectl port-forward service/postgres-service 5432:5432 -n food-delivery
```

### Step 2: Connect to Database Locally
```bash
# Get database credentials from Kubernetes secrets
POSTGRES_USER=$(kubectl get secret postgres-secret -n food-delivery -o jsonpath='{.data.postgres-user}' | base64 --decode)
POSTGRES_PASSWORD=$(kubectl get secret postgres-secret -n food-delivery -o jsonpath='{.data.postgres-password}' | base64 --decode)

# Connect to the database
psql -h localhost -p 5432 -U $POSTGRES_USER -d user_service_db
```

### Step 3: Create Admin User
```sql
-- Create admin user (run this in psql)
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
) ON CONFLICT (email) DO NOTHING;

-- Verify admin user was created
SELECT email, role, is_active FROM users WHERE email = 'admin@fooddelivery.com';
```

## Method 2: Using kubectl exec

### Step 1: Connect to PostgreSQL Pod
```bash
# Find PostgreSQL pod
kubectl get pods -n food-delivery | grep postgres

# Connect to PostgreSQL pod
kubectl exec -it postgres-deployment-xxxxx -n food-delivery -- psql -U postgres -d user_service_db
```

### Step 2: Create Admin User
```sql
-- Same SQL as above
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
) ON CONFLICT (email) DO NOTHING;
```

## Method 3: One-liner kubectl Command

```bash
# Create admin user with a single kubectl command
kubectl exec -i postgres-deployment-xxxxx -n food-delivery -- psql -U postgres -d user_service_db <<EOF
INSERT INTO users (uuid, email, first_name, last_name, password, phone, city, role, is_active, created_at, updated_at) 
VALUES (
    gen_random_uuid()::text,
    'admin@fooddelivery.com',
    'System',
    'Administrator', 
    '\$2a\$10\$D4z8fmvQ5xmT4ZX8KnE.O.mGiJNtF2FJRHMnRJr6f3Q0P1Y.aS7S6',
    '+1234567890',
    'System',
    'SYSTEM_ADMIN',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
EOF
```

## Admin Credentials
- **Email**: admin@fooddelivery.com
- **Password**: admin123

## Access Admin Panel
1. Get your application URL:
   ```bash
   kubectl get ingress -n food-delivery
   ```
2. Navigate to: `http://YOUR_LOAD_BALANCER_URL/auth/login`
3. Login with admin credentials
4. Access admin features at: `http://YOUR_LOAD_BALANCER_URL/admin`

## Troubleshooting

### Check if tables exist
```sql
\dt
SELECT * FROM users LIMIT 5;
```

### Check admin user exists
```sql
SELECT email, role, is_active, created_at FROM users WHERE role = 'SYSTEM_ADMIN';
```

### Reset admin password if needed
```sql
UPDATE users 
SET password = '$2a$10$D4z8fmvQ5xmT4ZX8KnE.O.mGiJNtF2FJRHMnRJr6f3Q0P1Y.aS7S6' 
WHERE email = 'admin@fooddelivery.com';
```
