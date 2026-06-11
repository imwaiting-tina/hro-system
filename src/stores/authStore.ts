// ============================================================
// 认证Store - Zustand
// ============================================================
import { create } from 'zustand';
import { supabase } from '../utils/supabase';
import type { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  login: async (username: string, password: string) => {
    try {
      // 从users表查询用户
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !users) {
        return { success: false, error: '用户名或密码错误' };
      }

      // 验证密码 (使用 Supabase Auth 或自定义验证)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: users.email || `${username}@hro-system.local`,
        password: password,
      });

      if (authError) {
        // 尝试注册 (首次登录自动注册)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: users.email || `${username}@hro-system.local`,
          password: password,
        });

        if (signUpError) {
          return { success: false, error: '密码验证失败' };
        }

        // 注册成功后重新登录
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: users.email || `${username}@hro-system.local`,
          password: password,
        });

        if (retryError) {
          return { success: false, error: '登录失败' };
        }
      }

      const user: User = {
        id: users.id,
        username: users.username,
        display_name: users.display_name,
        role: users.role as UserRole,
        email: users.email,
        phone: users.phone,
        department: users.department,
        position: users.position,
        avatar_url: users.avatar_url,
        is_active: users.is_active,
      };

      // 保存登录状态
      localStorage.setItem('hro_user', JSON.stringify(user));

      set({ user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '登录失败' };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('hro_user');
    set({ user: null, isAuthenticated: false, loading: false });
  },

  checkAuth: async () => {
    try {
      const cached = localStorage.getItem('hro_user');
      if (cached) {
        const user = JSON.parse(cached) as User;
        set({ user, isAuthenticated: true, loading: false });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (users) {
          const user: User = {
            id: users.id,
            username: users.username,
            display_name: users.display_name,
            role: users.role as UserRole,
            email: users.email,
            phone: users.phone,
            department: users.department,
            position: users.position,
            avatar_url: users.avatar_url,
            is_active: users.is_active,
          };
          localStorage.setItem('hro_user', JSON.stringify(user));
          set({ user, isAuthenticated: true, loading: false });
          return;
        }
      }

      set({ user: null, isAuthenticated: false, loading: false });
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },
}));

// 权限判断工具函数
export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

export function canEdit(userRole: UserRole): boolean {
  return ['super_admin', 'main_admin', 'sub_admin', 'bu_head'].includes(userRole);
}

export function canApprove(userRole: UserRole): boolean {
  return ['super_admin', 'main_admin', 'sub_admin', 'bu_head'].includes(userRole);
}

export function isAdmin(userRole: UserRole): boolean {
  return ['super_admin', 'main_admin', 'sub_admin'].includes(userRole);
}
