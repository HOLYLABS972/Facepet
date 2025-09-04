import { z } from 'zod';

export const getPetRegisterSchemas = (
  t: (key: string) => string,
  breedIds: number[],
  genderIds: number[]
) => ({
  petDetails: z.object({
    imageUrl: z.string().min(1, t('errors.petDetails.imageRequired')),
    petName: z.string().nonempty(t('errors.petDetails.nameRequired')),
    breedId: z.number().refine((value) => breedIds.includes(value), {
      message: t('errors.petDetails.invalidBreed')
    }),
    genderId: z.number().refine((value) => genderIds.includes(value), {
      message: t('errors.petDetails.invalidGender')
    }),
    birthDate: z.date().optional().nullable(),
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
    // Owner privacy settings
    isOwnerPhonePrivate: z.boolean().optional().default(false),
    isOwnerEmailPrivate: z.boolean().optional().default(false),
    isOwnerAddressPrivate: z.boolean().optional().default(false)
  }),
  vetDetails: z.object({
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
