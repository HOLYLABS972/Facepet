'use client';

import OwnerDetailsPage from '@/components/get-started/OwnerDetailsPage';
import PetDetailsPage from '@/components/get-started/PetDetailsPage';
import VetDetailsPage from '@/components/get-started/VetDetailsPage';
import GetStartedFloatingActionButton from '@/components/get-started/ui/GetStartedFloatingActionButton';
import GetStartedProgressDots from '@/components/get-started/ui/GetStartedProgressDots';
import { useRouter } from '@/i18n/routing';
import { updatePet } from '@/src/lib/actions/pets';
import { getPetRegisterSchemas } from '@/utils/validation/petRegister';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import BackButton from './get-started/ui/BackButton';
import Navbar from './layout/Navbar';

export default function EditPetPage({
  petId,
  petDetails,
  genders,
  breeds
}: {
  petId: string;
  petDetails: PetForEdit;
  genders: { id: number; labels: { en: string; he: string } }[];
  breeds: { id: number; labels: { en: string; he: string } }[];
}) {
  const router = useRouter();
  const locale = useLocale() as 'en' | 'he';
  const t = useTranslations('');
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Get valid breed & gender IDs.
  const breedIds = breeds.map((b) => b.id);
  const genderIds = genders.map((g) => g.id);

  // Transform genders & breeds to localized options.
  const localizedGenders = genders.map(({ id, labels }) => ({
    id,
    label: labels[locale] || labels.en
  }));
  const localizedBreeds = breeds.map(({ id, labels }) => ({
    id,
    label: labels[locale] || labels.en
  }));

  // Get the internationalized schemas.
  const schemas = getPetRegisterSchemas(t, breedIds, genderIds);
  // Order of steps: petDetails, ownerDetails, vetDetails.
  const schemaSteps = [
    schemas.petDetails,
    schemas.ownerDetails,
    schemas.vetDetails
  ];

  // Define form default values.
  const [formData, setFormData] = useState({
    imageUrl: petDetails.imageUrl || '',
    petName: petDetails.name || '',
    breedId: petDetails.breed || 0,
    genderId: petDetails.gender || 0,
    birthDate: petDetails.birthDate ? new Date(petDetails.birthDate) : null,
    notes: petDetails.notes || '',
    // Owner information
    ownerFullName: petDetails.owner?.fullName || '',
    ownerPhoneNumber: petDetails.owner?.phoneNumber || '',
    ownerEmailAddress: petDetails.owner?.email || '',
    ownerHomeAddress: petDetails.owner?.homeAddress || '',
    // Owner privacy settings
    isOwnerPhonePrivate: petDetails.owner?.isPhonePrivate || false,
    isOwnerEmailPrivate: petDetails.owner?.isEmailPrivate || false,
    isOwnerAddressPrivate: petDetails.owner?.isAddressPrivate || false,
    // Vet information
    vetName: petDetails.vet?.name || '',
    vetPhoneNumber: petDetails.vet?.phoneNumber || '',
    vetEmailAddress: petDetails.vet?.email || '',
    vetAddress: petDetails.vet?.address || '',
    // Vet privacy settings
    isVetNamePrivate: petDetails.vet?.isNamePrivate || false,
    isVetPhonePrivate: petDetails.vet?.isPhonePrivate || false,
    isVetEmailPrivate: petDetails.vet?.isEmailPrivate || false,
    isVetAddressPrivate: petDetails.vet?.isAddressPrivate || false
  });

  const methods = useForm({
    resolver: zodResolver(schemaSteps[currentStep]),
    defaultValues: formData,
    mode: 'onChange'
  });

  const handleSubmit = async (data: NewPetData) => {
    setLoading(true);
    const result = await updatePet(petId, data);
    setLoading(false);
    if (result.success) {
      toast.success('Pet updated successfully');
      router.push(`/pages/my-pets`);
    } else {
      toast.error(result.error || 'An unexpected error occurred');
    }
  };

  // Save current step's data and navigate forward.
  const handleNext = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    if (currentStep < schemaSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit({ ...formData, ...data });
    }
  };

  // Save current step's data and navigate backward.
  const handleBack = () => {
    const currentData = methods.getValues();
    setFormData((prev) => ({ ...prev, ...currentData }));
    if (currentStep === 0) {
      router.push(`/pages/my-pets`);
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
    <>
      <Navbar />
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(handleNext)}
          className="flex h-full grow flex-col p-4"
        >
          <div className="grow">{StepComponent}</div>
          <div className="flex w-full flex-row items-center justify-between">
            <BackButton handleBack={handleBack} />
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
    </>
  );
}
