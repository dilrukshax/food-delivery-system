-- Script to create initial admin account
-- Password is 'admin123' encoded with BCrypt
-- You can run this directly in your PostgreSQL database

INSERT INTO users (
    uuid, 
    email, 
    first_name, 
    last_name, 
    password, 
    phone, 
    city, 
    role, 
    profile_image_url, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid()::text,
    'admin@fooddelivery.com',
    'System',
    'Administrator',
    '$2a$10$D4z8fmvQ5xmT4ZX8KnE.O.mGiJNtF2FJRHMnRJr6f3Q0P1Y.aS7S6',  -- password: admin123
    '+1234567890',
    'System',
    'SYSTEM_ADMIN',
    null,
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verify the admin was created
SELECT id, email, first_name, last_name, role, is_active, created_at 
FROM users 
WHERE email = 'admin@fooddelivery.com';
