import { Injectable, NgZone } from '@angular/core';
import {
  browserLocalPersistence,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  firstValueFrom,
  of,
  switchMap,
  take,
  timeout,
} from 'rxjs';
import { firebaseAuth, firestore } from '../firebase/firebase.client'; // ← removed storage
import { UserProfile, UserRole } from '../models/app.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private static readonly MAX_PROFILE_PHOTO_SIZE_BYTES = 350 * 1024; // ← changed to 350KB

  private readonly authStateSubject = new BehaviorSubject<User | null>(firebaseAuth.currentUser);
  readonly authState$ = this.authStateSubject.asObservable();

  readonly profile$ = this.authState$.pipe(
    switchMap((user) => (user ? this.watchProfile(user.uid) : of(null))),
    timeout(8000),
    catchError(() => of(null)),
  );

  constructor(private readonly ngZone: NgZone) {
    setPersistence(firebaseAuth, browserLocalPersistence).catch((error) => {
      console.warn('Failed to set auth persistence:', error);
    });

    onAuthStateChanged(firebaseAuth, (user) => {
      this.ngZone.run(() => this.authStateSubject.next(user));
    });
  }

  async signup(email: string, password: string, role: UserRole): Promise<void> {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const profile: UserProfile = {
      uid: cred.user.uid,
      email,
      role,
      walletBalance: 0,
      displayName: '',
      phone: '',
      photoURL: '',
    };
    await setDoc(doc(firestore, 'users', cred.user.uid), profile, { merge: true });
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  }

  async forgotPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(firebaseAuth, email);
  }

  async logout(): Promise<void> {
    await signOut(firebaseAuth);
  }

  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    await setDoc(doc(firestore, 'users', uid), updates, { merge: true });
  }

  // ✅ No Firebase Storage — pure base64 conversion, no CORS issues
  async uploadProfilePhoto(uid: string, file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('invalid-image-type');
    }

    if (file.size > AuthService.MAX_PROFILE_PHOTO_SIZE_BYTES) {
      throw new Error('image-too-large');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('file-read-failed'));
      reader.readAsDataURL(file);
    });
  }

  async getProfileByUid(uid: string): Promise<UserProfile | null> {
    const snapshot = await getDoc(doc(firestore, 'users', uid));
    return (snapshot.data() as UserProfile | undefined) ?? null;
  }

  getCurrentUid(): string | null {
    return this.authStateSubject.value?.uid ?? null;
  }

  async getCurrentUidAsync(timeoutMs = 5000): Promise<string | null> {
    const existing = this.getCurrentUid();
    if (existing) {
      return existing;
    }

    try {
      const user = await firstValueFrom(
        this.authState$.pipe(
          filter((u): u is User => !!u),
          take(1),
          timeout(timeoutMs),
        ),
      );
      return user.uid;
    } catch {
      return null;
    }
  }

  private watchProfile(uid: string): Observable<UserProfile | null> {
    return new Observable<UserProfile | null>((subscriber) => {
      const unsub = onSnapshot(
        doc(firestore, 'users', uid),
        (snapshot) => {
          this.ngZone.run(() => {
            const profileData = snapshot.data() as UserProfile | undefined;
            subscriber.next(profileData ?? null);
          });
        },
        (error) => {
          console.warn('Failed to load user profile:', error);
          subscriber.next(null);
        },
      );
      return () => unsub();
    });
  }
}