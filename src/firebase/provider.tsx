
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, getDoc, doc, setDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
import type { UserProfile } from '@/lib/types';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  role: UserProfile['role'] | null;
  isRoleLoading: boolean;
  status: UserProfile['status'] | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
  role: UserProfile['role'] | null;
  isRoleLoading: boolean;
  status: UserProfile['status'] | null;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  role: UserProfile['role'] | null;
  isRoleLoading: boolean;
  status: UserProfile['status'] | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  role: UserProfile['role'] | null;
  isRoleLoading: boolean;
  status: UserProfile['status'] | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
    role: null,
    isRoleLoading: true,
    status: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth || !firestore) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth or Firestore service not provided."), role: null, isRoleLoading: false, status: null });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in. Start loading their profile data.
          setUserAuthState(prevState => ({ ...prevState, user: firebaseUser, isUserLoading: false, isRoleLoading: true }));
          
          const userRef = doc(firestore, 'users', firebaseUser.uid);
          
          try {
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
              // User profile exists, read role and status from it.
              const userData = userDoc.data() as UserProfile;
              setUserAuthState(prevState => ({
                ...prevState,
                role: userData.role,
                status: userData.status,
                isRoleLoading: false,
              }));
            } else {
              // This is a new user, their profile does not exist yet. Create it now.
              const isBootstrapAdmin = firebaseUser.email === 'cableexitoocana@gmail.com';
              
              const newUserProfile: Omit<UserProfile, 'id'> = {
                email: firebaseUser.email!,
                role: isBootstrapAdmin ? 'Admin' : 'Viewer',
                status: isBootstrapAdmin ? 'Activo' : 'Inactivo', // New users are inactive by default, except for the admin.
                createdAt: new Date().toISOString(),
                displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              };
              
              await setDoc(userRef, newUserProfile);

              // After creating the document, set the user's role and status in the app state.
              setUserAuthState(prevState => ({
                ...prevState,
                role: newUserProfile.role,
                status: newUserProfile.status,
                isRoleLoading: false,
              }));
            }
          } catch (error) {
            console.error("Error getting or creating user profile:", error);
            setUserAuthState(prevState => ({ ...prevState, userError: error as Error, isRoleLoading: false }));
          }

        } else {
          // User is signed out, clear all user-related state.
          setUserAuthState({ user: null, isUserLoading: false, userError: null, role: null, isRoleLoading: false, status: null });
        }
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error, role: null, isRoleLoading: false, status: null });
      }
    );

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [auth, firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
      role: userAuthState.role,
      isRoleLoading: userAuthState.isRoleLoading,
      status: userAuthState.status,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    role: context.role,
    isRoleLoading: context.isRoleLoading,
    status: context.status,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError, role, isRoleLoading, status } = useFirebase();
  return { user, isUserLoading, userError, role, isRoleLoading, status };
};
