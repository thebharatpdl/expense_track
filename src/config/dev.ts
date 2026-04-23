// src/config/dev.ts
export const DEV_MODE = true;

export const MOCK_USER = {
  uid: 'dev-user-123',
  email: 'dev@example.com',
  displayName: 'Developer',
  emailVerified: true,
  isAnonymous: false,
  phoneNumber: null,
  photoURL: null,
  providerId: 'firebase',
} as any;  // ← Add 'as any'