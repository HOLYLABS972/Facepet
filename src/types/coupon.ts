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
}

export interface UpdateCouponData extends Partial<CreateCouponData> {
  isActive?: boolean;
}
