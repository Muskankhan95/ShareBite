import { UserRepository } from "./repositories/user.repo";
import { UserProfile, UserRole } from "@/types/user";

export interface StoredUser extends UserProfile {
  passwordHash: string;
}

export function getAllStoredUsers(): StoredUser[] {
  const users = UserRepository.getAllUsers();
  return users as StoredUser[];
}

export function findUserByEmail(email: string): StoredUser | null {
  return UserRepository.findUserByEmail(email) as StoredUser | null;
}

export function findUserById(id: string): StoredUser | null {
  return UserRepository.findUserById(id) as StoredUser | null;
}

export function createStoredUser(user: StoredUser): StoredUser {
  UserRepository.createUser({
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    phone: user.phone,
    role: user.role,
    address: user.address.street,
    organizationName: user.organizationName,
    donorCategory: user.donorCategory,
    volunteerVehicleType: user.volunteerVehicleType,
  });
  return user;
}

export function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash, ...safe } = user;
  return safe;
}
