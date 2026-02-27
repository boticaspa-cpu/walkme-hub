import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile, UserRole } from "@/types/auth";
import type { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, approval_status")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const role: UserRole = roles?.some((r) => r.role === "admin") ? "admin" : "seller";

  return {
    id: profile.id,
    full_name: profile.full_name,
    approval_status: profile.approval_status as UserProfile["approval_status"],
    role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Centralized helper – always resolves loading
  const loadProfileForSession = async (session: Session | null) => {
    try {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Safety timeout – guarantees we never stay loading forever
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // 1. Listener FIRST – synchronous callback, defer async work
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }
        // Defer to avoid deadlock with signInWithPassword
        setTimeout(() => {
          void loadProfileForSession(session);
        }, 0);
      }
    );

    // 2. Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      void loadProfileForSession(session);
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role ?? null,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
