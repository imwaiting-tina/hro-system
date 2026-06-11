// ============================================================
// 认证Store - Zustand
// ============================================================
import { create } from 'zustand';
import bcrypt from 'bcryptjs';
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
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !userData) {
        return { success: false, error: '用户名或密码错误' };
      }

      // 使用 bcrypt 验证密码
      const isValid = await bcrypt.compare(password, userData.password_hash);
      if (!isValid) {
        return { success: false, error: '用户名或密码错误' };
      }

      const user: User = {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name,
        role: userData.role as UserRole,
        email: userData.email,
        phone: userData.phone,
        department: userData.department,
        position: userData.position,
        avatar_url: userData.avatar_url,
        is_active: userData.is_active,
      };

      // 保存登录状态到 localStorage
      localStorage.setItem('hro_user', JSON.stringify(user));

      set({ user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '登录失败' };
    }
  },

  logout: async () => {
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
