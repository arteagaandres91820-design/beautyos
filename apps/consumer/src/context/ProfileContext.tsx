import { createContext, useContext, useState, ReactNode } from 'react';

export interface SkinProfile {
  skinType: string;
  concerns: string[];
  level: string;
  isOnboarded: boolean;
}

interface ProfileContextType {
  profile: SkinProfile | null;
  setProfile: (p: SkinProfile) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<SkinProfile | null>(null);
  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
