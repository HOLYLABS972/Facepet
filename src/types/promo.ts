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
  audienceId?: string;
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Promo {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  businessId: string;
  audienceId: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

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
  audienceId?: string;
  rating?: number;
}

export interface CreatePromoData {
  name: string;
  description: string;
  imageUrl: string;
  businessId: string;
  audienceId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateAudienceData extends Partial<CreateAudienceData> {
  isActive?: boolean;
}

export interface UpdateBusinessData extends Partial<CreateBusinessData> {
  isActive?: boolean;
}

export interface UpdatePromoData extends Partial<CreatePromoData> {
  isActive?: boolean;
}
