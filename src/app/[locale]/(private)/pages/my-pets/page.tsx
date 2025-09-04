import MyPetClient from '@/src/components/MyPetClient';

export default function MyPetsPage() {
  // Pass empty pets array - the MyPetsClient component will handle fetching pets
  // using Firebase Auth to get the user ID
  return <MyPetClient pets={[]} />;
}
