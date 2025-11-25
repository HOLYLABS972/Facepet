export interface Audience {
  id: string;
  name: string;
  description: string;
  targetCriteria: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  tags: string[];
  audienceId?: string; // Legacy field for backward compatibility
  audienceIds?: string[]; // New field for multiple audiences
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Note: This Coupon type is for business promos/coupons
// There's also a Coupon type in coupon.ts for vouchers (with price/points)
// Both are called "Coupons" in the UI but serve different purposes
export interface Coupon {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  youtubeUrl?: string; // Optional YouTube video URL
  businessId: string;
  audienceId: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Legacy alias for backward compatibility
export type Promo = Coupon;

export interface CreateAudienceData {
  name: string;
  description: string;
  targetCriteria: string[];
}

export interface CreateBusinessData {
  name: string;
  description: string;
  imageUrl: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  tags: string[];
  audienceId?: string; // Legacy field for backward compatibility
  audienceIds?: string[]; // New field for multiple audiences
  rating?: number;
}

export interface CreateCouponData {
  name: string;
  description: string;
  imageUrl: string;
  youtubeUrl?: string; // Optional YouTube video URL
  businessId: string;
  audienceId: string;
  startDate?: Date;
  endDate?: Date;
}

// Legacy alias for backward compatibility
export type CreatePromoData = CreateCouponData;

export interface UpdateAudienceData extends Partial<CreateAudienceData> {
  isActive?: boolean;
}

export interface UpdateBusinessData extends Partial<CreateBusinessData> {
  isActive?: boolean;
}

export interface UpdateCouponData extends Partial<CreateCouponData> {
  isActive?: boolean;
}

// Legacy alias for backward compatibility
export type UpdatePromoData = UpdateCouponData;
