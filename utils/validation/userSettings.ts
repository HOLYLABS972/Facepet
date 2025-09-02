import { z } from 'zod';

export const getUpdateProfileSchema = (t: any) =>
  z
    .object({
      fullName: z.string().nonempty(t('errors.FullName')),
      phoneNumber: z.string().nonempty(t('errors.PhoneNumber')),
      emailAddress: z.string().email(t('errors.EmailAddress')),
      currentPassword: z.preprocess(
        (val) =>
          typeof val === 'string' && val.trim() === '' ? undefined : val,
        z.string().optional()
      ),
      password: z.preprocess(
        (val) =>
          typeof val === 'string' && val.trim() === '' ? undefined : val,
        z.string().min(8, t('errors.Password')).optional()
      ),
      confirmPassword: z.preprocess(
        (val) =>
          typeof val === 'string' && val.trim() === '' ? undefined : val,
        z.string().optional()
      )
    })
    .refine(
      (data) => {
        // Only check for a match if a new password is provided.
        if (data.password !== undefined) {
          return data.password === data.confirmPassword;
        }
        return true;
      },
      {
        message: t('errors.PasswordMatch'),
        path: ['confirmPassword']
      }
    )
    .refine(
      (data) => {
        // If new password is provided, current password is required
        if (data.password !== undefined) {
          return (
            data.currentPassword !== undefined &&
            data.currentPassword.trim() !== ''
          );
        }
        return true;
      },
      {
        message: t('errors.CurrentPasswordRequired'),
        path: ['currentPassword']
      }
    );

export type UpdateProfileSchema = z.infer<
  ReturnType<typeof getUpdateProfileSchema>
>;
