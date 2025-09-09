import { z } from 'zod';

export const getPetRegisterSchemas = (
  t: (key: string) => string
) => ({
  petDetails: z.object({
    imageUrl: z.string().optional(),
    petName: z.string().nonempty(t('errors.petDetails.nameRequired')),
    type: z.string().min(1, t('errors.petDetails.typeRequired')),
    breed: z.string().min(1, t('errors.petDetails.breedRequired')),
    gender: z.string().min(1, t('errors.petDetails.genderRequired')),
    birthDate: z.date()
      .optional()
      .nullable()
      .refine((date) => {
        if (!date) return true; // Allow null/undefined
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        return date <= today;
      }, {
        message: 'Birth date cannot be in the future'
      }),
    weight: z.string().optional(),
    notes: z.string().optional()
  }),
  ownerDetails: z.object({
    ownerFullName: z
      .string()
      .nonempty(t('errors.ownerDetails.fullNameRequired')),
    ownerPhoneNumber: z
      .string()
      .nonempty(t('errors.ownerDetails.phoneRequired')),
    ownerEmailAddress: z.string().email(t('errors.ownerDetails.invalidEmail')),
    ownerHomeAddress: z
      .string()
      .nonempty(t('errors.ownerDetails.homeAddressRequired')),
    ownerCoordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional(),
    // Owner privacy settings
    isOwnerPhonePrivate: z.boolean().optional().default(false),
    isOwnerEmailPrivate: z.boolean().optional().default(false),
    isOwnerAddressPrivate: z.boolean().optional().default(false)
  }),
  vetDetails: z.object({
    vetId: z.string().optional(),
    vetName: z.string().optional(),
    vetPhoneNumber: z.string().optional(),
    vetEmailAddress: z.string().optional(),
    vetAddress: z.string().optional(),
    // Vet privacy settings
    isVetNamePrivate: z.boolean().optional().default(false),
    isVetPhonePrivate: z.boolean().optional().default(false),
    isVetEmailPrivate: z.boolean().optional().default(false),
    isVetAddressPrivate: z.boolean().optional().default(false)
  })
});

export type PetRegisterSchemas = ReturnType<typeof getPetRegisterSchemas>;
