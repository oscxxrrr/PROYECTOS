import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, isConfigured } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

function toAuthUser(user: FirebaseUser): AuthUser {
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

export const authService = {
  isAvailable: () => isConfigured,

  async login(email: string, password: string): Promise<AuthUser> {
    if (!isConfigured) throw new Error('Firebase no configurado');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return toAuthUser(cred.user);
  },

  async register(email: string, password: string, displayName: string): Promise<AuthUser> {
    if (!isConfigured) throw new Error('Firebase no configurado');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    return toAuthUser(cred.user);
  },

  async logout(): Promise<void> {
    if (!isConfigured) return;
    await signOut(auth);
  },

  getCurrentUser(): AuthUser | null {
    if (!isConfigured || !auth.currentUser) return null;
    return toAuthUser(auth.currentUser);
  },

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    if (!isConfigured) {
      callback(null);
      return () => {};
    }
    return firebaseOnAuthStateChanged(auth, (user) => {
      callback(user ? toAuthUser(user) : null);
    });
  }
};
