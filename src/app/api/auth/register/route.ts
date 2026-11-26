import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, createStoredUser, sanitizeUser, StoredUser } from "@/lib/db/user-store";
import { hashPassword } from "@/lib/auth/password";
import { signJWT } from "@/lib/auth/jwt";
import { UserRole } from "@/types/user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      role,
      organizationName,
      address,
      contactPerson,
      donorCategory,
      volunteerVehicleType,
    } = body;

    // 1. Basic field presence validation
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { error: "Please provide all required fields: name, email, phone, password, and role." },
        { status: 400 }
      );
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 3. Password length and match validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    // 4. Role validation
    const validRoles: UserRole[] = ["donor", "ngo", "volunteer", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role selected." },
        { status: 400 }
      );
    }

    // 5. Role-specific validations
    if (role === "ngo") {
      if (!organizationName || !address || !contactPerson) {
        return NextResponse.json(
          { error: "NGO registration requires organization name, organization address, and contact person." },
          { status: 400 }
        );
      }
    }

    if (role === "volunteer") {
      if (!address || !phone) {
        return NextResponse.json(
          { error: "Volunteer registration requires phone number and location/address." },
          { status: 400 }
        );
      }
    }

    // 6. Check existing user
    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in instead." },
        { status: 409 }
      );
    }

    // 7. Hash password (never store plain-text)
    const passwordHash = await hashPassword(password);

    // 8. Build user profile
    const userId = `usr_${role}_${Date.now()}`;
    const formattedAddress = typeof address === "string"
      ? {
          street: address,
          city: "San Francisco",
          state: "CA",
          zipCode: "94103",
        }
      : address || {
          street: "General Service Area",
          city: "San Francisco",
          state: "CA",
          zipCode: "94102",
        };

    const newUser: StoredUser = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      passwordHash,
      role,
      address: formattedAddress,
      organizationName: organizationName || (role === "donor" ? name : undefined),
      donorCategory: role === "donor" ? (donorCategory || "Restaurant") : undefined,
      ngoRegistrationNumber: role === "ngo" ? `NGO-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
      ngoVerificationStatus: role === "ngo" ? "pending" : undefined,
      volunteerVehicleType: role === "volunteer" ? (volunteerVehicleType || "Bike") : undefined,
      createdAt: new Date().toISOString(),
    };

    createStoredUser(newUser);

    // 9. Create JWT session token
    const token = await signJWT({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    const safeUser = sanitizeUser(newUser);

    // 10. Set HTTP-only session cookie
    const response = NextResponse.json({
      message: "Registration successful",
      user: safeUser,
      destination: `/${safeUser.role}/dashboard`,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "An error occurred while creating your account. Please try again." },
      { status: 500 }
    );
  }
}
