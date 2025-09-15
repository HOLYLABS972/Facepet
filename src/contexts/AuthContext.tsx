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
import { auth } from '@/lib/firebase/config';
import { createUserInFirestore, handleUserAuthentication, getUserFromFirestore } from '@/lib/firebase/users';
import { generateOTPCode } from '@/src/lib/otp-generator';
import { sendVerificationEmailWithFallback } from '@/src/lib/holy-labs-email';

// Function to determine user role - all users get 'user' role by default
// Admin roles must be assigned manually through the admin panel
const getUserRole = (email: string): 'user' | 'admin' | 'super_admin' => {
  // All users get 'user' role by default
  // Admin roles are assigned manually through the admin interface
  console.log('🔍 Role assignment: All users get default "user" role');
  return 'user';
};

interface UserData {
  acceptCookies?: boolean;
  language?: string;
  role?: string;
  isRestricted?: boolean;
  restrictionReason?: string;
  phone?: string;
  address?: string;
}

interface VerificationResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsGoogleProfileCompletion: boolean;
  needsProfileCompletion: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string, address?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
  sendVerificationCode: (email: string, userName?: string) => Promise<VerificationResult>;
  verifyCodeAndCreateAccount: (email: string, password: string, fullName: string, code: string, address?: string, phone?: string) => Promise<{ success: boolean; user: User | null }>;
  completeGoogleProfile: () => void;
  completeProfile: () => void;
  checkProfileCompletion: (user: User) => Promise<boolean>;
  getStoredOTPCode: () => string | null;
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
  const [needsGoogleProfileCompletion, setNeedsGoogleProfileCompletion] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [storedOTPCode, setStoredOTPCode] = useState<string | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      return localStorage.getItem('storedOTPCode');
    }
    return null;
  });

  // Helper function to store OTP code in both state and localStorage
  const storeOTPCode = (code: string) => {
    setStoredOTPCode(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('storedOTPCode', code);
      console.log('🔐 OTP code stored in localStorage:', code);
    }
  };

  // Helper function to clear OTP code from both state and localStorage
  const clearOTPCode = () => {
    setStoredOTPCode(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('storedOTPCode');
      console.log('🗑️ OTP code cleared from localStorage');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase Auth state changed:', user);
      setUser(user);
      setLoading(false);
    }, (error) => {
      console.error('Firebase Auth state change error:', error);
      setLoading(false);
    });

    // No need for redirect result handling since we're using popup

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user is restricted after successful Firebase authentication
      if (userCredential.user) {
        const userResult = await getUserFromFirestore(userCredential.user.uid);
        const userData = userResult.user as UserData;
        if (userResult.success && userData?.isRestricted) {
          // Sign out the user immediately if they are restricted
          await firebaseSignOut(auth);
          throw new Error(`Your account has been restricted by an administrator. Reason: ${userData.restrictionReason || 'No reason provided'}`);
        }
        
        // Check if user has completed their profile (phone and address)
        await checkProfileCompletion(userCredential.user);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // If Firebase Auth fails with network error, provide helpful message
      if (error.code === 'auth/network-request-failed' || error.message?.includes('network')) {
        console.log('Firebase Auth network error detected');
        throw new Error('Network connection issue. Please check your internet connection and try again. If the problem persists, try using a different network or contact support.');
      }
      
      throw error;
    }
  };

  // Alternative login method using OTP (for when Firebase Auth has network issues)
  const signInWithOTP = async (email: string) => {
    try {
      // Send OTP for login
      await sendVerificationCode(email);
      return { success: true, message: 'OTP sent for login' };
    } catch (error) {
      console.error('OTP login error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string, address?: string) => {
    try {
      // Check if email already exists
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        throw new Error('This email is already registered. Please sign in instead.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName
        });

        // Store user in Firestore collection with role assignment
        const userRole = getUserRole(email);
        const cookiePreference = typeof window !== 'undefined' ? localStorage.getItem('acceptCookies') === 'true' : false;
        console.log('🔍 Creating user (signUp) with role:', { email, userRole, cookiePreference });
        const userResult = await createUserInFirestore(userCredential.user, {
          phone: phone || '',
          address: address || '',
          acceptCookies: cookiePreference,
          language: 'en',
          role: userRole
        });

        if (!userResult.success) {
          // If Firestore creation fails, delete the Firebase Auth user
          await userCredential.user.delete();
          throw new Error('Failed to create user profile. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      // Make the error message more user-friendly
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in instead.');
      } else {
        throw error;
      }
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
      
      // Handle user authentication without overriding existing role
      if (userCredential.user) {
        // Check if user is restricted
        const userResult = await getUserFromFirestore(userCredential.user.uid);
        const userData = userResult.user as UserData;
        if (userResult.success && userData?.isRestricted) {
          // Sign out the user immediately if they are restricted
          await firebaseSignOut(auth);
          throw new Error(`Your account has been restricted by an administrator. Reason: ${userData.restrictionReason || 'No reason provided'}`);
        }

        const cookiePreference = localStorage.getItem('acceptCookies') === 'true';
        console.log('🔍 Handling Google authentication (preserving existing role):', { 
          email: userCredential.user.email, 
          cookiePreference 
        });
        
        const authResult = await handleUserAuthentication(userCredential.user, {
          acceptCookies: cookiePreference,
          language: 'en'
        });

        if (!authResult.success) {
          console.error('Failed to handle Google user authentication:', authResult.error);
        } else {
          console.log('Google authentication successful:', authResult.isNewUser ? 'New user' : 'Existing user');
          
          // Check if user needs profile completion (missing phone or address)
          if (authResult.isNewUser || !userData?.phone || !userData?.address) {
            setNeedsGoogleProfileCompletion(true);
          } else {
            // Check profile completion for existing users
            await checkProfileCompletion(userCredential.user);
          }
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

  const sendVerificationCode = async (email: string, userName?: string): Promise<VerificationResult> => {
    try {
      // Check if email exists before sending code
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        return { success: false, message: 'This email is already registered. Please sign in instead.' };
      }

      // Generate OTP code on frontend
      const otpCode = generateOTPCode();
      console.log('Generated OTP code:', otpCode);

      // Store the OTP code FIRST, regardless of email sending status
      storeOTPCode(otpCode);
      console.log('✅ OTP code generated and stored:', otpCode);
      console.log('🔑 DEBUG: Your verification code is:', otpCode);
      
      // Try to send email via Holy Labs API (but don't fail if it doesn't work)
      try {
        const result = await sendVerificationEmailWithFallback(
          email, 
          otpCode, 
          userName || 'User'
        );
        
        if (result.success) {
          console.log('✅ Verification email sent successfully');
          return { success: true, message: 'Verification code sent to your email' };
        } else {
          console.warn('⚠️ Email sending failed, but code is stored:', result.message);
          return { success: true, message: 'Verification code generated. Please check your email or try again.' };
        }
      } catch (error) {
        console.warn('⚠️ Email sending failed due to CORS, but code is stored:', error);
        return { success: true, message: 'Verification code generated. Please check your email or try again.' };
      }
    } catch (error) {
      console.error('Send verification code error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to send verification code' };
    }
  };

  const verifyCodeAndCreateAccount = async (email: string, password: string, fullName: string, code: string, address?: string, phone?: string) => {
    try {
      console.log('🔍 Verifying code:', { 
        providedCode: code, 
        storedCode: storedOTPCode, 
        codesMatch: storedOTPCode === code 
      });
      
      // Validate the OTP code against the stored frontend code
      if (!storedOTPCode || storedOTPCode !== code) {
        console.error('❌ Code validation failed:', { 
          providedCode: code, 
          storedCode: storedOTPCode,
          storedCodeType: typeof storedOTPCode,
          providedCodeType: typeof code
        });
        throw new Error('Invalid verification code');
      }

      console.log('✅ Code validation successful, creating account...');
      
      // Clear the stored OTP code after successful verification
      clearOTPCode();

      // Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName
        });

        // Store user in Firestore collection with role assignment
        const userRole = getUserRole(email);
        const cookiePreference = typeof window !== 'undefined' ? localStorage.getItem('acceptCookies') === 'true' : false;
        console.log('🔍 Creating user with role:', { email, userRole, cookiePreference });
        const userResult = await createUserInFirestore(userCredential.user, {
          phone: phone || '',
          address: address || '',
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

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      return signInMethods.length > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  };

  const completeGoogleProfile = () => {
    setNeedsGoogleProfileCompletion(false);
  };

  const completeProfile = () => {
    setNeedsProfileCompletion(false);
  };

  // Check if user has completed their profile (has phone and address)
  const checkProfileCompletion = async (user: User) => {
    try {
      const userResult = await getUserFromFirestore(user.uid);
      if (userResult.success && userResult.user) {
        const userData = userResult.user as UserData;
        const hasPhone = userData.phone && userData.phone.trim() !== '';
        const hasAddress = userData.address && userData.address.trim() !== '';
        
        if (!hasPhone || !hasAddress) {
          setNeedsProfileCompletion(true);
          return false;
        }
      }
      setNeedsProfileCompletion(false);
      return true;
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setNeedsProfileCompletion(true);
      return false;
    }
  };

  const value = {
    user,
    loading,
    needsGoogleProfileCompletion,
    needsProfileCompletion,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    checkEmailExists,
    sendVerificationCode,
    verifyCodeAndCreateAccount,
    completeGoogleProfile,
    completeProfile,
    checkProfileCompletion,
    getStoredOTPCode: () => storedOTPCode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
