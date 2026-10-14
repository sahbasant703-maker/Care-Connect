# Online Healthcare Management System - Progress Tracker

**Project Start Date:** 2026-09-20
**Last Updated:** 2026-10-11

---

## Overview

This document tracks the development progress of the Online Healthcare Management System. Update this file after completing any module or significant task.

---

## ✅ Completed Tasks

### 1. Project Setup & Documentation (2026-09-20)
- [x] Created `AGENTS.md` with mandatory coding standards reference
- [x] Created folder structure for backend and frontend
- [x] Documented project standards from `__DOC__/docs/`

### 2. Backend - Spring Boot Project Structure (2026-09-20)
- [x] Maven `pom.xml` with all dependencies:
  - Spring Boot 3.3.2 (Web, Data JPA, Security, Validation)
  - PostgreSQL driver
  - JWT (jjwt 0.12.6)
  - BCrypt (spring-security-crypto)
  - Swagger/OpenAPI (springdoc 2.6.0)
  - Lombok
- [x] Main application class `HealthcareApplication.java`
- [x] Configuration `application.yml` (port 8080, PostgreSQL, JWT, Swagger)
- [x] Folder structure created:
  ```
  server/src/main/java/com/healthcare/
  ├── controller/
  ├── service/
  ├── repository/
  ├── entity/
  ├── dto/
  ├── security/
  └── config/
  ```

### 3. Backend - Entity Layer (2026-09-20)
All entities follow `tbl` prefix naming convention per standards:

- [x] **User** (`tblUsers`) - Base user with roles (ADMIN, DOCTOR, PATIENT)
- [x] **Doctor** (`tblDoctors`) - Doctor profile linked to User
- [x] **Patient** (`tblPatients`) - Patient profile linked to User
- [x] **Appointment** (`tblAppointments`) - Doctor-Patient appointments with status enum
- [x] **MedicalRecord** (`tblMedicalRecords`) - Medical records linked to appointments

All entities include:
- JPA annotations with proper relationships
- Lombok annotations (@Getter, @Setter, @Builder, etc.)
- Audit timestamps (@CreationTimestamp, @UpdateTimestamp)
- Class-level and field documentation

### 4. Backend - Repository Layer (2026-09-20)
- [x] **UserRepository** - findByEmail, existsByEmail
- [x] **DoctorRepository** - findByUser, findBySpecialization, findByIsAvailableTrue
- [x] **PatientRepository** - findByUser
- [x] **AppointmentRepository** - pagination, date-based queries, upcoming appointments
- [x] **MedicalRecordRepository** - findByDoctor, findByPatient, findByAppointment

### 5. Backend - DTO Layer (2026-09-20)
Following "never expose entities directly" rule:

- [x] **AuthDTOs** - LoginRequest, RegisterPatientRequest, LoginResponse, RefreshTokenRequest
- [x] **DoctorDTOs** - CreateDoctorRequest, UpdateDoctorRequest, DoctorResponse, ScheduleSlotRequest/Response
- [x] **PatientDTOs** - PatientProfileResponse, UpdatePatientProfileRequest, PatientListItemResponse
- [x] **AppointmentDTOs** - BookAppointmentRequest, UpdateAppointmentStatusRequest, CancelAppointmentRequest, AppointmentResponse, AppointmentListItemResponse
- [x] **MedicalRecordDTOs** - CreateMedicalRecordRequest, MedicalRecordResponse, MedicalRecordListItemResponse

All DTOs include Jakarta Validation annotations.

### 6. Frontend - React Project Structure (2026-09-20)
- [x] `package.json` with React 18, Vite, React Router, Axios
- [x] `vite.config.js` with API proxy to backend (port 8080)
- [x] `index.html` entry point
- [x] `src/main.jsx` - App entry with BrowserRouter
- [x] `src/App.jsx` - Routes with role-based protection
- [x] Folder structure:
  ```
  clinet/src/
  ├── pages/
  ├── components/
  ├── services/
  ├── layouts/
  ├── utils/
  └── styles/
  ```

### 7. Frontend - Core Services (2026-09-20)
- [x] **api.js** - Axios instance with JWT interceptor, auto token refresh
- [x] **authContext.jsx** - AuthContext + useAuth hook with localStorage persistence

### 8. Frontend - Global Styles (2026-09-20)
- [x] `styles/index.css` - Complete design system with:
  - CSS variables for colors, spacing, shadows, radius
  - Form, button, card, table, badge, alert components
  - Utility classes (flex, grid, spacing, typography)
  - Responsive breakpoints

### 9. Frontend - Pages (2026-09-20)
- [x] **Login.jsx** - Email/password form with validation, role-based redirect
- [x] **PatientDashboard.jsx** - Stats cards, upcoming appointments table
- [x] **DoctorDashboard.jsx** - Today's appointments, schedule, patient records
- [x] **AdminDashboard.jsx** - Stats overview, doctors/patients/appointments tables

---

## ✅ Completed Tasks

### 10. Backend - Security & Auth Module (2026-09-20)
- [x] **JwtUtil** - token generation (access + refresh), validation, claims extraction, HS256
- [x] **JwtAuthenticationFilter** - extracts Bearer token, validates, sets SecurityContext
- [x] **SecurityConfig** - stateless JWT, permitAll `/auth/**` + Swagger, role-based `/api/admin/**`, `/api/doctor/**`, `/api/patient/**`
- [x] **BCryptPasswordEncoder** bean
- [x] **GlobalExceptionHandler** - standard error format per project standards
- [x] **ApiResponse** wrapper - consistent success/error shape
- [x] **UserDetailsServiceImpl** - loads User from DB, maps roles to authorities
- [x] **AuthService** - login, patient registration, token refresh
- [x] **AuthController** - POST `/api/auth/login`, `/register`, `/refresh` with Swagger docs

### 11. Database Connection (2026-09-20)
- [x] Updated `application.yml` to connect to local `careconnect` DB (localhost:5432, user: postgres)
- [x] Added `.gitignore` for secrets and build artifacts

---

## 🚧 In Progress

### 12. Environment Setup & Verification (2026-09-20)
- [x] Installed Scoop package manager + Maven 3.9.16 (Java 17 already present via Temurin)
- [x] Lowered `pom.xml` Java target from 21 → 17 to match installed JDK
- [x] Fixed jjwt 0.12.x API breakage in `JwtUtil` (`parserBuilder()` removed → `Jwts.parser().verifyWith()`)
- [x] Fixed JWT signing key: was Base64-decoding a non-Base64 secret string → now uses raw UTF-8 bytes
- [x] Fixed `SecurityConfig` request matchers: `server.servlet.context-path=/api` means matchers must be
      relative (`/auth/**`, not `/api/auth/**`) — this was blocking all requests with 401
- [x] Changed backend port 8080 → **8081** (8080 occupied by an unrelated system process)
- [x] Added `@Builder.Default` to `Doctor.isAvailable` and `Appointment.status` (Lombok warning fix)
- [x] **`mvn clean compile` → BUILD SUCCESS**
- [x] **`mvn spring-boot:run` → verified live**: connects to `careconnect`, Hibernate auto-created all 5
      `tbl_*` tables with FKs and constraints
- [x] **Verified end-to-end**: `POST /api/auth/register` and `POST /api/auth/login` both tested with
      `Invoke-RestMethod` against the real running server — return valid JWT access/refresh tokens

### 13. Doctor Approval Workflow (2026-09-20)
- [x] **Doctor entity** - added `Status` enum (PENDING, APPROVED, REJECTED) with `@Builder.Default`
- [x] **UserDetailsServiceImpl** - blocks login for doctors with status != APPROVED via `disabled=true`
- [x] **GlobalExceptionHandler** - handles `DisabledException` → 401 "Account is not approved yet"
- [x] **AuthDTOs** - added `RegisterDoctorRequest` with specialization, experience, bio, consultationFee
- [x] **AuthService** - `registerDoctor()` creates user with DOCTOR role + doctor profile with PENDING status
- [x] **AuthController** - `POST /api/auth/register-doctor` with Swagger docs
- [x] **DoctorService** - `getAllDoctors`, `getPendingDoctors`, `getDoctorById`, `updateDoctorStatus`
- [x] **DoctorRepository** - `findByStatus` for paginated queries
- [x] **AdminController** - `/admin/doctors`, `/admin/doctors/pending`, `/admin/doctors/{id}/approve`, `/admin/doctors/{id}/reject`
- [x] **DataInitializer** - creates/updates admin user on startup
- [x] **Verified complete workflow**:
    - Doctor registers → PENDING status, tokens issued but login blocked
    - Doctor login attempt → 401 "Account is not approved yet"
    - Admin logs in → gets pending doctors list
    - Admin approves doctor → status APPROVED
    - Doctor login → SUCCESS with DOCTOR role
    - Admin rejects doctor → doctor + user deleted, login impossible

### 14. Frontend Wiring (2026-09-20)
- [x] `npm install` completed (React 18, Vite, Router, Axios)
- [x] Installed and configured **Tailwind CSS 3** (+ PostCSS, Autoprefixer) — pages used Tailwind-style
      utility classes (`bg-slate-50`, `md:grid-cols-2`, etc.) that weren't actually defined anywhere
- [x] Added `tailwind.config.js`, `postcss.config.js`, `@tailwind` directives in `styles/index.css`
- [x] Added **Register.jsx** page (patient self-registration form, wired to `/api/auth/register`)
- [x] Wired `/register` route into `App.jsx`; fixed Login's `<a>` → React Router `<Link>`
- [x] Updated `vite.config.js` proxy target to `localhost:8081` (matches new backend port)
- [x] **Both servers running and verified together**: backend on :8081, frontend (Vite) on :3000,
      browser preview opened for manual UI testing

### 15. Appointment Booking — Patient Side (2026-10-11)
- [x] **PatientService** — `getCurrentPatient`, `getAvailableDoctors` (approved only, paginated),
      `bookAppointment` (with conflict check), `getMyAppointments`
- [x] **PatientController** — `GET /patient/doctors`, `POST /patient/appointments`,
      `GET /patient/appointments`, all with Swagger docs
- [x] **BookAppointment.jsx** — doctor dropdown (fetches from `/patient/doctors`), date picker
      (min = today), time picker, reason textarea, success/error alerts
- [x] Wired **Book Now** button → `<Link to="/patient/book">`; added `/patient/book` route in `App.jsx`
- [x] Fixed routing: `/patient/*` catch-all split into explicit `/patient/dashboard` + `/patient/book`
- [x] **Tested end-to-end**: patient login → list approved doctors → book appointment → record in `tbl_appointments`

### 16. Doctor Module — Full Implementation (2026-10-11)
- [x] **DoctorService** — `getCurrentDoctor`, `getMyProfile`, `getMyAppointments` (paginated),
      `getUpcomingAppointments`, `updateAppointmentStatus` (CONFIRMED/COMPLETED/CANCELLED/NO_SHOW with ownership check),
      `toggleAvailability`, `getPatientDetails`
- [x] **DoctorController** — `GET /doctor/profile`, `GET /doctor/appointments`, `GET /doctor/appointments/upcoming`,
      `PUT /doctor/appointments/{id}` (status + notes), `PUT /doctor/availability`, `GET /doctor/patients/{id}`,
      `POST /doctor/medical-records`, `GET /doctor/medical-records`, all with Swagger docs
- [x] **MedicalRecordService** — `createMedicalRecord` (with appointment ownership + duplicate check),
      `getMyRecords`, `getPatientRecords`
- [x] **DoctorDashboard.jsx** — tabbed UI (Appointments / Upcoming / Medical Records),
      approve/cancel/complete buttons, inline medical record form, availability toggle, stats cards
- [x] **Tested end-to-end**: doctor login → view appointments → confirm appointment → create medical record
      → toggle availability, all verified via `Invoke-RestMethod`

### 17. Patient Module — Extended (2026-10-11)
- [x] **PatientService** — added `cancelAppointment` (ownership + status validation),
      `getMyMedicalRecords`, `getAllPatients` (admin), `getAllAppointments` (admin)
- [x] **PatientController** — `PUT /patient/appointments/{id}/cancel`, `GET /patient/medical-records`,
      all with Swagger docs
- [x] **PatientDashboard.jsx** — tabbed UI (Appointments / Medical Records), cancel button on future
      appointments, medical records table with diagnosis/prescription/follow-up

### 18. Admin Module — Extended (2026-10-11)
- [x] **AdminController** — `GET /admin/patients` (paginated patient list),
      `GET /admin/appointments` (paginated appointment list)
- [x] **AdminDashboard.jsx** — tabbed UI (All Doctors / Pending / Patients / Appointments),
      approve/reject buttons with confirmation, stats cards, status badges

### 19. Frontend — Registration & Components (2026-10-11)
- [x] **RegisterDoctor.jsx** — doctor self-registration form (name, email, password, specialization,
      experience, bio, consultation fee) wired to `/api/auth/register-doctor`
- [x] **Login.jsx** — added "Register as Doctor" link
- [x] **Reusable components**: `Button`, `Input`, `Card`, `Table`, `Badge`, `Modal` + `index.js` barrel export

### 20. UI Redesign — Split-Screen Auth Pages (2026-10-11)
- [x] **New color scheme** — teal/green primary (`#0d9488`) instead of blue, warmer background (`#f0fdfa`)
- [x] **Split-screen auth layout** — left side branding (logo + feature list), right side form
- [x] **CSS classes** — `.auth-layout`, `.auth-brand`, `.auth-form-side`, `.auth-card` with gradient + shadow-xl
- [x] **Login.jsx** — redesigned with CareConnect branding, welcome message, role-specific links
- [x] **Register.jsx** — redesigned with same split-screen pattern
- [x] **RegisterDoctor.jsx** — redesigned with same split-screen pattern
- [x] **index.html** — title updated to "CareConnect — Healthcare Management"
- [x] Responsive: on mobile, branding section stacks above form

### 21. Dashboard UI Redesign — Sidebar Layout (2026-10-11)
- [x] **PatientDashboard** — sidebar navigation, stats cards with icons, card-style appointment items
      (date badge, doctor info, status badge, action buttons), medical records cards, reschedule modal
- [x] **DoctorDashboard** — sidebar navigation, stats cards (total/pending/confirmed/records),
      appointment cards with inline medical record form, availability toggle in sidebar
- [x] **AdminDashboard** — sidebar navigation, stats cards, doctor approve/reject cards,
      patient/appointment list items, analytics charts (status breakdown + doctor workload)
- [x] **BookAppointment** — sidebar layout, clickable doctor selection cards, date/time pickers
- [x] **All dashboards** — consistent sidebar (logo, nav items, user info, sign out),
      loading spinners, empty states with icons, better status badges

### 22. Layout Components + Refactoring (2026-10-11)
- [x] **Header.jsx** — shared page header with title, subtitle, and actions prop
- [x] **Footer.jsx** — shared page footer
- [x] **Sidebar.jsx** — role-based navigation sidebar (available but not yet used — dashboards use tabs)
- [x] **layouts/index.js** — barrel export
- [x] **All dashboards refactored** — PatientDashboard, DoctorDashboard, AdminDashboard now use shared `Header`/`Footer`

### 21. Admin — Create Doctor (2026-10-11)
- [x] **POST /admin/doctors** — admin can create doctor accounts directly (auto-approved)
- [x] **AdminDashboard** — "+ Create Doctor" button toggles inline form (name, email, password, specialization, experience, fee, bio)
- [x] Verified: admin creates doctor → doctor can immediately log in (status=APPROVED)

### 22. Appointment Rescheduling (2026-10-11)
- [x] **PUT /patient/appointments/{id}/reschedule** — patient can reschedule SCHEDULED/CONFIRMED appointments
      to a new date/time (with conflict check), sets status back to SCHEDULED
- [x] **PatientDashboard** — "Reschedule" button opens modal with date/time pickers + reason

### 23. Dashboard Analytics (2026-10-11)
- [x] **AdminDashboard** — appointment status breakdown (SCHEDULED/CONFIRMED/COMPLETED/CANCELLED/NO_SHOW bar chart)
- [x] **AdminDashboard** — doctor workload breakdown (appointments per doctor)

### 24. Integration Tests (2026-10-11)
- [x] **HealthcareApplicationTests** — 4 integration tests using Spring Boot TestRestTemplate:
      context load, patient registration + login, unauthorized access (401), forbidden access (403)
- [x] Test profile uses H2 in-memory DB (no PostgreSQL dependency for tests)
- [x] **All 4 tests pass**: `mvn clean verify` → BUILD SUCCESS

### 25. PostgreSQL Setup Script (2026-10-11)
- [x] **setup.sql** — reference script to create `careconnect` DB + schema documentation

### 26. Doctor Certification Upload (2026-10-11)
- [x] **`certification_path` column** added to `tbl_doctors` (auto-migrated by Hibernate)
- [x] **Two endpoints** for doctor registration:
  - `POST /auth/register-doctor` (JSON) — backward compatible, no file needed
  - `POST /auth/register-doctor` (multipart/form-data) — with optional `certification` file
- [x] **File validation** — only PDF/JPG/PNG, max 5MB
- [x] **File storage** — `uploads/certifications/` with UUID filenames
- [x] **`GET /admin/certifications/{filename}`** — admin can view uploaded certs (inline, not download)
- [x] **`.gitignore`** — `uploads/` folder excluded
- [x] **`DoctorResponse` DTO** — includes `certificationPath` field
- [x] **`DoctorService.mapToResponse`** — maps `certificationPath` to response

### 27. Patient Dashboard Redesign & Patient Profile (2026-10-11)
- [x] **Backend**: Added `GET /patient/profile` endpoint in `PatientController` and `getMyProfile` in `PatientService`
- [x] **UI Redesign matching CarePlus design**:
  - Deep navy blue sidebar with CareConnect brand icon and navigation (Dashboard, Book Appointment, Appointment History, Medical Records, Profile)
  - Top header with search bar, notification bell indicator, and user profile dropdown
  - Time-aware personalized greeting ("Good morning / afternoon / evening, [Name] 👋") + live formatted date
  - 3 Summary cards with icons and distinct color themes: Upcoming Appointments (blue), Completed Visits (green), Medical Records (purple)
  - Hero "Next Appointment" spotlight card with large date badge, doctor name, specialization, clinic location, reason, status pill, and quick action buttons (Book New Appointment, View Details, Reschedule, Cancel)
  - Bottom 2-column layout: Upcoming visits list preview and Wellness Tip card
  - Full **Profile View** tab: displays Patient details (Date of Birth, Gender, Blood Group, Phone, Address, Emergency Contact, and Allergies) with "Back to Dashboard" navigation
  - Interactive appointment details modal and reschedule modal
- [x] **Visual Polish & Real Website Experience**:
  - Soft, non-white layered background (`#E9EEF5`) for high contrast so white cards pop
  - Real doctor portrait photos with verified badges
  - Live Patient Vitals Tracker bar (Heart Rate 72 bpm, Blood Pressure 120/80 mmHg, Blood Group, Glucose 95 mg/dL)
  - 24/7 Emergency Active badge in top bar
  - Upgraded shadow depths, borders, and polished button gradients
  - **Interactive Notification Center**:
    - Notification bell with dynamic unread count badge
    - Real-time alerts for scheduled appointments, doctor visit completions, and published medical records
    - "Mark all as read" capability with persistent read tracking
    - Clicking an appointment alert opens full appointment details; clicking a record alert navigates to medical records
- [x] **Doctor Dashboard Redesign (MediCare+ / DocCare / HealthPro style)**:
  - Deep navy blue sidebar with MediCare+ brand, navigation menu, and doctor profile card with interactive availability toggle
  - Top search bar with OPD status badge, notifications dropdown, and doctor profile pill
  - 4 Metric cards: Today's Appointments, Total Patients, Prescriptions Issued, and Patient Rating (4.8 ★)
  - Quick Actions toolbar (Write Prescription, Patient Directory, Prescription Archive, Clinic Status)
  - Split 2-column layout:
    - Left: Today's Appointments queue with patient portraits, visit times, condition, status badges, and action buttons (Confirm, Complete, Write Rx)
    - Right: Interactive Monthly Calendar & scheduled time slot timeline
  - Dedicated tabs for All Appointments, Patient Directory (with history & total visits), Prescriptions Archive, and Doctor Profile/Settings
  - Prescription & Medical Record modal for direct publishing of clinical diagnoses and dosages
- [x] **Admin Dashboard Redesign (CarePlus Hospital Administration)**:
  - Deep navy blue sidebar (#0B2545) with CarePlus Hospital Admin branding, navigation menu, and Super Admin profile card
  - Top search bar with server online badge, notifications dropdown with unread count for pending doctor applications, and admin profile pill
  - 4 Metric cards: Total Doctors, Pending Review (amber badge with count), Registered Patients, and Appointments
  - Priority Doctor Credentialing Queue with doctor portrait, specialization, experience, direct "View Details", "View Cert", "Approve", and "Reject" buttons
  - Real-time Clinic Operations Status charts: appointment status metrics and doctor consultation volume distribution
  - Dedicated tabs: Overview, Doctors Directory (with inline "+ Add New Doctor" auto-approval form), Pending Approvals, Patients Directory, Appointment Registry, and Full Analytics & Reports
  - Doctor Credentialing Review Modal with secure JWT certificate viewer and 1-click approval/rejection
- [x] **Gender-Based Photos & Doctor/Patient Gender Selection**:
  - `tbl_doctors` schema updated with `gender` column (MALE, FEMALE, OTHER)
  - `RegisterDoctor.jsx` updated with Male / Female / Other doctor gender selection
  - Admin Dashboard "+ Add New Doctor" form updated with Doctor Gender dropdown
  - `AppointmentResponse` DTO enriched with `doctorGender` and `patientGender`
  - Dynamic avatar resolution across all dashboards (Patient, Doctor, Admin, BookAppointment):
    - Male doctors / patients display handsome male doctor/patient portraits
    - Female doctors / patients display professional female doctor/patient portraits

### Frontend - Manual UI Verification
- [ ] User to confirm Login page works end-to-end in browser
- [ ] User to confirm Register page works end-to-end in browser
- [ ] User to confirm appointment booking + dashboard tables render correctly
- [ ] User to confirm doctor dashboard (approve/complete/medical record)
- [ ] User to confirm admin dashboard (approve/reject doctor, patient list)

### Backend - Service Layer
- [x] AuthService (login, registration, token refresh, doctor registration)
- [x] DoctorService (all admin + doctor-facing methods)
- [x] PatientService (profile, doctors, appointments, medical records, admin methods)
- [x] MedicalRecordService (create, getMyRecords, getPatientRecords)

### Backend - Controller Layer
- [x] AuthController (/auth/login, /register, /refresh, /register-doctor)
- [x] AdminController (all endpoints: doctors, pending, approve/reject, patients, appointments)
- [x] PatientController (/patient/doctors, /patient/appointments GET+POST+cancel, /patient/medical-records)
- [x] DoctorController (profile, appointments, update status, availability, patients, medical-records)

### Backend - Swagger Documentation
- [x] All controllers fully annotated with @Operation, @ApiResponses

### Frontend - Components
- [x] Reusable components (Button, Input, Card, Table, Badge, Modal + index.js)
- [x] Layout components (Header, Sidebar, Footer + index.js)
- [x] Refactor dashboards to use shared Header/Footer

### Frontend - Page Functionality
- [x] Patient: Book appointment flow (BookAppointment.jsx)
- [x] Patient: View medical records (in dashboard tab)
- [x] Patient: View appointment history + cancel + reschedule buttons
- [x] Doctor: Manage schedule, update appointment status, create medical records
- [x] Admin: CRUD for doctors/patients, appointment management UI
- [x] Doctor registration page (RegisterDoctor.jsx)

### Database
- [x] PostgreSQL setup script with `tbl` prefixed tables (setup.sql)
- [ ] Flyway/Liquibase migrations (currently using Hibernate auto-DDL)

---

## 📋 Upcoming (Phase 2+)

### Phase 2 - Core Features
- [ ] Patient registration (public)
- [ ] Admin creates doctor accounts
- [ ] Role-based access control verification
- [ ] Appointment booking with conflict detection
- [ ] Doctor schedule management

### Phase 3 - Advanced Features
- [ ] Medical records creation by doctors
- [ ] Dashboard analytics
- [ ] Email notifications (appointment confirmation, reminders)
- [ ] Appointment cancellation/rescheduling

### Phase 4 - Polish & Testing
- [ ] Integration tests
- [ ] E2E tests (Cypress/Playwright)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment config

---

## 📝 Notes & Decisions

| Date | Decision |
|------|----------|
| 2026-09-20 | Using `AGENTS.md` (not `AGENT.md`) as standard agent config filename |
| 2026-09-20 | Frontend folder named `clinet` (typo for `client`) - keep for now, rename later |
| 2026-09-20 | JWT secret in application.yml is dev-only; use env var in production |
| 2026-09-20 | Default pagination page size = 10 (per standards) |
| 2026-09-20 | All DB tables use `tbl` prefix (tblUsers, tblDoctors, etc.) |
| 2026-09-20 | DTOs in separate files per feature (AuthDTOs, DoctorDTOs, etc.) |
| 2026-09-20 | Local PostgreSQL DB name is `careconnect` (not `healthcare_db`), user `postgres`, port 5432 |
| 2026-09-20 | **Backend runs on port 8081, not 8080** (8080 was occupied by an unrelated system process) |
| 2026-09-20 | Java target lowered to 17 (matches installed Temurin JDK; originally scaffolded for 21) |
| 2026-09-20 | Maven installed via Scoop (no admin rights required) |
| 2026-09-20 | Added Tailwind CSS 3 alongside the custom `index.css` component classes — pages use Tailwind utility classes |
| 2026-09-20 | DB password currently hardcoded in `application.yml` since no git repo exists yet; move to env var once git is set up |
| 2026-09-20 | Doctor self-registration with admin approval workflow: Doctor registers → PENDING → Admin approves/rejects → only APPROVED doctors can log in |
| 2026-09-20 | Rejected doctors are fully deleted (user + doctor profile) |
| 2026-09-20 | `DisabledException` handled in GlobalExceptionHandler for clear "Account not approved" error message |
| 2026-10-11 | DoctorDashboard is a tabbed single page (Appointments / Upcoming / Medical Records) — keeps the UI manageable for a college project |
| 2026-10-11 | Medical records are linked to appointments — one record per appointment, only the appointment's doctor can create it |
| 2026-10-11 | Doctor self-registration is public (`/register-doctor`) but requires admin approval before login |
| 2026-10-11 | Patient can cancel only SCHEDULED/CONFIRMED appointments in the future |
| 2026-10-11 | Reusable React components created: Button, Input, Card, Table, Badge, Modal |
| 2026-10-11 | Shared layouts (Header, Footer) used across all dashboards; Sidebar available but not yet used |
| 2026-10-11 | Admin can create doctors directly via `POST /admin/doctors` (auto-approved, bypasses self-registration) |
| 2026-10-11 | Appointment rescheduling resets status to SCHEDULED — doctor must re-confirm |
| 2026-10-11 | Integration tests use H2 in-memory DB (no PostgreSQL needed for tests) |
| 2026-10-11 | Dashboard analytics: status breakdown bar chart + doctor workload on AdminDashboard |
| 2026-10-11 | UI redesign: teal primary color, split-screen auth pages with CareConnect branding |
| 2026-10-11 | All auth pages (Login, Register, RegisterDoctor) use shared `.auth-layout` CSS class |
| 2026-10-11 | All dashboards redesigned with sidebar navigation + stats cards + card-style list items |
| 2026-10-11 | Empty states now show icon + helpful message + CTA button |
| 2026-10-11 | BookAppointment uses clickable doctor selection cards instead of dropdown |

---

## 🔧 Commands Reference

### Backend
```bash
cd codebase/server
mvn clean compile          # Compile
mvn spring-boot:run        # Run dev server (port 8081, context path /api)
mvn test                   # Run tests
mvn clean verify           # Full build + tests
```
Note: if `mvn` isn't recognized in a new terminal, run this first (Scoop shim PATH refresh):
```powershell
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","User") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","Machine")
```

### Frontend
```bash
cd codebase/clinet
npm install                # Install deps
npm run dev                # Dev server (port 3000)
npm run build              # Production build
npm run preview            # Preview build
npm run lint               # ESLint
```

---

## 📊 Progress Summary

| Layer | Total Planned | Completed | In Progress | Remaining |
|-------|---------------|-----------|-------------|-----------|
| Documentation | 2 | 2 | 0 | 0 |
| Backend Config | 4 | 4 | 0 | 0 |
| Entities | 5 | 5 | 0 | 0 |
| Repositories | 5 | 5 | 0 | 0 |
| DTOs | 5 | 5 | 0 | 0 |
| Security | 8 | 8 | 0 | 0 |
| Services | 5 | 4 | 0 | 1 |
| Controllers | 4 | 4 | 0 | 0 |
| Swagger | 4 | 4 | 0 | 0 |
| Backend Build/Run Verified | 1 | 1 | 0 | 0 |
| Doctor Approval Workflow | 8 | 8 | 0 | 0 |
| Frontend Config | 4 | 4 | 0 | 0 |
| Frontend Services | 2 | 2 | 0 | 0 |
| Frontend Styles | 1 | 1 | 0 | 0 |
| Frontend Pages | 8 | 8 | 0 | 0 |
| Frontend Components | 9 | 9 | 0 | 0 |
| Frontend Auth Wiring | 2 | 2 | 0 | 0 |
| Integration Tests | 4 | 4 | 0 | 0 |
| Manual UI Verification | 5 | 0 | 5 | 0 |

**Overall: ~95% complete**

---

*Update this file after every significant change. Keep it accurate for team visibility.*