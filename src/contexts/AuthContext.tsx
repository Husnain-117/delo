import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role
          const fetchRole = async () => {
            // First check user_roles table
            const { data: roles, error } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
              console.error('❌ Role fetch error:', error);
              // If no role found, check if user is a customer
              const { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('user_id', session.user.id)
                .single();
              
              if (customer) {
                setUserRole('customer');
              } else {
                setUserRole(null);
              }
            } else if (roles?.role) {
              console.log('🔍 Fetched role from DB:', roles.role);
              setUserRole(roles.role);
            } else {
              // No role in user_roles, check if customer
              const { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('user_id', session.user.id)
                .single();
              
              if (customer) {
                setUserRole('customer');
              } else {
                setUserRole(null);
              }
            }
          };
          fetchRole();
        } else {
          setUserRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const fetchRole = async () => {
          // First check user_roles table
          const { data: roles, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('❌ Role fetch error:', error);
            // If no role found, check if user is a customer
            const { data: customer } = await supabase
              .from('customers')
              .select('id')
              .eq('user_id', session.user.id)
              .single();
            
            if (customer) {
              setUserRole('customer');
            } else {
              setUserRole(null);
            }
          } else if (roles?.role) {
            console.log('🔍 Initial role fetch:', roles.role);
            setUserRole(roles.role);
          } else {
            // No role in user_roles, check if customer
            const { data: customer } = await supabase
              .from('customers')
              .select('id')
              .eq('user_id', session.user.id)
              .single();
            
            if (customer) {
              setUserRole('customer');
            } else {
              setUserRole(null);
            }
          }
          setLoading(false);
        };
        fetchRole();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, _role: string) => {
    // Create auth user - email confirmation disabled for now
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: undefined, // No email redirect needed
      },
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return { error };
    }

    if (!data.user) {
      return { error: { message: "User creation failed" } };
    }

    // NOTE: Email verification is disabled for development
    // Make sure to disable "Confirm email" in Supabase Dashboard:
    // Authentication → Providers → Email → Toggle "Confirm email" OFF
    
    // Create profile - user can proceed immediately without email confirmation
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
    });

    toast({
      title: "Success",
      description: "Account created successfully! Complete your profile to continue.",
    });

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  const refreshRole = async () => {
    if (!user) {
      setUserRole(null);
      return;
    }

    // First check user_roles table
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Role refresh error:', error);
      // If no role found, check if user is a customer
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (customer) {
        setUserRole('customer');
      } else {
        setUserRole(null);
      }
    } else if (roles?.role) {
      setUserRole(roles.role);
    } else {
      // No role in user_roles, check if customer
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (customer) {
        setUserRole('customer');
      } else {
        setUserRole(null);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, signIn, signUp, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
