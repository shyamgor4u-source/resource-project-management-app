import { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../backend';

const DEMO_STORAGE_KEY = 'teamtrack_demo_session';

export interface DemoSession {
  isDemoMode: boolean;
  demoProfile: UserProfile | null;
  loginAsDemo: (role: UserRole) => void;
  logoutDemo: () => void;
}

const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  [UserRole.employee]: {
    name: 'Demo Employee',
    appRole: UserRole.employee,
  },
  [UserRole.pm]: {
    name: 'Demo Manager',
    appRole: UserRole.pm,
  },
  [UserRole.deliveryHead]: {
    name: 'Demo Delivery Head',
    appRole: UserRole.deliveryHead,
  },
  [UserRole.pmo]: {
    name: 'Demo PMO',
    appRole: UserRole.pmo,
  },
  [UserRole.admin]: {
    name: 'Demo Admin',
    appRole: UserRole.admin,
  },
  [UserRole.management]: {
    name: 'Demo Management',
    appRole: UserRole.management,
  },
};

function loadDemoSession(): UserProfile | null {
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserProfile;
  } catch {
    return null;
  }
}

export function useDemoAuth(): DemoSession {
  const [demoProfile, setDemoProfile] = useState<UserProfile | null>(() => loadDemoSession());

  const loginAsDemo = useCallback((role: UserRole) => {
    const profile = DEMO_PROFILES[role];
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(profile));
    setDemoProfile(profile);
  }, []);

  const logoutDemo = useCallback(() => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setDemoProfile(null);
  }, []);

  return {
    isDemoMode: demoProfile !== null,
    demoProfile,
    loginAsDemo,
    logoutDemo,
  };
}
