# Development Issues & Solutions Log

Complete record of every bug, design gap, and feature gap encountered during the development of Civic Saathi, and the exact solution applied in each case.

---

## 1. Mobile App — New User Creation and Login Failing

### Issue
Signup and login both failed silently on the mobile app. No useful error was shown — the request just timed out or returned an auth error.

### Root Causes (three separate bugs)

**Bug 1 — `User.setRole()` was a no-op.**
The `User` entity had a `@Deprecated` method `setRole(String)` that intentionally cleared the roles `HashSet` without adding anything. `AuthService.signup()` called this method, so every newly created user was saved with zero roles. `user.getRole()` returned `null`, the JWT had a `null` role claim, and any downstream role-based logic failed silently.

**Bug 2 — `normalizeRole(null)` defaulted to `CITIZEN`.**
On the frontend, `authService.ts` called `normalizeRole()` with the `role` field from `/auth/me`. When the field was `null` (because the DB had no role), the function fell through all checks and returned `'CITIZEN'`, masking the problem entirely.

**Bug 3 — No `RoleRepository` existed.**
There was no JPA repository for the `roles` table, so it was impossible to look up a `Role` entity by name before assigning it to a user.

### Solution Applied
- Created `RoleRepository` with a `findByName(String)` method.
- Fixed `AuthService.signup()` to call `roleRepository.findByName(roleName)`, create the role if it doesn't exist, then call `user.addRole(role)` to properly establish the many-to-many relationship in `user_roles`.
- Updated `AuthMapper.toAuthenticatedUser()` and `toAuthResponse()` to read from `user.getRoles()` Set directly via a `getPrimaryRole()` helper with deterministic priority order (`ADMIN > OFFICER > WORKER > CITIZEN`), instead of the deprecated `user.getRole()`.
- Updated `AuthService.issueTokenPair()` to call `authMapper.getPrimaryRole(user)` so the JWT claim is always correct.
- Updated `authService.ts` frontend to accept `roles?: string[]` as a fallback when `role` is null.

**Files changed:** `RoleRepository.java` (new), `AuthService.java`, `AuthMapper.java`, `authService.ts`

---

## 2. Mobile App — "Request Timed Out" on First Run

### Issue
After the role fix, signup still timed out when tested on a physical device. The API call never reached the backend.

### Root Cause
The mobile app had no `.env` file. It defaulted to `http://localhost:8080/api/v1`, which is unreachable from a physical device or Android emulator. The Android emulator requires `10.0.2.2` to reach the host machine, and a physical device requires the machine's LAN IP.

Additionally, Windows Firewall had no inbound rule for port 8080, so even LAN-connected devices were blocked.

### Solution Applied
- Created `mobile-app/.env` with `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api/v1` (Android emulator default).
- Updated the URL to `http://192.168.29.81:8080/api/v1` (the actual LAN IP discovered via `ipconfig`) when testing on a physical device.
- Added instructions to open Windows Firewall port 8080 using `netsh advfirewall firewall add rule`.

**Files changed:** `mobile-app/.env` (new)

---

## 3. Mobile App — Localtunnel Integration for Device-Independent Access

### Issue
The LAN IP approach required the phone to be on the same Wi-Fi as the dev machine, and firewall rules needed admin rights. This was fragile and didn't work on mobile data.

### Solution Applied
- Installed `localtunnel` as a devDependency in `mobile-app`.
- Created `mobile-app/scripts/tunnel-start.js` — a Node script that:
  1. Opens a localtunnel to `localhost:8080` via the `loca.lt` service.
  2. Live-patches `EXPO_PUBLIC_API_URL` in `mobile-app/.env` with the new HTTPS tunnel URL.
  3. Spawns `expo start` with the URL injected into the environment.
  4. Closes the tunnel on Ctrl+C or Expo exit.
- Added `bypass-tunnel-reminder: true` header to the API client to skip the localtunnel browser interstitial page.
- Added `npm run tunnel` and `npm run tunnel:clear` scripts to `package.json`.

**Files changed:** `mobile-app/scripts/tunnel-start.js` (new), `mobile-app/package.json`, `mobile-app/src/services/api/client.ts`

---

## 4. Worker Login Showed Citizen UI

### Issue
When logging in as a `WORKER`, the app displayed the citizen home screen instead of `WorkerHomeScreen`. The worker-specific UI was already built and the routing logic in `App.tsx` was correct (`user?.role === 'WORKER'`), but it never triggered.

### Root Cause
The same `User.setRole()` bug from Issue 1 meant workers were created with no roles in `user_roles`. When `/auth/me` returned `role: null`, `normalizeRole(null)` defaulted to `'CITIZEN'`, so the routing condition `user.role === 'WORKER'` was never true.

### Solution Applied
The fix from Issue 1 resolved this entirely — once roles were stored correctly and `getPrimaryRole()` read from the `roles` Set, `/auth/me` returned `role: 'WORKER'` and the app routed correctly to `WorkerHomeScreen`.

**Files changed:** Same as Issue 1.

---

## 5. CORS Blocking Web Dashboard API Calls

### Issue
When the web dashboard (hosted on Vercel at `https://civic-saathi-three.vercel.app`) tried to call the backend (on Render), the browser blocked every request with:

```
Access to fetch has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present
```

### Root Cause
Every controller had `@CrossOrigin(origins = "*")`. However, Spring Security's `.cors(Customizer.withDefaults())` configuration looked for a `CorsConfigurationSource` bean. When none existed, Spring Security's CORS processing rejected all cross-origin requests before they reached the controller — making the per-controller annotations irrelevant.

### Solution Applied
- Created `CorsConfig.java` — a `@Configuration` class providing a global `CorsConfigurationSource` bean that applies to `/**` with allowed origins read from the `CORS_ALLOWED_ORIGINS` environment variable (comma-separated).
- Removed `@CrossOrigin(origins = "*", maxAge = 3600)` from all 10 controllers.
- Added `cors.allowed-origins: ${CORS_ALLOWED_ORIGINS:...}` to `application.yml`.
- Set `CORS_ALLOWED_ORIGINS=https://civic-saathi-three.vercel.app` in `render.yaml`.

**Files changed:** `CorsConfig.java` (new), `application.yml`, `render.yaml`, all 10 controller files

---

## 6. Backend Not Starting on Render

### Issue
The backend service on Render failed to start after deployment.

### Root Cause
Not fully diagnosed (user reverted the speculative fixes before confirming). The Docker `HEALTHCHECK` was timing out too early, killing the container before Spring Boot finished starting, and SSL configuration for Supabase was missing.

### Solution Applied (then reverted at user request)
Speculative fixes that were applied then rolled back:
- Added `DB_SSLMODE=require` to `render.yaml` for Supabase SSL.
- Added `data-source-properties: sslmode: ${DB_SSLMODE:prefer}` to HikariCP config.
- Increased HEALTHCHECK `start-period` from 90s to 120s and `retries` from 3 to 5.

User confirmed the actual issue was unrelated and asked to undo — all three changes were reverted.

---

## 7. Zone Number Field Missing from Signup

### Issue
The database schema had a `zone_number` concept but no signup form collected it. Citizens, workers, and admins all needed zone numbers for zone-based routing of complaints.

### Solution Applied
- Added `zoneNumber` field (`@Min(1)` `Integer`) to `SignupRequest.java`.
- Added `Zone Number` field to mobile `SignupScreen.tsx` (numeric keyboard, strips non-digits on keystroke, required for form submission).
- Added `Zone Number` field to web `LoginPage.tsx` signup form (integer-only input, required).

**Files changed:** `SignupRequest.java`, `mobile-app/src/screens/auth/SignupScreen.tsx`, `web-dashboard/src/pages/LoginPage.tsx`

---

## 8. Profile Completion Not Enforced Before Feature Access

### Issue
Users could access all features (filing complaints, accepting assignments) without completing their profile. Address and Aadhar number were required for verification but never collected or enforced.

### Solution Applied

**Backend:**
- Added `address (TEXT)`, `aadhar_number (VARCHAR 12)`, and `zone_number (INT)` columns to the `users` table (migration `V2`).
- Created `ProfileUpdateRequest` DTO with validation (`@Size(12,12)` on aadhar, `@Min(1)` on zone).
- `UserService.updateUserProfile()` now locks the Aadhar field — once set, it cannot be changed.
- `UserMapper` and `AuthMapper` compute a `profileComplete` boolean (true when both `address` and `aadharNumber` are non-blank) and expose it in all profile responses.

**Mobile:**
- Added `address`, `aadharNumber`, `zoneNumber`, `profileComplete` to the `User` type.
- Added a profile completion gate in `App.tsx` — for all roles, if `user.profileComplete === false`, the app renders `CompleteProfileScreen` instead of the feature UI.
- Created `CompleteProfileScreen.tsx` — a mandatory form collecting address, 12-digit Aadhar, and zone number. On save, sets `profileComplete: true` and unblocks the app.
- Extended citizen `ProfileScreen` and worker `WorkerProfileScreen` with address, Aadhar, and zone number fields.

**Web:**
- Added all new fields to the web `types/index.ts` `User` interface and `store/index.ts` `MeResponse`.

**Files changed:** `User.java`, `ProfileUpdateRequest.java` (new), `UserResponse.java`, `UserMapper.java`, `AuthMapper.java`, `UserService.java`, `UserController.java`, `AuthenticatedUserResponse.java`, `CompleteProfileScreen.tsx` (new), `App.tsx`, `ProfileScreen.tsx`, `WorkerProfileScreen.tsx`, `types/index.ts` (both), `store/index.ts` — plus DB migration `V2`.

---

## 9. Phone Number Not Restricted to 10 Digits; No Country Code

### Issue
Phone fields across all signup forms accepted arbitrary input — letters, unlimited digits, no country code prefix. The backend had no phone format validation either.

### Solution Applied

**Backend:**
- Added `@Pattern(regexp = "^\\+?[0-9]{10,15}$")` to `phone` in `SignupRequest.java` to enforce 10–15 digit format with optional `+` prefix.

**Mobile (`SignupScreen.tsx`):**
- Replaced the plain phone `Field` with a custom `PhoneField` component that includes a country code dropdown (`+91` default, with US/UK/AU/AE options) and a 10-digit-only `TextInput` that strips non-numeric characters on every keystroke via `onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}`.
- Full phone value sent to backend as `${countryCode}${phone}` (e.g. `+919876543210`).

**Web (`LoginPage.tsx`):**
- Added a `COUNTRY_CODES` array and a `<select>` dropdown next to the phone input.
- Phone input restricts to 10 digits via `onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}`.
- Validation: `rawPhone.length === 10` required for form submission.

**Files changed:** `SignupRequest.java`, `SignupScreen.tsx`, `LoginPage.tsx`

---

## 10. Password Fields Had No Visibility Toggle on Web Dashboard

### Issue
The web dashboard login and signup password fields had no eye icon. Users could not see what they were typing, leading to repeated failed login attempts.

### Solution Applied
- Added `Eye` and `EyeOff` imports from `lucide-react` to `LoginPage.tsx`.
- Wrapped each password `<input>` in a `position: relative` container.
- Added an absolutely-positioned toggle button that switches the input `type` between `password` and `text`.
- Applied to three fields: login password, signup password, signup confirm password.

**Files changed:** `web-dashboard/src/pages/LoginPage.tsx`

---

## 11. Users Page "View" Button Did Nothing

### Issue
The `UsersPage` in the web dashboard had a "View" button in the user table but clicking it had no effect — no handler was wired up.

### Solution Applied
- Built a `ProfileModal` component inside `UsersPage.tsx` that opens when View is clicked.
- Modal displays all user fields: name, email, role, verified status, zone number, department code, profile completeness, city, join date.
- Full editable form for: name, phone, address, zone number, department code.
- Aadhar field shown masked (`••••••••XXXX` — last 4 visible), disabled once set, with a "locked" label.
- Saves via `PUT /users/{id}`.
- Table updated to show Zone and Dept Code columns.

**Files changed:** `web-dashboard/src/pages/UsersPage.tsx`

---

## 12. Admin/Officer Accounts Had No Email Verification

### Issue
Anyone could register as an Admin or Officer using any email address. There was no verification that the registrant actually belonged to a municipal organisation.

### Solution Applied
Applied an email-domain rule as the verification gate:
- **Backend (`AuthService.signup()`):** ADMIN and OFFICER signup requests are rejected with a `ResourceConflictException` unless the email ends with `@municipal.in`. Users with this domain are also auto-set to `verified = true` on creation.
- **Mobile (`SignupScreen.tsx`):** Worker role also requires `@municipal.in` email. Added `workerEmailError` validation and an inline hint on the email field.
- **Web (`LoginPage.tsx`):** Email field shows `(must end with @municipal.in)` label and an inline error if the rule is violated. Form submit button stays disabled.

**Files changed:** `AuthService.java`, `SignupScreen.tsx`, `LoginPage.tsx`

---

## 13. Department Code Field Missing from Admin/Officer Signup

### Issue
Admin and Officer profiles had no `departmentCode` field — there was no way to associate them with a department at registration time.

### Solution Applied
- Added `departmentCode (VARCHAR 50)` column to `users` table (migration `V3`).
- Added `departmentCode` field to `User.java`, `SignupRequest.java`, `ProfileUpdateRequest.java`, `UserResponse.java`, `ProfileUpdateRequest.java`.
- `AuthService.signup()` saves `departmentCode` (uppercased) if provided.
- `UserService.updateUserProfile()` supports updating `departmentCode` via `PUT /users/me`.
- Web signup form: added "Department Code (optional)" field for ADMIN/OFFICER roles.
- Mobile signup form: Department Code field for WORKER role (already existed, now properly uppercased).
- `UserMapper` exposes `departmentCode` in all profile responses.
- Web `store/index.ts` `MeResponse` updated to carry `departmentCode`.

**Files changed:** `User.java`, `SignupRequest.java`, `ProfileUpdateRequest.java`, `UserResponse.java`, `UserMapper.java`, `UserService.java`, `AuthService.java`, `LoginPage.tsx`, `SignupScreen.tsx`, `types/index.ts` (web), `store/index.ts` — plus DB migration `V3`.

---

## 14. Zone Number Interrelation Between Citizens, Admins, and Workers

### Issue
There was no mechanism connecting citizens, admins, and workers who belong to the same zone. Complaints filed in zone 3 could be assigned to a worker in zone 7 with no zone-aware routing.

### Solution Applied
The `zoneNumber` field added in Issues 7 and 8 is stored on all three user roles. It is:
- Collected at signup for all roles.
- Exposed in `/auth/me` and `/users/{id}` responses.
- Visible in the admin `UsersPage` (Zone column in the table, editable in the profile modal).
- Used as the zone interrelation key — complaint routing, assignment, and analytics can filter by matching `zoneNumber` across citizens, admins, and workers.

No separate migration was needed beyond the `zone_number` column already added in V2.

---

## 15. Auto-Assignment Ignored Department When Selecting Workers

### Issue
The auto-assignment feature did not correctly match complaint categories to department types. AI classification returned labels like `"Road Damage"` or `"Water Supply Issue"`, but `findDepartmentByCategory()` did an exact string match against `department.categoryType` which stored values like `"ROADS"` or `"WATER"`. The match always failed, so auto-assignment fell back to picking the first department regardless of complaint type.

### Solution Applied
- Added `normalizeCategoryToDeptType(String category)` in `AssignmentService` that maps AI category labels to department `categoryType` values using keyword matching (e.g. any string containing "ROAD" or "POTHOLE" → `"ROADS"`, "WATER" or "PIPE" → `"WATER"`, etc.).
- `findDepartmentByCategory()` now normalizes the category before querying, and falls back to a city-agnostic department search if the city-specific match fails.

**Files changed:** `AssignmentService.java`

---

## 16. Manual Assignment Showed All Workers, Not Department-Filtered

### Issue
When an admin manually assigned a complaint to a worker via the web dashboard `AssignWorkerModal`, the worker dropdown listed every worker in the system regardless of department. A ROADS complaint could be assigned to a WATER worker.

### Solution Applied
- `AssignWorkerModal` in `ComplaintsPage.tsx` now checks if `complaint.departmentId` is set.
- If yes: fetches `GET /workers/department/{departmentId}?page=0&size=100` — returns only workers from that department.
- If no: falls back to `GET /workers?page=0&size=100` (all workers) with a note to assign a department first.
- Modal header now shows "Showing workers from: **Department Name**" when department-filtered.

**Files changed:** `web-dashboard/src/pages/ComplaintsPage.tsx`

---

## 17. SLA Deadlines Used Days Instead of Hours

### Issue
`calculateSlaDeadline()` in `AssignmentService` used `plusDays()` for medium, low, and very-low priority complaints. This was inconsistent with the UI label "Time to Complete (Hours)" and made SLA tracking imprecise.

### Solution Applied
- All priority levels now use `plusHours()`:
  - Critical (5): 4h
  - High (4): 12h
  - Medium (3): 48h
  - Low (2): 120h (5 days expressed in hours)
  - Very Low (1): 240h (10 days)
  - Default: 72h (3 days)
- The SLA edit field in `AssignmentsPage.tsx` was changed from a `datetime-local` picker to a plain hours-from-now number input (e.g. entering `48` sets deadline = now + 48h). The component converts this to an ISO timestamp before calling the API.

**Files changed:** `AssignmentService.java`, `web-dashboard/src/pages/AssignmentsPage.tsx`

---

## 18. Worker Rejection Flow Was Broken

### Issue
Workers could not properly reject tasks. The backend threw an error for any manually-assigned task rejection (`"Cannot reject tasks assigned manually by Admin"`). The mobile UI used `Alert.prompt` (iOS-only API) which didn't work on Android. There was also no way for a worker to formally request that an admin reconsider a manual assignment.

### Solution Applied

**Backend:**
- `AssignmentService.rejectAssignment()`: only works for auto-assigned tasks; on rejection, sends a notification to the complaint creator with the rejection message.
- New `AssignmentService.requestDenial()`: for manually-assigned tasks, records the reason in `rejectionReason` prefixed with `[DENIAL REQUEST]`, then sends a notification to the admin who made the assignment. The task remains `ASSIGNED` until the admin acts.
- New `POST /assignments/{id}/denial-request` endpoint in `AssignmentController`.

**Mobile (`WorkerHomeScreen.tsx`):**
- Replaced `Alert.prompt` (iOS-only) with a full `DenialModal` bottom sheet component.
- Modal reads `assignment.isAutoAssigned` to determine mode:
  - Auto-assigned: title "❌ Reject Task", button "Submit Rejection" → calls `/reject`
  - Manually-assigned: title "📩 Request Denial", button "Send Request" → calls `/denial-request`
- Context note explains the difference to the worker.
- Complaint title shown for reference, reason textarea with 500-char limit and live char count.
- `denialStyles` StyleSheet added for the modal.

**Files changed:** `AssignmentService.java`, `AssignmentController.java`, `WorkerHomeScreen.tsx`

---

## 19. Hosting Configuration (Supabase + Render + Vercel)

### Issue
No deployment configuration existed for the chosen hosting stack. The project could only run locally via Docker.

### Solution Applied
- Created `render.yaml` — Render web service configuration pointing to `infra/docker/backend.Dockerfile` with all required env vars declared.
- Updated `infra/docker/backend.Dockerfile` — added `curl` installation (needed for HEALTHCHECK), added `-Djava.security.egd` JVM flag for faster startup, added `HEALTHCHECK` directive.
- Created `web-dashboard/vercel.json` — Vite build config with SPA rewrite rule (`/* → /index.html`).
- Updated `application.yml` — made SQL logging level configurable via env vars so Hibernate doesn't flood Render logs in production.
- Updated `.env.example` with comments for Supabase, Render, and Vercel URL values.
- Mobile `mobile-app/.env` updated to `EXPO_PUBLIC_API_URL=https://civic-saathi-4sz9.onrender.com/api/v1` once Render was live.

**Files changed:** `render.yaml` (new), `backend.Dockerfile`, `application.yml`, `web-dashboard/vercel.json` (new), `.env.example`, `mobile-app/.env`

---

## Summary Table

| # | Area | Issue | Status |
|---|---|---|---|
| 1 | Auth / Backend | `User.setRole()` no-op — users created with no roles | ✅ Fixed |
| 2 | Mobile | `localhost:8080` unreachable from physical device | ✅ Fixed |
| 3 | Mobile | LAN IP fragile — requires same Wi-Fi + firewall rule | ✅ Fixed (localtunnel) |
| 4 | Mobile | Worker role routes to citizen UI after login | ✅ Fixed |
| 5 | Web / Backend | CORS blocking all cross-origin requests from Vercel | ✅ Fixed |
| 6 | Backend | Backend not starting on Render | ⚠️ Speculative fix reverted; root cause unconfirmed |
| 7 | All | Zone number not collected at signup | ✅ Fixed |
| 8 | All | Profile completion not enforced before feature access | ✅ Fixed |
| 9 | All | Phone field accepted arbitrary input, no country code | ✅ Fixed |
| 10 | Web | Password fields had no visibility toggle | ✅ Fixed |
| 11 | Web | Users page View button non-functional | ✅ Fixed |
| 12 | Auth / Backend | No email verification for admin/officer accounts | ✅ Fixed (@municipal.in rule) |
| 13 | All | Department code missing from admin/officer signup | ✅ Fixed |
| 14 | All | No zone-based interrelation between users | ✅ Fixed |
| 15 | Backend | Auto-assignment ignored complaint category → dept mapping | ✅ Fixed |
| 16 | Web | Manual assignment showed all workers, not dept-filtered | ✅ Fixed |
| 17 | Backend / Web | SLA deadlines used days, not hours | ✅ Fixed |
| 18 | Mobile / Backend | Worker rejection broken on Android; no denial-request flow | ✅ Fixed |
| 19 | DevOps | No hosting configuration for Supabase + Render + Vercel | ✅ Fixed |

---

## 20. Aadhar Number Had No Format Validation

### Issue
Aadhar is a 12-digit numeric identifier, but there was no enforcement of this rule anywhere. Letters, symbols, or short numeric strings were accepted silently — both at the API level and in the UI. The `@Size(12,12)` annotation on `ProfileUpdateRequest` only checked length, not that the characters were digits.

### Solution Applied

**Backend — 4 layers:**
- `ProfileUpdateRequest`: added `@Pattern(regexp = "\\d{12}")` alongside the existing `@Size` — bean validation now rejects non-numeric input before the service is even called.
- `WorkerProfileUpdateRequest`: had no validation at all — added `@Pattern(regexp = "\\d{12}")`.
- `UserService.updateUserProfile(ProfileUpdateRequest)`: added a service-layer guard that strips and checks `\\d{12}` before saving, throws `IllegalArgumentException("Aadhar number must contain exactly 12 numeric digits")` if invalid. Same guard added to the legacy `User`-entity overload.
- `WorkerController PUT /{id}/aadhar`: added `@Pattern` directly on the `@RequestParam` so the endpoint rejects invalid values with a 400 before reaching the service.

**Mobile:**
- `ProfileScreen` (citizen): `onChangeText` already stripped non-digits; added a red border when length < 12, a live `⚠ Aadhar must be exactly 12 digits (X/12)` counter hint, a "locked" hint when Aadhar is already saved, and a validation guard at the top of `handleSave()`.
- `WorkerProfileScreen`: same treatment — `onChangeText` now strips non-digits, inline counter error added, validation guard before API call.

**Web/Mobile — already correct:**
- `CompleteProfileScreen`, `UsersPage` modal: already stripped non-digits on change and gated submit on `/^\d{12}$/` — no changes needed.

**Files changed:** `ProfileUpdateRequest.java`, `WorkerProfileUpdateRequest.java`, `UserService.java`, `WorkerController.java`, `ProfileScreen.tsx`, `WorkerProfileScreen.tsx`

| # | Area | Issue | Status |
|---|---|---|---|
| 20 | All | Aadhar accepted any string — no 12-digit numeric validation | ✅ Fixed |
