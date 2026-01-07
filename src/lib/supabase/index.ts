// Supabase clients
export { supabase, getCurrentUser, getSession } from './client';
export { createServerClient, createServerClientWithAuth } from './server';

// Database operations
export * from './database/users';
export * from './database/businesses';
export * from './database/pets';
export * from './database/contact';
export * from './database/promos';

// Storage operations
export * from './storage';

// Re-export types
export type { User } from './database/users';
export type { Business } from './database/businesses';
export type { Pet, Breed, Gender, PetType } from './database/pets';
export type { ContactSubmission } from './database/contact';
export type { UserPromo } from './database/promos';
