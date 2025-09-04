import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config';

export interface Breed {
  id: string;
  name: string;
  type: string;
  labels: {
    en: string;
    he: string;
  };
}

export interface Gender {
  id: string;
  labels: {
    en: string;
    he: string;
  };
}

/**
 * Get all breeds from Firebase collection
 */
export async function getBreedsFromFirestore(): Promise<Breed[]> {
  try {
    const breedsRef = collection(db, 'breeds');
    const snapshot = await getDocs(breedsRef);
    
    console.log('Breeds snapshot size:', snapshot.size);
    const breeds = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Breed doc:', doc.id, data);
      return {
        id: doc.id,
        ...data
      } as Breed;
    });
    
    console.log('All breeds fetched:', breeds);
    return breeds;
  } catch (error) {
    console.error('Error fetching breeds:', error);
    return [];
  }
}

/**
 * Get all genders from Firebase collection
 */
export async function getGendersFromFirestore(): Promise<Gender[]> {
  try {
    const gendersRef = collection(db, 'genders');
    const snapshot = await getDocs(gendersRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Gender));
  } catch (error) {
    console.error('Error fetching genders:', error);
    return [];
  }
}

/**
 * Initialize breeds collection with default data
 */
export async function initializeBreedsCollection() {
  try {
    const { addDoc } = await import('firebase/firestore');
    const breedsRef = collection(db, 'breeds');
    
    // Check if collection already has data
    const snapshot = await getDocs(breedsRef);
    if (snapshot.size > 0) {
      console.log('Breeds collection already initialized');
      return;
    }

    const defaultBreeds = [
      // Dogs
      { name: 'Labrador Retriever', type: 'dog', labels: { en: 'Labrador Retriever', he: 'לברדור רטריבר' } },
      { name: 'Golden Retriever', type: 'dog', labels: { en: 'Golden Retriever', he: 'גולדן רטריבר' } },
      { name: 'German Shepherd', type: 'dog', labels: { en: 'German Shepherd', he: 'רועה גרמני' } },
      { name: 'French Bulldog', type: 'dog', labels: { en: 'French Bulldog', he: 'בולדוג צרפתי' } },
      { name: 'Bulldog', type: 'dog', labels: { en: 'Bulldog', he: 'בולדוג' } },
      { name: 'Poodle', type: 'dog', labels: { en: 'Poodle', he: 'פודל' } },
      { name: 'Beagle', type: 'dog', labels: { en: 'Beagle', he: 'ביגל' } },
      { name: 'Mixed Breed', type: 'dog', labels: { en: 'Mixed Breed', he: 'גזע מעורב' } },
      
      // Cats
      { name: 'Persian', type: 'cat', labels: { en: 'Persian', he: 'פרסי' } },
      { name: 'Maine Coon', type: 'cat', labels: { en: 'Maine Coon', he: 'מיין קון' } },
      { name: 'British Shorthair', type: 'cat', labels: { en: 'British Shorthair', he: 'בריטי קצר שיער' } },
      { name: 'Ragdoll', type: 'cat', labels: { en: 'Ragdoll', he: 'ראגדול' } },
      { name: 'Siamese', type: 'cat', labels: { en: 'Siamese', he: 'סיאמי' } },
      { name: 'Mixed Breed', type: 'cat', labels: { en: 'Mixed Breed', he: 'גזע מעורב' } },
    ];

    for (const breed of defaultBreeds) {
      await addDoc(breedsRef, breed);
    }

    console.log('Breeds collection initialized successfully');
  } catch (error) {
    console.error('Error initializing breeds collection:', error);
  }
}

/**
 * Initialize genders collection with default data
 */
export async function initializeGendersCollection() {
  try {
    const { addDoc } = await import('firebase/firestore');
    const gendersRef = collection(db, 'genders');
    
    // Check if collection already has data
    const snapshot = await getDocs(gendersRef);
    if (snapshot.size > 0) {
      console.log('Genders collection already initialized');
      return;
    }

    const defaultGenders = [
      { labels: { en: 'Male', he: 'זכר' } },
      { labels: { en: 'Female', he: 'נקבה' } },
      { labels: { en: 'Unknown', he: 'לא ידוע' } },
    ];

    for (const gender of defaultGenders) {
      await addDoc(gendersRef, gender);
    }

    console.log('Genders collection initialized successfully');
  } catch (error) {
    console.error('Error initializing genders collection:', error);
  }
}
