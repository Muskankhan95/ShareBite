import { UserProfile, UserRole } from "@/types/user";

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  organizationName?: string;
  address?: string | {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contactPerson?: string;
  donorCategory?: string;
  volunteerVehicleType?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; destination?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; destination?: string }>;
  logout: () => Promise<void>;
  quickLoginAs: (role: UserRole) => Promise<void>;
}
