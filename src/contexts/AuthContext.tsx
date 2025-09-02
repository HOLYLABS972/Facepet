'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth } from '@/src/lib/firebase/config';
import { createUserInFirestore } from '@/src/lib/firebase/users';

// Define admin emails that should get admin/super_admin roles
const adminEmails: Record<string, 'admin' | 'super_admin'> = {
  'admin@facepet.com': 'super_admin',
  'polskoydm@gmail.com': 'super_admin', // Add your email as super admin
  // Add more admin emails as needed
};

// Function to determine user role based on email
const getUserRole = (email: string): 'user' | 'admin' | 'super_admin' => {
  const emailLower = email.toLowerCase();
  const role = adminEmails[emailLower] || 'user';
  console.log('🔍 Role assignment:', { email, emailLower, role, adminEmails });
  return role;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
  sendVerificationCode: (email: string) => Promise<void>;
  verifyCodeAndCreateAccount: (email: string, password: string, fullName: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [storedOTPCode, setStoredOTPCode] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase Auth state changed:', user);
      setUser(user);
      setLoading(false);
    });

    // No need for redirect result handling since we're using popup

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Firebase handles the authentication, no need for additional API calls
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName
        });

        // Store user in Firestore collection with role assignment
        const userRole = getUserRole(email);
        const cookiePreference = localStorage.getItem('acceptCookies') === 'true';
        console.log('🔍 Creating user (signUp) with role:', { email, userRole, cookiePreference });
        const userResult = await createUserInFirestore(userCredential.user, {
          acceptCookies: cookiePreference,
          language: 'en',
          role: userRole
        });

        if (!userResult.success) {
          console.error('Failed to store user in Firestore:', userResult.error);
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Firebase sign out...');
      await firebaseSignOut(auth);
      console.log('Firebase sign out completed');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Use popup for in-frame experience
      const userCredential = await signInWithPopup(auth, provider);
      
                      // Store user in Firestore collection after Google sign-in
                if (userCredential.user) {
                  const userRole = getUserRole(userCredential.user.email || '');
                  const cookiePreference = localStorage.getItem('acceptCookies') === 'true';
                  const userResult = await createUserInFirestore(userCredential.user, {
                    acceptCookies: cookiePreference,
                    language: 'en',
                    role: userRole
                  });

                  if (!userResult.success) {
                    console.error('Failed to store Google user in Firestore:', userResult.error);
                  }
                }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const sendVerificationCode = async (email: string) => {
    try {
      // Call your external OTP API
      const response = await fetch(`https://api.theholylabs.com/global_auth?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.verification_code) {
        // Store the OTP code in frontend state for comparison
        setStoredOTPCode(data.verification_code);
        console.log('Verification code sent and stored:', data.verification_code);
        return { success: true, message: data.message };
      } else {
        throw new Error('Failed to get verification code from API');
      }
    } catch (error) {
      console.error('Send verification code error:', error);
      throw error;
    }
  };

  const verifyCodeAndCreateAccount = async (email: string, password: string, fullName: string, code: string, phone?: string) => {
    try {
      // Validate the OTP code against the stored frontend code
      if (!storedOTPCode || storedOTPCode !== code) {
        throw new Error('Invalid verification code');
      }

      // Clear the stored OTP code after successful verification
      setStoredOTPCode(null);

      // Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName
        });

        // Store user in Firestore collection with role assignment
        const userRole = getUserRole(email);
        const cookiePreference = localStorage.getItem('acceptCookies') === 'true';
        console.log('🔍 Creating user with role:', { email, userRole, cookiePreference });
        const userResult = await createUserInFirestore(userCredential.user, {
          phone: phone || '',
          acceptCookies: cookiePreference,
          language: 'en',
          role: userRole
        });

        if (!userResult.success) {
          console.error('Failed to store user in Firestore:', userResult.error);
          // Don't throw error here, user is still created in Firebase Auth
        }
      }

      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Verify code and create account error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    sendVerificationCode,
    verifyCodeAndCreateAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
