# NestJS Backend Integration for MediGo Admin Dashboard

Convert the frontend-heavy React app into a proper full-stack application by adding a NestJS backend that acts as an API layer between the frontend and Firebase.

## User Review Required

> [!IMPORTANT]
> **Firebase Auth stays client-side** — Login/register/signout will continue using the Firebase JS SDK directly in the browser. Moving auth server-side would require token-based session management and significantly more work. The backend will accept Firebase ID tokens for authorization on API routes.

> [!WARNING]
> **Real-time features**: Firebase RTDB `onValue` listeners currently give the frontend live updates. The NestJS backend will use **Server-Sent Events (SSE)** to preserve this real-time behavior for driver locations, transfer requests, and fleet data. This is simpler than WebSockets and works natively with `EventSource` in the browser.

## Proposed Changes

### NestJS Backend (new `server/` directory)

#### [NEW] `server/` — NestJS application

A new `server/` directory at the MediGo root level with the following module structure:

| Module | Endpoints | Firebase Path | Current Frontend File |
|---|---|---|---|
| **TransfersModule** | `GET /api/transfers` (SSE), `POST /api/transfers`, `GET /api/transfers/:id` | `transfer_requests` | [HospitalDashboard.tsx](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/pages/HospitalDashboard.tsx), [TransferRequest.tsx](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/pages/TransferRequest.tsx) |
| **DriversModule** | `GET /api/drivers/locations` (SSE), `GET /api/drivers/:id` | `driver_locations` | [useDriverLocations.ts](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/useDriverLocations.ts), [HospitalDashboard.tsx](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/pages/HospitalDashboard.tsx) |
| **FleetModule** | `GET /api/fleet/ambulances` (SSE), CRUD for ambulances/drivers/transfers | `hospitals/{uid}/*` | [useFleetData.ts](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/hooks/useFleetData.ts) |
| **PatientsModule** | `GET /api/patients` (SSE), `POST/PUT /api/patients/:id` | `transfer_requests`, `patient_records` | [PatientRecords.tsx](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/pages/PatientRecords.tsx) |
| **AnalyticsModule** | `GET /api/analytics` | `transfer_requests`, `driver_locations` | [useAnalyticsData.ts](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/hooks/useAnalyticsData.ts) |
| **AuthModule** | Firebase Admin SDK middleware to verify ID tokens | — | [App.tsx](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/App.tsx), [useAuth.ts](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/hooks/useAuth.ts) |

Key files:
- `server/src/main.ts` — Bootstrap, CORS, port 3001
- `server/src/app.module.ts` — Root module
- `server/src/firebase/firebase.service.ts` — Firebase Admin SDK singleton
- `server/src/auth/auth.guard.ts` — Validates Firebase ID tokens from `Authorization: Bearer <token>`
- One controller + service per module above

---

### Frontend Changes (existing `admin-dash/`)

#### [NEW] `src/api/apiClient.ts`
Centralized HTTP client (fetch wrapper) that:
- Attaches Firebase ID token as `Authorization: Bearer <token>` header
- Points to `http://localhost:3001/api`

#### [MODIFY] [src/hooks/useFleetData.ts](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/hooks/useFleetData.ts)
Replace all direct Firebase RTDB calls with API calls via `apiClient`. Use SSE (`EventSource`) for real-time fleet updates instead of `onValue`.

#### [MODIFY] [src/hooks/useAnalyticsData.ts](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/hooks/useAnalyticsData.ts)
Replace Firebase reads with `GET /api/analytics`.

#### [MODIFY] [src/useDriverLocations.ts](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/useDriverLocations.ts)
Replace `onValue` listener with SSE from `GET /api/drivers/locations`.

#### [MODIFY] [src/pages/HospitalDashboard.tsx](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/pages/HospitalDashboard.tsx)
Replace direct Firebase `onValue`/[get](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/pages/AmbulanceFleet.tsx#205-212) calls with API calls for transfers and driver details.

#### [MODIFY] [src/pages/TransferRequest.tsx](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/pages/TransferRequest.tsx)
Replace `push`/[set](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/pages/DriverProfiles.tsx#433-435) to Firebase with `POST /api/transfers`.

#### [MODIFY] [src/pages/PatientRecords.tsx](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/pages/PatientRecords.tsx)
Replace Firebase CRUD with API calls.

#### [KEEP AS-IS] Auth files
[useAuth.ts](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/hooks/useAuth.ts), [LoginPage.tsx](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/components/auth/LoginPage.tsx), [RegisterPage.tsx](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/components/auth/RegisterPage.tsx), [Settings.tsx](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/pages/Settings.tsx), [App.tsx](file:///c:/Users/Anupa%20Vitharana/Documents/IIT/IIT/IIT%20Year2/Sem1/SDGP/WebApp/MediGo/admin-dash/src/App.tsx) — keep using Firebase Auth client SDK directly. Only add token-fetching for API auth headers.

## Verification Plan

### Automated
- `npm run start:dev` in `server/` — verify NestJS starts on port 3001
- `npm run dev` in `admin-dash/` — verify Vite frontend still works on port 5173
- Test each API endpoint with curl/browser

### Manual (browser)
1. Login → dashboard loads with live map, transfer data from API
2. Create a transfer request → verify it appears in dashboard
3. Fleet page → CRUD ambulances/drivers works
4. Patient records → view/edit works
5. Analytics → charts load
6. Driver popup on map → still works
