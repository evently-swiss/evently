-- Add ARRIVED status to support door-staff lounge check-in flow.
ALTER TYPE "LoungeStatus" ADD VALUE IF NOT EXISTS 'ARRIVED';
