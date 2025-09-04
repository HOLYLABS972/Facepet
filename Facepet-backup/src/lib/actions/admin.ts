'use server';

import { db } from '@/utils/database/drizzle';
import { advertisements, pets, users } from '@/utils/database/schema';
import { hash } from 'bcryptjs';
import {
  and,
  count,
  eq,
  gte,
  isNotNull,
  isNull,
  lte,
  or,
  sql
} from 'drizzle-orm';

// DASHBOARD STATISTICS FUNCTIONS

/**
 * Get overall statistics for the admin dashboard
 */
export async function getDashboardStats() {
  // Get total users count
  const usersCount = await db
    .select({ count: count() })
    .from(users)
    .then((result) => result[0]?.count || 0);

  // Get user roles breakdown
  const userRoles = await db
    .select({
      role: users.role,
      count: count()
    })
    .from(users)
    .groupBy(users.role);

  // Get new users in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newUsers = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo))
    .then((result) => result[0]?.count || 0);

  // Get total ads
  const adsCount = await db
    .select({ count: count() })
    .from(advertisements)
    .then((result) => result[0]?.count || 0);

  // Get ads by status
  const adsByStatus = await db
    .select({
      status: advertisements.status,
      count: count()
    })
    .from(advertisements)
    .groupBy(advertisements.status);

  // Get total pets
  const petsCount = await db
    .select({ count: count() })
    .from(pets)
    .then((result) => result[0]?.count || 0);

  // Get new pets - pets don't have createdAt field
  // so we'll just count the total
  const newPets = 0;

  // Get ads by type
  const adsByType = await db
    .select({
      type: advertisements.type,
      count: count()
    })
    .from(advertisements)
    .groupBy(advertisements.type);

  return {
    users: {
      total: usersCount,
      new: newUsers,
      byRole: userRoles.reduce(
        (acc, { role, count }) => {
          acc[role] = count;
          return acc;
        },
        {} as Record<string, number>
      )
    },
    ads: {
      total: adsCount,
      byStatus: adsByStatus.reduce(
        (acc, { status, count }) => {
          acc[status] = count;
          return acc;
        },
        {} as Record<string, number>
      ),
      byType: adsByType.reduce(
        (acc, { type, count }) => {
          acc[type] = count;
          return acc;
        },
        {} as Record<string, number>
      )
    },
    pets: {
      total: petsCount,
      new: newPets
    }
  };
}

/**
 * Get recent activity for the admin dashboard
 */
export async function getRecentActivity(limit = 5) {
  // Get recent new users
  const recentUsers = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt
    })
    .from(users)
    .orderBy(sql`${users.createdAt} DESC`)
    .limit(limit);

  // Get recent pets (no createdAt field, so just get some pets)
  const recentPets = await db
    .select({
      id: pets.id,
      name: pets.name,
      imageUrl: pets.imageUrl
    })
    .from(pets)
    .limit(limit);

  // Get recent ads
  const recentAds = await db
    .select({
      id: advertisements.id,
      title: advertisements.title,
      type: advertisements.type,
      status: advertisements.status,
      createdAt: advertisements.createdAt
    })
    .from(advertisements)
    .orderBy(sql`${advertisements.createdAt} DESC`)
    .limit(limit);

  return {
    recentUsers,
    recentPets,
    recentAds
  };
}

// USER MANAGEMENT FUNCTIONS

/**
 * Get all users with pagination
 */
export async function getAllUsers(
  page = 1,
  limit = 10,
  searchQuery = '',
  sortField = 'fullName',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  const offset = (page - 1) * limit;

  // Build the where condition for search
  let whereCondition = undefined;
  if (searchQuery) {
    whereCondition = sql`LOWER(${users.email}) LIKE LOWER(${'%' + searchQuery + '%'})`;
  }

  // Build the orderBy statement based on sort field and direction
  let orderByClause;
  switch (sortField) {
    case 'fullName':
      orderByClause =
        sortOrder === 'asc' ? users.fullName : sql`${users.fullName} DESC`;
      break;
    case 'email':
      orderByClause =
        sortOrder === 'asc' ? users.email : sql`${users.email} DESC`;
      break;
    case 'role':
      orderByClause =
        sortOrder === 'asc' ? users.role : sql`${users.role} DESC`;
      break;
    case 'createdAt':
      orderByClause =
        sortOrder === 'asc' ? users.createdAt : sql`${users.createdAt} DESC`;
      break;
    default:
      orderByClause = users.createdAt;
  }

  // Query with the search condition and sorting
  const allUsers = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt
    })
    .from(users)
    .where(whereCondition)
    .limit(limit)
    .offset(offset)
    .orderBy(orderByClause);

  // Also apply the search condition to the count query
  const totalCount = await db
    .select({ count: count() })
    .from(users)
    .where(whereCondition)
    .then((res) => res[0]?.count || 0);

  return {
    users: allUsers,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const result = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
      emailVerified: users.emailVerified
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0] || null;
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  role: 'user' | 'admin' | 'super_admin'
) {
  await db.update(users).set({ role }).where(eq(users.id, userId));

  return { success: true };
}

/**
 * Create a new user (for admin use)
 */
export async function createUserByAdmin(
  fullName: string,
  email: string,
  phone: string,
  password: string,
  role: 'user' | 'admin' | 'super_admin' = 'user'
) {
  const emailLower = email.toLowerCase();
  const hashedPassword = await hash(password, 10);

  await db.insert(users).values({
    fullName,
    email: emailLower,
    phone,
    password: hashedPassword,
    role
  });

  return { success: true };
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  // Get the user to check if they're a super_admin
  const userToDelete = await getUserById(userId);

  // Don't allow deletion of super_admin users
  if (userToDelete?.role === 'super_admin') {
    return {
      success: false,
      error: 'Super admin users cannot be deleted'
    };
  }

  await db.delete(users).where(eq(users.id, userId));

  return { success: true };
}

// AD MANAGEMENT FUNCTIONS

// Types for the ad system
export type AdType = 'image' | 'video';
export type AdStatus = 'active' | 'inactive' | 'scheduled';

export interface Ad {
  id: string;
  title: string;
  type: AdType;
  content: string; // URL for image or video
  duration: number; // in seconds
  status: AdStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
}

/**
 * Get all ads with pagination
 */
export async function getAllAds(
  page = 1,
  limit = 10,
  searchQuery = '',
  sortField = 'title',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  const offset = (page - 1) * limit;

  // Build the where condition for search
  let whereCondition = undefined;
  if (searchQuery) {
    whereCondition = sql`LOWER(${advertisements.title}) LIKE LOWER(${'%' + searchQuery + '%'})`;
  }

  // Build the orderBy statement based on sort field and direction
  let orderByClause;
  switch (sortField) {
    case 'title':
      orderByClause =
        sortOrder === 'asc'
          ? advertisements.title
          : sql`${advertisements.title} DESC`;
      break;
    case 'type':
      orderByClause =
        sortOrder === 'asc'
          ? advertisements.type
          : sql`${advertisements.type} DESC`;
      break;
    case 'duration':
      orderByClause =
        sortOrder === 'asc'
          ? advertisements.duration
          : sql`${advertisements.duration} DESC`;
      break;
    case 'status':
      orderByClause =
        sortOrder === 'asc'
          ? advertisements.status
          : sql`${advertisements.status} DESC`;
      break;
    default:
      orderByClause = advertisements.createdAt;
  }

  const allAds = await db
    .select({
      id: advertisements.id,
      title: advertisements.title,
      type: advertisements.type,
      content: advertisements.content,
      duration: advertisements.duration,
      status: advertisements.status,
      startDate: advertisements.startDate,
      endDate: advertisements.endDate,
      createdAt: advertisements.createdAt,
      updatedAt: advertisements.updatedAt,
      createdBy: advertisements.createdBy
    })
    .from(advertisements)
    .where(whereCondition)
    .limit(limit)
    .offset(offset)
    .orderBy(orderByClause);

  // Get the total count of ads for pagination
  const totalCount = await db
    .select({ count: count() })
    .from(advertisements)
    .where(whereCondition)
    .then((res) => res[0]?.count || 0);

  return {
    ads: allAds,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
}

/**
 * Get advertisement by ID
 */
export async function getAdById(adId: string) {
  const result = await db
    .select()
    .from(advertisements)
    .where(eq(advertisements.id, adId))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new advertisement
 */
export async function createAd({
  title,
  type,
  content,
  duration,
  status,
  startDate,
  endDate,
  createdBy
}: {
  title: string;
  type: AdType;
  content: string;
  duration: number;
  status: AdStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  createdBy?: string | null;
}) {
  const currentDate = new Date();

  const result = await db
    .insert(advertisements)
    .values({
      title,
      type,
      content,
      duration,
      status,
      startDate,
      endDate,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy
    })
    .returning();

  return { success: true, ad: result[0] };
}

/**
 * Update an advertisement
 */
export async function updateAd(
  adId: string,
  {
    title,
    type,
    content,
    duration,
    status,
    startDate,
    endDate
  }: {
    title?: string;
    type?: AdType;
    content?: string;
    duration?: number;
    status?: AdStatus;
    startDate?: Date | null;
    endDate?: Date | null;
  }
) {
  const updateValues: any = {
    updatedAt: new Date()
  };

  if (title !== undefined) updateValues.title = title;
  if (type !== undefined) updateValues.type = type;
  if (content !== undefined) updateValues.content = content;
  if (duration !== undefined) updateValues.duration = duration;
  if (status !== undefined) updateValues.status = status;
  if (startDate !== undefined) updateValues.startDate = startDate;
  if (endDate !== undefined) updateValues.endDate = endDate;

  await db
    .update(advertisements)
    .set(updateValues)
    .where(eq(advertisements.id, adId));

  return { success: true };
}

/**
 * Delete an advertisement
 */
export async function deleteAd(adId: string) {
  await db.delete(advertisements).where(eq(advertisements.id, adId));

  return { success: true };
}

/**
 * Get active advertisements
 * Returns ads that are:
 * 1. Status is 'active' OR
 * 2. Status is 'scheduled' AND current date is between start and end dates
 */
export async function getActiveAds() {
  const now = new Date();
  const nowStr = now.toISOString();

  const activeAds = await db
    .select()
    .from(advertisements)
    .where(
      or(
        eq(advertisements.status, 'active'),
        and(
          eq(advertisements.status, 'scheduled'),
          or(
            isNull(advertisements.startDate),
            sql`${advertisements.startDate} <= ${nowStr}`
          ),
          or(
            isNull(advertisements.endDate),
            sql`${advertisements.endDate} >= ${nowStr}`
          )
        )
      )
    );

  return activeAds;
}

/**
 * Get a random active advertisement
 */
export async function getRandomActiveAd() {
  const now = new Date();

  // Get active ads (status is 'active' OR scheduled and within date range)
  const ads = await db
    .select({
      id: advertisements.id,
      title: advertisements.title,
      type: advertisements.type,
      content: advertisements.content,
      duration: advertisements.duration,
      status: advertisements.status
    })
    .from(advertisements)
    .where(
      or(
        eq(advertisements.status, 'active'),
        and(
          eq(advertisements.status, 'scheduled'),
          isNotNull(advertisements.startDate),
          isNotNull(advertisements.endDate),
          lte(advertisements.startDate, now),
          gte(advertisements.endDate, now)
        )
      )
    );

  // If no ads available, return null
  if (ads.length === 0) {
    return null;
  }

  // Pick a random ad from the available ones
  const randomIndex = Math.floor(Math.random() * ads.length);
  return ads[randomIndex];
}
