import { useState, useEffect } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthState {
    user: User | null;
    role: string | null;
    hospitalId: string | null;
    loading: boolean;
    error: string | null;
}

interface UseAuthReturn extends AuthState {
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        role: null,
        hospitalId: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const idTokenResult = await user.getIdTokenResult();
                    setAuthState({
                        user,
                        role: (idTokenResult.claims.role as string) || null,
                        hospitalId: (idTokenResult.claims.hospitalId as string) || null,
                        loading: false,
                        error: null,
                    });
                } catch (error) {
                    console.error('Failed to get token claims', error);
                    setAuthState({
                        user,
                        role: null,
                        hospitalId: null,
                        loading: false,
                        error: null,
                    });
                }
            } else {
                setAuthState({
                    user: null,
                    role: null,
                    hospitalId: null,
                    loading: false,
                    error: null,
                });
            }
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string): Promise<void> => {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: unknown) {
            let errorMessage = 'An error occurred during sign in.';

            if (error && typeof error === 'object' && 'code' in error) {
                const firebaseError = error as { code: string };
                switch (firebaseError.code) {
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'This account has been disabled.';
                        break;
                    case 'auth/user-not-found':
                        errorMessage = 'No account found with this email.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Incorrect password.';
                        break;
                    case 'auth/invalid-credential':
                        errorMessage = 'Invalid email or password.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many failed attempts. Please try again later.';
                        break;
                    default:
                        errorMessage = 'Failed to sign in. Please try again.';
                }
            }

            setAuthState((prev) => ({
                ...prev,
                loading: false,
                error: errorMessage,
            }));
            throw new Error(errorMessage);
        }
    };

    const signOut = async (): Promise<void> => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    return {
        ...authState,
        signIn,
        signOut,
    };
}
