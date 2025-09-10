interface AuthCredentials {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

interface NewPetData {
  id: string;
  imageUrl: string;
  petName: string;
  breedId: number;
  genderId: number;
  birthDate: string | null;
  notes: string;
  // All pet information is always public
  // Owner information
  ownerFullName: string;
  ownerPhoneNumber: string;
  ownerEmailAddress: string;
  ownerHomeAddress: string;
  // Owner privacy settings - name is always public
  isOwnerPhonePrivate?: boolean;
  isOwnerEmailPrivate?: boolean;
  isOwnerAddressPrivate?: boolean;
  // Vet information
  vetName: string;
  vetPhoneNumber: string;
  vetEmailAddress: string;
  vetAddress: string;
  // Vet privacy settings - all vet info can be private
  isVetNamePrivate?: boolean;
  isVetPhonePrivate?: boolean;
  isVetEmailPrivate?: boolean;
  isVetAddressPrivate?: boolean;
}

interface Pet {
  id: string;
  name: string;
  imageUrl: string;
  birthDate: string | null;
  notes: string | null;
  userId: string;
  gender: { en: string; he: string };
  breed: { en: string; he: string };
  // All pet information is always public
  owner: {
    email: string;
    fullName: string;
    phoneNumber: string;
    homeAddress: string;
    // Owner privacy settings - name is always public
    isPhonePrivate?: boolean;
    isEmailPrivate?: boolean;
    isAddressPrivate?: boolean;
  } | null;
  vet: {
    name: string;
    phoneNumber: string;
    email: string;
    address: string;
    // Vet privacy settings - all vet info can be private
    isNamePrivate?: boolean;
    isPhonePrivate?: boolean;
    isEmailPrivate?: boolean;
    isAddressPrivate?: boolean;
  } | null;
}

// Define types for the returned data structures
type PetForEdit = {
  id: string;
  name: string;
  imageUrl: string;
  birthDate: string | null;
  notes: string | null;
  gender: number | null;
  breed: number | null;
  // All pet information is always public
  owner: {
    fullName: string | null;
    phoneNumber: string | null;
    email: string | null;
    homeAddress: string | null;
    // Owner privacy settings - name is always public
    isPhonePrivate?: boolean;
    isEmailPrivate?: boolean;
    isAddressPrivate?: boolean;
  } | null;
  vet: {
    name: string | null;
    phoneNumber: string | null;
    email: string | null;
    address: string | null;
    // Vet privacy settings - all vet info can be private
    isNamePrivate?: boolean;
    isPhonePrivate?: boolean;
    isEmailPrivate?: boolean;
    isAddressPrivate?: boolean;
  } | null;
};

type Gender = { id: number; en: string; he: string };
type Breed = { id: number; en: string; he: string };
