import React, { createContext, useContext, useState, useEffect } from 'react';
import { Models } from 'appwrite';
import { account, teams } from '../appwrite/client';
import { APPWRITE_CONFIG } from '../appwrite/config';
import { AdminRole } from '../types/schema';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  role: AdminRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  canPublish: boolean;
  canDelete: boolean;
  isSuperAdmin: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const determineRole = async (userId: string): Promise<AdminRole | null> => {
    try {
      const res = await teams.listMemberships(APPWRITE_CONFIG.adminTeamId);
      const myMembership = res.memberships.find((m) => m.userId === userId);
      if (!myMembership) return null;

      const roles = myMembership.roles || [];
      if (roles.includes('owner')) return 'super_admin';
      if (roles.includes('desa')) return 'admin_desa';
      if (roles.includes('kkn')) return 'admin_kkn';
      return 'admin_kkn'; // fallback within team
    } catch (e) {
      return null;
    }
  };

  const checkSession = async () => {
    try {
      setLoading(true);
      const currentUser = await account.get();
      setUser(currentUser);
      const userRole = await determineRole(currentUser.$id);
      setRole(userRole);
    } catch (err) {
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await account.createEmailPasswordSession(email, password);
      await checkSession();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setRole(null);
    }
  };

  const isSuperAdmin = role === 'super_admin';
  const canPublish = role === 'super_admin' || role === 'admin_desa';
  const canDelete = role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        login,
        logout,
        canPublish,
        canDelete,
        isSuperAdmin,
        refreshAuth: checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
