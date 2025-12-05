export interface Coupon {
  id: string;
  name: string;
  description: string;
  price: number;
  points: number;
  imageUrl: string;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  businessId?: string; // Deprecated: use businessIds instead
  businessIds?: string[]; // Optional business assignments (multiple stores)
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateCouponData {
  name: string;
  description: string;
  price: number;
  points: number;
  imageUrl: string;
  validFrom: Date;
  validTo: Date;
  businessId?: string; // Deprecated: use businessIds instead
  businessIds?: string[]; // Optional business assignments (multiple stores)
}

export interface UpdateCouponData extends Partial<CreateCouponData> {
  isActive?: boolean;
}
