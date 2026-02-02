
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, getDocs, doc, getDoc, setDoc, query, limit, collection, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signOut } from 'firebase/auth';
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
          const isBootstrapAdmin = firebaseUser.email === 'cableexitoocana@gmail.com';
          
          // Set user and start loading role. For the bootstrap admin, we can preemptively set the role.
          setUserAuthState(prevState => ({ 
              ...prevState, 
              user: firebaseUser, 
              isUserLoading: false, 
              isRoleLoading: !isBootstrapAdmin, // Role is not loading if we are the admin
              role: isBootstrapAdmin ? 'Admin' : null,
              status: isBootstrapAdmin ? 'Activo' : null
          }));

          const userRef = doc(firestore, 'users', firebaseUser.uid);
          
          // Set up a listener for the user's profile document
          const roleUnsubscribe = onSnapshot(userRef, async (userDoc) => {
             if (userDoc.exists()) {
                const userData = userDoc.data() as UserProfile;
                
                // For non-admin users, set their role from the DB.
                // For the admin, we just update the status.
                const finalRole = isBootstrapAdmin ? 'Admin' : (userData?.role || 'Viewer');

                setUserAuthState(prevState => ({ 
                    ...prevState, 
                    role: finalRole, 
                    status: userData.status, 
                    isRoleLoading: false 
                }));

                // Self-correcting logic for the bootstrap admin's document in Firestore.
                if (isBootstrapAdmin && (userData?.role !== 'Admin' || userData?.status !== 'Activo')) {
                    setDoc(userRef, { role: 'Admin', status: 'Activo' }, { merge: true }).catch(err => {
                        console.error("Failed to self-correct admin role/status:", err);
                    });
                }

             } else {
                // New user document needs to be created.
                const newUserProfile: Omit<UserProfile, 'id'> = {
                  email: firebaseUser.email!,
                  role: isBootstrapAdmin ? 'Admin' : 'Viewer',
                  status: isBootstrapAdmin ? 'Activo' : 'Inactivo', // New users are inactive by default
                  createdAt: new Date().toISOString(),
                  displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
                };

                try {
                  await setDoc(userRef, newUserProfile);
                   // After creating, the local state is already likely correct from the initial check,
                   // but we set it again to be sure.
                   setUserAuthState(prevState => ({
                      ...prevState,
                      role: newUserProfile.role,
                      status: newUserProfile.status,
                      isRoleLoading: false,
                  }));
                } catch (e) {
                  console.error("Error creating user profile:", e);
                  setUserAuthState(prevState => ({ ...prevState, userError: e as Error, isRoleLoading: false }));
                }
             }
          }, (error) => {
            console.error("Error listening to user profile:", error);
            setUserAuthState(prevState => ({ ...prevState, userError: error, isRoleLoading: false }));
          });

          return () => roleUnsubscribe();

        } else {
          // User is signed out
          setUserAuthState({ user: null, isUserLoading: false, userError: null, role: null, isRoleLoading: false, status: null });
        }
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error, role: null, isRoleLoading: false, status: null });
      }
    );
    return () => unsubscribe(); // Cleanup on unmount
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
