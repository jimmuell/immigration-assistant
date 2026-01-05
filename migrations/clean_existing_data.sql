-- Migration: Clean existing data for fresh start
-- This migration removes all existing data from the database to prepare for multi-tenant architecture

-- Delete all data in reverse order of dependencies
DELETE FROM screening_documents;
DELETE FROM attorney_client_messages;
DELETE FROM quote_requests;
DELETE FROM form_edges;
DELETE FROM form_nodes;
DELETE FROM screenings;
DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM flows;
DELETE FROM users;

-- Reset sequences if needed (PostgreSQL auto-generates these for serial types, but we use UUID)
-- No sequence resets needed for UUID-based tables

