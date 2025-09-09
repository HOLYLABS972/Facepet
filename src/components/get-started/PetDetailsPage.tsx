import GetStartedHeader from '@/components/get-started/ui/GetStartedHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import toast from 'react-hot-toast';
import GetStartedComboSelect from './ui/GetStartedComboSelect';
import GetStartedDatePicker from './ui/GetStartedDatePicker';
import GetStartedInput from './ui/GetStartedInput';
import GetStartedSelect from './ui/GetStartedSelect';
import ImageUpload from './ui/ImageUpload';
import { getBreedsForDropdown, getGendersForDropdown, getPetTypesForDropdown } from '@/src/lib/firebase/dropdown-data';

interface PetDetailsPageProps {
  // No longer need to pass genders and breeds as we'll fetch them from database
}

const PetDetailsPage: React.FC<PetDetailsPageProps> = () => {
  const {
    control,
    watch,
    setValue,
    formState: { errors }
  } = useFormContext();
  const t = useTranslations('pages.PetDetailsPage');
  const locale = useLocale() as 'en' | 'he';
  const [breeds, setBreeds] = useState<{ value: string; label: string }[]>([]);
  const [genders, setGenders] = useState<{ value: string; label: string }[]>([]);
  const [petTypes, setPetTypes] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Watch the pet type to filter breeds
  const selectedPetType = watch('type');

  useEffect(() => {
    Object.values(errors).forEach((error) => {
      if (error?.message) {
        toast.error(error.message as string, { id: error.message as string });
      }
    });
  }, [errors]);

  // Fetch initial dropdown data from hardcoded data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [gendersData, typesData] = await Promise.all([
          getGendersForDropdown(locale),
          getPetTypesForDropdown(locale)
        ]);
        
        setGenders(gendersData);
        setPetTypes(typesData);
      } catch (error) {
        console.error('Error fetching initial dropdown data:', error);
        toast.error('Failed to load form options');
        setGenders([]);
        setPetTypes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [locale]);

  // Fetch breeds when pet type changes
  useEffect(() => {
    const fetchBreedsForType = async () => {
      if (selectedPetType) {
        try {
          setIsLoading(true);
          const breedsData = await getBreedsForDropdown(selectedPetType, locale);
          setBreeds(breedsData);
          
          // Reset breed selection when type changes
          setValue('breed', '');
        } catch (error) {
          console.error('Error fetching breeds for type:', error);
          toast.error('Failed to load breeds');
          setBreeds([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Clear breeds when no type is selected
        setBreeds([]);
        setValue('breed', '');
      }
    };

    fetchBreedsForType();
  }, [selectedPetType, setValue, locale]);

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

        {/* Pet Type - Always public */}
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <GetStartedSelect
              label={t('form.Type')}
              id="type"
              selectOptions={petTypes}
              hasError={!!errors.type}
              disabled={isLoading}
              value={field.value || ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        {/* Breed - Always public */}
        <Controller
          name="breed"
          control={control}
          render={({ field }) => (
            <GetStartedSelect
              label={t('form.Breed')}
              id="breed"
              selectOptions={breeds}
              hasError={!!errors.breed}
              disabled={isLoading || !selectedPetType}
              value={field.value || ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={!selectedPetType ? t('form.selectTypeFirst') : undefined}
            />
          )}
        />

        {/* Gender - Always public */}
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <GetStartedSelect
              label={t('form.Gender')}
              id="gender"
              selectOptions={genders}
              hasError={!!errors.gender}
              disabled={isLoading}
              value={field.value || ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
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
              maxDate={new Date()} // Restrict to today and earlier
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
