import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

// Role Enum
export const userRoleEnum = pgEnum('user_role', [
  'user',
  'admin',
  'super_admin'
]);

// Ad Type and Status Enums
export const adTypeEnum = pgEnum('ad_type', ['image', 'video']);
export const adStatusEnum = pgEnum('ad_status', [
  'active',
  'inactive',
  'scheduled'
]);

// Users Table
export const users = pgTable('users', {
  id: uuid('id').notNull().primaryKey().defaultRandom().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: text('email').notNull().unique(),
  phone: varchar('phone', { length: 15 }).notNull(),
  password: text('password').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  emailVerified: boolean('email_verified').default(false),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  lastActivityDate: timestamp('last_activity_date').defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Advertisements Table
export const advertisements = pgTable('advertisements', {
  id: uuid('id').notNull().primaryKey().defaultRandom().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  type: adTypeEnum('type').notNull(),
  content: text('content').notNull(), // URL for image or video
  duration: integer('duration').notNull().default(5), // in seconds
  status: adStatusEnum('status').notNull().default('inactive'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by').references(() => users.id, {
    onDelete: 'set null'
  })
});

// Genders Table
export const genders = pgTable('genders', {
  id: integer('id').notNull().primaryKey().unique(),
  en: varchar('en', { length: 50 }).notNull(),
  he: varchar('he', { length: 50 }).notNull()
});

// Breeds Table
export const breeds = pgTable('breeds', {
  id: integer('id').notNull().primaryKey().unique(),
  en: varchar('en', { length: 100 }).notNull(),
  he: varchar('he', { length: 100 }).notNull()
});

// Owners Table
export const owners = pgTable('owners', {
  id: uuid('id').notNull().primaryKey().defaultRandom().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  homeAddress: text('home_address').notNull(),
  // Privacy settings - name is always public
  isPhonePrivate: boolean('is_phone_private').notNull().default(false),
  isEmailPrivate: boolean('is_email_private').notNull().default(false),
  isAddressPrivate: boolean('is_address_private').notNull().default(false)
});

// Vets Table
export const vets = pgTable('vets', {
  id: uuid('id').notNull().primaryKey().defaultRandom().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  // Privacy settings - all vet info can be private
  isNamePrivate: boolean('is_name_private').notNull().default(false),
  isPhonePrivate: boolean('is_phone_private').notNull().default(false),
  isEmailPrivate: boolean('is_email_private').notNull().default(false),
  isAddressPrivate: boolean('is_address_private').notNull().default(false)
});

// Pets Table
export const pets = pgTable(
  'pets',
  {
    id: uuid('id').notNull().primaryKey().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url').notNull(),
    genderId: integer('gender_id')
      .notNull()
      .references(() => genders.id, { onDelete: 'cascade' }),
    breedId: integer('breed_id')
      .notNull()
      .references(() => breeds.id, { onDelete: 'cascade' }),
    birthDate: date('birth_date'),
    notes: text('notes'),
    userEmail: varchar('user_email', { length: 255 }).notNull(), // Use email instead of user ID
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'cascade' }),
    vetId: uuid('vet_id')
      .references(() => vets.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
    // All pet information is always public
  },
  (table) => {
    return {
      // Primary lookup index (already exists)
      petIdIndex: index('idx_pets_id').on(table.id),
      // Foreign key indexes for JOIN optimization
      petUserEmailIndex: index('idx_pets_user_email').on(table.userEmail),
      petOwnerIdIndex: index('idx_pets_owner_id').on(table.ownerId),
      petVetIdIndex: index('idx_pets_vet_id').on(table.vetId),
      petGenderIdIndex: index('idx_pets_gender_id').on(table.genderId),
      petBreedIdIndex: index('idx_pets_breed_id').on(table.breedId)
    };
  }
);

// Pet IDs Pool Table
export const petIdsPool = pgTable('pet_ids_pool', {
  id: uuid('id').notNull().primaryKey().defaultRandom().unique(),
  isUsed: boolean('is_used').notNull().default(false)
});

// Verification Code Types Enum
export const verificationTypeEnum = pgEnum('verification_type', [
  'email_verification',
  'password_reset',
  'email_change'
]);

export const VerificationCode = pgTable('verification_codes', {
  id: uuid('id').notNull().primaryKey().defaultRandom().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  type: verificationTypeEnum('type').notNull().default('email_verification'),
  expires: timestamp('expire_date').notNull(),
  used: boolean('used').notNull().default(false),
  hashedPassword: text('hashed_password'), // For password change requests
  newEmail: varchar('new_email', { length: 255 }), // For email change requests
  hashedNewPassword: text('hashed_new_password'), // For password reset requests
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Password Reset Tokens Table (still needed for password reset links)
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').notNull().primaryKey().defaultRandom().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Note: emailChangeRequests table has been removed
// Email change now uses OTP codes through the VerificationCode table

// Contact Form Submissions Table
export const contactSubmissions = pgTable('contact_submissions', {
  id: uuid('id').notNull().primaryKey().defaultRandom().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, read, replied
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Points Transaction Types Enum
export const transactionTypeEnum = pgEnum('transaction_type', [
  'registration',
  'phone_verification',
  'pet_creation',
  'pet_share',
  'app_share',
  'admin_adjustment',
  'prize_claim'
]);

// Points Transactions Table
export const pointsTransactions = pgTable('points_transactions', {
  id: uuid('id').notNull().primaryKey().defaultRandom().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum('type').notNull(),
  points: integer('points').notNull(), // Can be positive or negative
  description: text('description'), // Optional description of the transaction
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => {
  return {
    userIdIndex: index('idx_points_transactions_user_id').on(table.userId),
    typeIndex: index('idx_points_transactions_type').on(table.type),
    createdAtIndex: index('idx_points_transactions_created_at').on(table.createdAt)
  };
});

// User Points Summary Table (for quick access)
export const userPointsSummary = pgTable('user_points_summary', {
  id: uuid('id').notNull().primaryKey().defaultRandom().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  totalPoints: integer('total_points').notNull().default(0),
  registrationPoints: integer('registration_points').notNull().default(0),
  phonePoints: integer('phone_points').notNull().default(0),
  petPoints: integer('pet_points').notNull().default(0),
  sharePoints: integer('share_points').notNull().default(0),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow()
}, (table) => {
  return {
    userIdIndex: index('idx_user_points_summary_user_id').on(table.userId),
    totalPointsIndex: index('idx_user_points_summary_total_points').on(table.totalPoints)
  };
});
