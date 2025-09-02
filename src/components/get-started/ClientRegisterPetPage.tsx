'use client';

import OwnerDetailsPage from '@/components/get-started/OwnerDetailsPage';
import PetDetailsPage from '@/components/get-started/PetDetailsPage';
import VetDetailsPage from '@/components/get-started/VetDetailsPage';
import GetStartedFloatingActionButton from '@/components/get-started/ui/GetStartedFloatingActionButton';
import GetStartedProgressDots from '@/components/get-started/ui/GetStartedProgressDots';
import { useRouter } from '@/i18n/routing';
import { usePetId } from '@/src/hooks/use-pet-id';
import { createNewPet } from '@/src/lib/actions/pets';
import { getPetRegisterSchemas } from '@/utils/validation/petRegister';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import BackButton from './ui/BackButton';

export default function ClientRegisterPetPage({
  genders,
  breeds,
  userDetails
}: {
  genders: { id: number; labels: { en: string; he: string } }[];
  breeds: { id: number; labels: { en: string; he: string } }[];
  userDetails: { fullName: string; phone: string; email: string };
}) {
  const router = useRouter();
  const locale = useLocale() as 'en' | 'he';
  const t = useTranslations('');
  const [currentStep, setCurrentStep] = useState(0);
  const { petId, clearPetId } = usePetId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get valid breed & gender IDs.
  const breedIds = useMemo(() => breeds.map((b) => b.id), [breeds]);
  const genderIds = useMemo(() => genders.map((g) => g.id), [genders]);

  // Transform genders & breeds to localized options.
  const localizedGenders = useMemo(
    () =>
      genders.map(({ id, labels }) => ({
        id,
        label: labels[locale] || labels.en
      })),
    [genders, locale]
  );

  const localizedBreeds = useMemo(
    () =>
      breeds.map(({ id, labels }) => ({
        id,
        label: labels[locale] || labels.en
      })),
    [breeds, locale]
  );

  // Get the internationalized schemas.
  const schemas = useMemo(
    () => getPetRegisterSchemas(t, breedIds, genderIds),
    [t, breedIds, genderIds]
  );

  // Order of steps: petDetails, ownerDetails, vetDetails.
  const schemaSteps = useMemo(
    () => [schemas.petDetails, schemas.ownerDetails, schemas.vetDetails],
    [schemas]
  );

  // Define form default values.
  const initialFormData = useMemo(
    () => ({
      imageUrl: '',
      petName: '',
      breedId: 0,
      genderId: 0,
      birthDate: null,
      notes: '',
      ownerFullName: userDetails.fullName,
      ownerPhoneNumber: userDetails.phone,
      ownerEmailAddress: userDetails.email,
      ownerHomeAddress: '',
      vetName: '',
      vetPhoneNumber: '',
      vetEmailAddress: '',
      vetAddress: ''
    }),
    [userDetails]
  );

  const [formData, setFormData] = useState(initialFormData);

  const methods = useForm({
    resolver: zodResolver(schemaSteps[currentStep]),
    defaultValues: formData,
    mode: 'onChange'
  });

  const handleSubmit = async (allFormData: typeof formData): Promise<void> => {
    if (!petId) {
      setError('No pet ID available');
      toast.error('No pet ID available');
      router.push('/pet/get-started');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createNewPet(petId, allFormData as NewPetData);

      if (result.success) {
        clearPetId();
        router.push(`/pet/${petId}/done`);
      } else {
        setError(result.error || 'An error occurred while creating your pet');
        toast.error(result.error || 'Failed to create pet profile');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Save current step's data and navigate forward.
  const handleNext = (stepData: Partial<typeof formData>) => {
    const updatedFormData = { ...formData, ...stepData };
    setFormData(updatedFormData);

    if (currentStep < schemaSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit(updatedFormData);
    }
  };

  // Save current step's data and navigate backward.
  const handleBack = () => {
    const currentData = methods.getValues();
    setFormData((prev) => ({ ...prev, ...currentData }));

    if (currentStep === 0) {
      router.push(`/pet/${petId}/get-started`);
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Reset the form with the updated formData when the step changes.
  useEffect(() => {
    methods.reset(formData);
  }, [currentStep, formData, methods]);

  const StepComponent = [
    <PetDetailsPage
      key="pet-details"
      genders={localizedGenders}
      breeds={localizedBreeds}
    />,
    <OwnerDetailsPage key="owner-details" />,
    <VetDetailsPage key="vet-details" />
  ][currentStep];

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleNext)}
        className="flex h-full grow flex-col p-4"
      >
        <BackButton handleBack={handleBack} />
        <div className="grow">{StepComponent}</div>
        <div className="flex w-full flex-row items-center justify-between">
          <GetStartedProgressDots
            numberOfDots={schemaSteps.length}
            currentDot={currentStep}
          />
          <GetStartedFloatingActionButton
            isLastStep={currentStep === schemaSteps.length - 1}
            loading={loading}
          />
        </div>
      </form>
    </FormProvider>
  );
}
