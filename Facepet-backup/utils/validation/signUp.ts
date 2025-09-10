import { z } from 'zod';

export const getSignUpSchema = (t: (key: string) => string) =>
  z
    .object({
      fullName: z.string().nonempty(t('errors.FullName')),
      phoneNumber: z.string().nonempty(t('errors.PhoneNumber')),
      emailAddress: z.string().email(t('errors.EmailAddress')),
      password: z.string().min(8, t('errors.Password')),
      confirmPassword: z.string().nonempty(t('errors.ConfirmPassword')),
      termsAccepted: z.boolean().refine((value) => value, {
        message: t('errors.TermsAccept')
      })
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('errors.PasswordMatch'),
      path: ['confirmPassword']
    });

export type SignUpSchema = z.infer<ReturnType<typeof getSignUpSchema>>;
