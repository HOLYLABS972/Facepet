// Import comprehensive breed data from breeds.json
import { breedsByType as comprehensiveBreedsByType, getBreedsForType as getComprehensiveBreedsForType } from './comprehensive-breeds';

// Legacy breed data structure for backward compatibility
// Maps comprehensive breeds to the old format with localization support
export const breedsByType = {
  cat: comprehensiveBreedsByType.cat.map(breed => ({
    id: `cat-${breed.id}`,
    name: breed.en,
    nameHe: breed.he
  })),
  dog: comprehensiveBreedsByType.dog.map(breed => ({
    id: `dog-${breed.id}`,
    name: breed.en,
    nameHe: breed.he
  })),
  bird: [
    { id: 'bird-1', name: 'Budgerigar (Budgie)' },
    { id: 'bird-2', name: 'Cockatiel' },
    { id: 'bird-3', name: 'Canary' },
    { id: 'bird-4', name: 'Lovebird' },
    { id: 'bird-5', name: 'Conure' },
    { id: 'bird-6', name: 'Cockatoo' },
    { id: 'bird-7', name: 'African Grey Parrot' },
    { id: 'bird-8', name: 'Amazon Parrot' },
    { id: 'bird-9', name: 'Macaw' },
    { id: 'bird-10', name: 'Finch' },
    { id: 'bird-11', name: 'Parakeet' },
    { id: 'bird-12', name: 'Quaker Parrot' },
    { id: 'bird-13', name: 'Senegal Parrot' },
    { id: 'bird-14', name: 'Sun Conure' },
    { id: 'bird-15', name: 'Mixed Breed' }
  ],
  fish: [
    { id: 'fish-1', name: 'Goldfish' },
    { id: 'fish-2', name: 'Betta' },
    { id: 'fish-3', name: 'Guppy' },
    { id: 'fish-4', name: 'Angelfish' },
    { id: 'fish-5', name: 'Neon Tetra' },
    { id: 'fish-6', name: 'Molly' },
    { id: 'fish-7', name: 'Platy' },
    { id: 'fish-8', name: 'Swordtail' },
    { id: 'fish-9', name: 'Discus' },
    { id: 'fish-10', name: 'Oscar' },
    { id: 'fish-11', name: 'Cichlid' },
    { id: 'fish-12', name: 'Koi' },
    { id: 'fish-13', name: 'Mixed Breed' }
  ],
  rabbit: [
    { id: 'rabbit-1', name: 'Holland Lop' },
    { id: 'rabbit-2', name: 'Netherland Dwarf' },
    { id: 'rabbit-3', name: 'Mini Rex' },
    { id: 'rabbit-4', name: 'Lionhead' },
    { id: 'rabbit-5', name: 'Flemish Giant' },
    { id: 'rabbit-6', name: 'English Lop' },
    { id: 'rabbit-7', name: 'French Lop' },
    { id: 'rabbit-8', name: 'American Fuzzy Lop' },
    { id: 'rabbit-9', name: 'Mini Lop' },
    { id: 'rabbit-10', name: 'Mixed Breed' }
  ],
  hamster: [
    { id: 'hamster-1', name: 'Syrian Hamster' },
    { id: 'hamster-2', name: 'Dwarf Campbell Russian' },
    { id: 'hamster-3', name: 'Dwarf Winter White' },
    { id: 'hamster-4', name: 'Roborovski Dwarf' },
    { id: 'hamster-5', name: 'Chinese Hamster' },
    { id: 'hamster-6', name: 'Mixed Breed' }
  ],
  'guinea-pig': [
    { id: 'gp-1', name: 'American' },
    { id: 'gp-2', name: 'Abyssinian' },
    { id: 'gp-3', name: 'Peruvian' },
    { id: 'gp-4', name: 'Silkie' },
    { id: 'gp-5', name: 'Teddy' },
    { id: 'gp-6', name: 'Texel' },
    { id: 'gp-7', name: 'Mixed Breed' }
  ],
  turtle: [
    { id: 'turtle-1', name: 'Red-Eared Slider' },
    { id: 'turtle-2', name: 'Russian Tortoise' },
    { id: 'turtle-3', name: 'Hermann\'s Tortoise' },
    { id: 'turtle-4', name: 'Box Turtle' },
    { id: 'turtle-5', name: 'Painted Turtle' },
    { id: 'turtle-6', name: 'Yellow-Bellied Slider' },
    { id: 'turtle-7', name: 'Mixed Breed' }
  ],
  snake: [
    { id: 'snake-1', name: 'Ball Python' },
    { id: 'snake-2', name: 'Corn Snake' },
    { id: 'snake-3', name: 'King Snake' },
    { id: 'snake-4', name: 'Milk Snake' },
    { id: 'snake-5', name: 'Garter Snake' },
    { id: 'snake-6', name: 'Boa Constrictor' },
    { id: 'snake-7', name: 'Mixed Breed' }
  ],
  lizard: [
    { id: 'lizard-1', name: 'Bearded Dragon' },
    { id: 'lizard-2', name: 'Leopard Gecko' },
    { id: 'lizard-3', name: 'Crested Gecko' },
    { id: 'lizard-4', name: 'Blue Tongue Skink' },
    { id: 'lizard-5', name: 'Green Anole' },
    { id: 'lizard-6', name: 'Iguana' },
    { id: 'lizard-7', name: 'Mixed Breed' }
  ],
  ferret: [
    { id: 'ferret-1', name: 'Standard' },
    { id: 'ferret-2', name: 'Angora' },
    { id: 'ferret-3', name: 'Mixed Breed' }
  ],
  other: [
    { id: 'other-1', name: 'Mixed Breed' },
    { id: 'other-2', name: 'Unknown' }
  ]
};

export type PetType = keyof typeof breedsByType;
export type Breed = { id: string; name: string; nameHe?: string };

export function getBreedsForType(petType: PetType): Breed[] {
  return breedsByType[petType] || breedsByType.other;
}

// Get localized breed name based on locale
export function getLocalizedBreedName(breed: Breed, locale: 'en' | 'he' = 'en'): string {
  if (locale === 'he' && breed.nameHe) {
    return breed.nameHe;
  }
  return breed.name;
}

// Get breeds for type with localized names
export function getLocalizedBreedsForType(petType: PetType, locale: 'en' | 'he' = 'en'): Array<{ id: string; name: string }> {
  const breeds = getBreedsForType(petType);
  return breeds.map(breed => ({
    id: breed.id,
    name: getLocalizedBreedName(breed, locale)
  }));
}
