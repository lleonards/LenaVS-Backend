/**
 * IN-MEMORY DATA STORE
 * 
 * This is a temporary solution for development and testing.
 * In production, replace with a proper database (PostgreSQL, MongoDB, etc.)
 * 
 * To integrate a database:
 * 1. Install database client (pg, mongoose, prisma, etc.)
 * 2. Create database schema/models
 * 3. Replace array operations with database queries
 * 4. Update all route handlers to use database methods
 */

// Users store
export const users = [];

// Projects store
export const projects = [];

// Public projects store (shared library)
export const publicProjects = [];

// Payment history (for future use)
export const payments = [];

// Export jobs (for async video processing)
export const exportJobs = [];
