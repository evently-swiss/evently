-- Add platform-level role for super admin access.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN' BEFORE 'ADMIN';
