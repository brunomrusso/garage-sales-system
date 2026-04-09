-- Migration: Add role and ativo columns to clientes table
-- This script adds the role and ativo columns to support the new authentication features

-- Add role column if it doesn't exist
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'cliente';

-- Add ativo column if it doesn't exist
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- Create index for role column for better query performance
CREATE INDEX IF NOT EXISTS idx_clientes_role ON clientes(role);

-- Create index for ativo column for better query performance
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
