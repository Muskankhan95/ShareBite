import { spawn } from "child_process";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("==========================================");
  console.log("   SHAREBITE AUTHENTICATION TEST SUITE   ");
  console.log("==========================================\n");

  const port = 3001;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`[1/6] Launching Next.js production server on port ${port}...`);
  const server = spawn("npx.cmd", ["next", "start", "-p", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  server.stdout.on("data", (d) => {
    // console.log(`[Server] ${d.toString().trim()}`);
  });
  server.stderr.on("data", (d) => {
    // console.error(`[Server Err] ${d.toString().trim()}`);
  });

  // Wait for server to become responsive
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      if (res.ok || res.status === 200) {
        ready = true;
        break;
      }
    } catch {
      await sleep(1000);
    }
  }

  if (!ready) {
    console.error("❌ Server failed to start in 30 seconds.");
    server.kill();
    process.exit(1);
  }
  console.log("✅ Server is up and accepting requests.\n");

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, message) {
    testsTotal++;
    if (condition) {
      console.log(`  ✓ ${message}`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  // --- TEST 1: REGISTRATION VALIDATION ---
  console.log("--- TEST 1: Registration Input Validation ---");
  {
    // Test missing fields
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Incomplete User" }),
    });
    assert(res.status === 400, "Rejects registration with missing required fields (HTTP 400)");

    // Test mismatched passwords
    const resMismatch = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test_mismatch@example.com",
        phone: "+15551234567",
        password: "password123",
        confirmPassword: "password_different",
        role: "donor",
      }),
    });
    const mismatchData = await resMismatch.json();
    assert(resMismatch.status === 400 && mismatchData.error.includes("Passwords do not match"), "Rejects mismatched passwords");

    // Test NGO missing organization fields
    const resNgoMissing = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "NGO Director",
        email: "ngo_incomplete@example.com",
        phone: "+15551234567",
        password: "password123",
        confirmPassword: "password123",
        role: "ngo",
      }),
    });
    assert(resNgoMissing.status === 400, "Rejects NGO registration missing organization address/contact person");
  }

  // --- TEST 2: SUCCESSFUL REGISTRATION FOR DONOR, NGO & VOLUNTEER ---
  console.log("\n--- TEST 2: Successful Registration for Roles ---");
  const uniqueId = Date.now();
  const testDonorEmail = `donor_${uniqueId}@test.org`;
  const testNgoEmail = `ngo_${uniqueId}@test.org`;
  const testVolEmail = `volunteer_${uniqueId}@test.org`;

  let donorCookie = "";
  {
    // 2a. Register Donor
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Chef Anthony",
        email: testDonorEmail,
        phone: "+1 555-888-0001",
        password: "securePassword123",
        confirmPassword: "securePassword123",
        role: "donor",
        organizationName: "Anthony's Woodfire Pizza",
        donorCategory: "Restaurant",
        address: "100 Broadway, San Francisco, CA",
      }),
    });
    const data = await res.json();
    donorCookie = res.headers.get("set-cookie") || "";
    assert(res.status === 200 && data.user.role === "donor", "Successfully registers Donor with destination /donor/dashboard");

    // 2b. Register NGO
    const resNgo = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Sister Beatrice",
        email: testNgoEmail,
        phone: "+1 555-888-0002",
        password: "securePassword123",
        confirmPassword: "securePassword123",
        role: "ngo",
        organizationName: "St. Anthony Food Bank",
        address: "245 Golden Gate Ave, San Francisco, CA",
        contactPerson: "Sister Beatrice",
      }),
    });
    const ngoData = await resNgo.json();
    assert(resNgo.status === 200 && ngoData.user.role === "ngo", "Successfully registers NGO with required org fields & destination /ngo/dashboard");

    // 2c. Register Volunteer
    const resVol = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Carlos Mendez",
        email: testVolEmail,
        phone: "+1 555-888-0003",
        password: "securePassword123",
        confirmPassword: "securePassword123",
        role: "volunteer",
        address: "700 Market St, San Francisco, CA",
        volunteerVehicleType: "Bike",
      }),
    });
    const volData = await resVol.json();
    assert(resVol.status === 200 && volData.user.role === "volunteer", "Successfully registers Volunteer with vehicle/address & destination /volunteer/dashboard");

    // 2d. Duplicate email rejection
    const resDup = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate Chef",
        email: testDonorEmail,
        phone: "+1 555-000-9999",
        password: "securePassword123",
        confirmPassword: "securePassword123",
        role: "donor",
      }),
    });
    assert(resDup.status === 409, "Rejects duplicate email registration (HTTP 409 Conflict)");
  }

  // --- TEST 3: LOGIN WITH PRE-SEEDED AND NEW USERS ---
  console.log("\n--- TEST 3: Authentication & Login ---");
  {
    // 3a. Invalid credentials
    const resBad = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "donor@sharebite.org",
        password: "WRONG_PASSWORD",
      }),
    });
    assert(resBad.status === 401, "Rejects incorrect password with HTTP 401");

    // 3b. Non-existent email
    const resNoUser = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent_user_9999@example.com",
        password: "password123",
      }),
    });
    assert(resNoUser.status === 401, "Rejects non-existent email with HTTP 401");

    // 3c. Pre-seeded Donor Login
    const resDonor = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "donor@sharebite.org",
        password: "password123",
      }),
    });
    const donorLoginData = await resDonor.json();
    assert(resDonor.status === 200 && donorLoginData.user.role === "donor" && donorLoginData.destination === "/donor/dashboard", "Logs in pre-seeded Donor → /donor/dashboard");

    // 3d. Pre-seeded NGO Login
    const resNgo = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "ngo@sharebite.org",
        password: "password123",
      }),
    });
    const ngoLoginData = await resNgo.json();
    assert(resNgo.status === 200 && ngoLoginData.user.role === "ngo" && ngoLoginData.destination === "/ngo/dashboard", "Logs in pre-seeded NGO → /ngo/dashboard");

    // 3e. Pre-seeded Volunteer Login
    const resVol = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "volunteer@sharebite.org",
        password: "password123",
      }),
    });
    const volLoginData = await resVol.json();
    assert(resVol.status === 200 && volLoginData.user.role === "volunteer" && volLoginData.destination === "/volunteer/dashboard", "Logs in pre-seeded Volunteer → /volunteer/dashboard");

    // 3f. Pre-seeded Admin Login
    const resAdmin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@sharebite.org",
        password: "password123",
      }),
    });
    const adminLoginData = await resAdmin.json();
    assert(resAdmin.status === 200 && adminLoginData.user.role === "admin" && adminLoginData.destination === "/admin/dashboard", "Logs in pre-seeded Admin → /admin/dashboard");

    // 3g. Newly Registered User Login
    const resNew = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testDonorEmail,
        password: "securePassword123",
      }),
    });
    assert(resNew.status === 200, "Logs in newly registered donor with hashed password verification");
  }

  // --- TEST 4: SESSION PERSISTENCE & ME ENDPOINT ---
  console.log("\n--- TEST 4: Session Persistence (/api/auth/me) ---");
  {
    // Login to get fresh cookie
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "donor@sharebite.org",
        password: "password123",
      }),
    });
    const cookieHeader = loginRes.headers.get("set-cookie") || "";

    // Verify session with cookie
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user && meData.user.email === "donor@sharebite.org", "Session persists and returns authenticated user profile via cookie");

    // Without cookie
    const noCookieRes = await fetch(`${baseUrl}/api/auth/me`);
    const noCookieData = await noCookieRes.json();
    assert(noCookieRes.status === 200 && noCookieData.user === null, "Unauthenticated request returns user: null");
  }

  // --- TEST 5: LOGOUT ---
  console.log("\n--- TEST 5: Logout ---");
  {
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST" });
    const setCookie = logoutRes.headers.get("set-cookie") || "";
    assert(logoutRes.status === 200 && (setCookie.includes("Max-Age=0") || setCookie.includes("auth_token=")), "Clears auth_token cookie on logout");
  }

  // --- TEST 6: PROTECTED ROUTES & ROLE-BASED ACCESS CONTROL ---
  console.log("\n--- TEST 6: Protected Routes & Role Authorization ---");
  {
    // 6a. Unauthenticated access to /admin/dashboard -> redirect to /login
    const unauthAdmin = await fetch(`${baseUrl}/admin/dashboard`, { redirect: "manual" });
    assert(
      unauthAdmin.status === 307 || unauthAdmin.status === 302,
      `Unauthenticated access to /admin/dashboard is blocked with redirect (HTTP ${unauthAdmin.status})`
    );

    // 6b. Login as Donor and get cookie
    const donorLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "donor@sharebite.org", password: "password123" }),
    });
    const donorCookie = donorLogin.headers.get("set-cookie") || "";

    // 6c. Donor accessing /donor/dashboard -> ALLOWED (HTTP 200)
    const donorAccessOwn = await fetch(`${baseUrl}/donor/dashboard`, {
      headers: { Cookie: donorCookie },
    });
    assert(donorAccessOwn.status === 200, "Donor can access /donor/dashboard (HTTP 200)");

    // 6d. Donor trying to access /admin/dashboard -> BLOCKED & REDIRECTED to /donor/dashboard!
    const donorAccessAdmin = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Cookie: donorCookie },
      redirect: "manual",
    });
    const location = donorAccessAdmin.headers.get("location") || "";
    assert(
      (donorAccessAdmin.status === 307 || donorAccessAdmin.status === 302) && location.includes("/donor/dashboard"),
      `Donor blocked from /admin/dashboard and redirected to /donor/dashboard (Location: ${location})`
    );

    // 6e. Donor trying to access /ngo/dashboard -> BLOCKED & REDIRECTED
    const donorAccessNgo = await fetch(`${baseUrl}/ngo/dashboard`, {
      headers: { Cookie: donorCookie },
      redirect: "manual",
    });
    assert(
      donorAccessNgo.status === 307 || donorAccessNgo.status === 302,
      "Donor blocked from /ngo/dashboard with role-enforcement redirect"
    );

    // 6f. Volunteer trying to access /donor/create -> BLOCKED
    const volLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "volunteer@sharebite.org", password: "password123" }),
    });
    const volCookie = volLogin.headers.get("set-cookie") || "";

    const volAccessDonor = await fetch(`${baseUrl}/donor/create`, {
      headers: { Cookie: volCookie },
      redirect: "manual",
    });
    assert(
      volAccessDonor.status === 307 || volAccessDonor.status === 302,
      "Volunteer blocked from /donor/create with role-enforcement redirect"
    );
  }

  console.log("\n==========================================");
  console.log(`TEST SUMMARY: ${testsPassed} / ${testsTotal} assertions passed.`);
  console.log("==========================================");

  server.kill();
  process.exit(testsPassed === testsTotal ? 0 : 1);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
