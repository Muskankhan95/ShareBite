import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, sanitizeUser } from "@/lib/db/user-store";
import { comparePassword } from "@/lib/auth/password";
import { signJWT } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Validate presence
    if (!email || !password) {
      return NextResponse.json(
        { error: "Please provide both email and password." },
        { status: 400 }
      );
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 3. Find user
    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password. Please verify your credentials and try again." },
        { status: 401 }
      );
    }

    // 4. Verify password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password. Please verify your credentials and try again." },
        { status: 401 }
      );
    }

    // 5. Generate JWT token
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const safeUser = sanitizeUser(user);

    // 6. Set HTTP-only session cookie
    const response = NextResponse.json({
      message: "Login successful",
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
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
