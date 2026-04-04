-- Change default role for new users from PROMOTER to ADMIN.
-- Operators self-register; promoters are invited by operators.
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
