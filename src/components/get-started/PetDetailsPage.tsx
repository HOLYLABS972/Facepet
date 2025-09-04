import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import toast from 'react-hot-toast';
import GetStartedComboSelect from './ui/GetStartedComboSelect';
import GetStartedDatePicker from './ui/GetStartedDatePicker';
import GetStartedInput from './ui/GetStartedInput';
import GetStartedSelect from './ui/GetStartedSelect';
import ImageUpload from './ui/ImageUpload';

interface PetDetailsPageProps {
  genders: { id: number; label: string }[];
  breeds: { id: number; label: string }[];
}

const PetDetailsPage: React.FC<PetDetailsPageProps> = ({ genders, breeds }) => {
  const {
    control,
    formState: { errors }
  } = useFormContext();
  const t = useTranslations('pages.PetDetailsPage');

  useEffect(() => {
    Object.values(errors).forEach((error) => {
      if (error?.message) {
        toast.error(error.message as string, { id: error.message as string });
      }
    });
  }, [errors]);

  return (
    <Card className="border-none bg-transparent shadow-none">
      <GetStartedHeader title={t('title')} />
      <CardContent className="space-y-10 px-0 pt-8">
        <Controller
          name="imageUrl"
          control={control}
          render={({ field }) => (
            <ImageUpload
              label={t('form.UploadImageTitle')}
              folder="pets"
              value={field.value} // Controlled value
              onFileChange={field.onChange} // Controlled onChange
              required={true}
              error={errors.imageUrl?.message}
            />
          )}
        />

        {/* Pet Name - Always public */}
        <Controller
          name="petName"
          control={control}
          render={({ field }) => (
            <GetStartedInput
              label={t('form.PetName')}
              id="petName"
              hasError={!!errors.petName}
              {...field}
            />
          )}
        />

        {/* Breed - Always public */}
        <Controller
          name="breedId"
          control={control}
          render={({ field }) => (
            <GetStartedComboSelect
              label={t('form.Breed')}
              id="breed"
              selectOptions={breeds}
              hasError={!!errors.breed}
              {...field}
            />
          )}
        />

        {/* Gender - Always public */}
        <Controller
          name="genderId"
          control={control}
          render={({ field }) => (
            <GetStartedSelect
              label={t('form.Gender')}
              id="gender"
              {...field}
              selectOptions={genders}
              hasError={!!errors.gender}
            />
          )}
        />

        {/* Birth Date - Always public */}
        <Controller
          name="birthDate"
          control={control}
          render={({ field }) => (
            <GetStartedDatePicker
              label={t('form.BirthDate')}
              id="date"
              {...field}
              onChange={(date) => {
                field.onChange(date);
              }}
            />
          )}
        />

        {/* Weight - Always public */}
        <Controller
          name="weight"
          control={control}
          render={({ field }) => (
            <GetStartedInput
              label={t('form.weight')}
              id="weight"
              type="number"
              {...field}
            />
          )}
        />

        {/* Notes - Always public */}
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <GetStartedInput label={t('form.Notes')} id="notes" {...field} />
          )}
        />
      </CardContent>
    </Card>
  );
};

export default PetDetailsPage;
