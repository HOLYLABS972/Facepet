// Test file to verify user storage in Firestore
import { createUserInFirestore, getUserFromFirestore } from './firebase/users';

export async function testUserStorage() {
  console.log('Testing user storage in Firestore...');
  
  // This would be called after a user registers
  // The actual user object would come from Firebase Auth
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User'
  } as any;

  // Test creating user in Firestore
  const createResult = await createUserInFirestore(mockUser, {
    phone: '+1234567890',
    acceptCookies: true,
    language: 'en'
  });

  if (createResult.success) {
    console.log('✅ User created in Firestore successfully');
    
    // Test retrieving user from Firestore
    const getResult = await getUserFromFirestore(mockUser.uid);
    
    if (getResult.success && getResult.user) {
      console.log('✅ User retrieved from Firestore:', getResult.user);
      return { success: true, user: getResult.user };
    } else {
      console.log('❌ Failed to retrieve user from Firestore:', getResult.error);
      return { success: false, error: getResult.error };
    }
  } else {
    console.log('❌ Failed to create user in Firestore:', createResult.error);
    return { success: false, error: createResult.error };
  }
}

// How it works in your app:
/*
1. User registers with email/password + OTP verification
2. Firebase Auth creates the user account
3. createUserInFirestore() stores user data in Firestore 'users' collection
4. User data includes: uid, email, displayName, phone, profileImage, acceptCookies, language, timestamps
5. Later, you can retrieve user data with getUserFromFirestore(uid)
*/
