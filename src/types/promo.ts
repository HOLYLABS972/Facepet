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
  filterIds?: string[]; // Filters assigned to this business
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
  businessId?: string; // Deprecated: use businessIds instead
  businessIds?: string[]; // Optional business assignments (multiple stores)
  filterId: string;
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
  filterIds?: string[]; // Filters assigned to this business
  rating?: number;
}

export interface CreateCouponData {
  name: string;
  description: string;
  imageUrl: string;
  youtubeUrl?: string; // Optional YouTube video URL
  businessId?: string; // Deprecated: use businessIds instead
  businessIds?: string[]; // Optional business assignments (multiple stores)
  filterId: string;
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

export interface Filter {
  id: string;
  name: string;
  audienceIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateFilterData {
  name: string;
  audienceIds: string[];
}

export interface UpdateFilterData extends Partial<CreateFilterData> {
  isActive?: boolean;
}
