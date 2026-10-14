# Online Healthcare Management System - Project Plan

> College Project (Simple Monolithic Application)

## Project Overview

A simple online healthcare management system where Patients can book appointments, Doctors can manage appointments and patient records, and Admin has full control over the system.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Java (Spring Boot) |
| Frontend | React.js |
| Architecture | Monolithic |
| Database | PostgreSQL |
| Authentication | JWT |
| Build Tool | Maven |

## Roles

### Admin
- Manage doctors
- Manage patients
- View all appointments
- Cancel appointments

### Doctor
- Login
- Manage schedule
- View appointments
- Update patient records

### Patient
- Register/Login
- Book appointments
- View appointment history
- View medical records

## Modules

### Authentication
- Login
- Register (Patient)
- JWT Authentication
- Role-Based Authorization

### Admin
- Dashboard
- Doctor Management
- Patient Management
- Appointment Management

### Doctor
- Dashboard
- Schedule
- Appointments
- Patient Records

### Patient
- Dashboard
- Book Appointment
- Appointment History
- Medical Records
- Profile

## Database Tables

### users
- id
- name
- email
- password
- role

### doctors
- id
- user_id
- specialization
- experience

### patients
- id
- user_id
- age
- gender
- phone

### appointments
- id
- doctor_id
- patient_id
- appointment_date
- appointment_time
- status

### medical_records
- id
- doctor_id
- patient_id
- diagnosis
- prescription
- notes

## Project Structure

### Backend

```
healthcare-backend/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
├── security/
├── config/
└── HealthcareApplication.java
```

### Frontend

```
healthcare-frontend/
├── src/
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── layouts/
│   └── App.jsx
```

## Development Plan

### Phase 1
- Create Spring Boot project
- Connect PostgreSQL
- Create database tables
- Implement JWT Login

### Phase 2
- Patient Registration
- Admin creates Doctor
- Role-based access

### Phase 3
- Appointment booking
- Doctor schedule
- Appointment management

### Phase 4
- Medical records
- Dashboards
- Final testing

## Screens

### Login
- Email
- Password

### Patient Dashboard
- Book Appointment
- Appointment History
- Medical Records

### Doctor Dashboard
- Today's Appointments
- Schedule
- Patient Records

### Admin Dashboard
- Doctors
- Patients
- Appointments

## APIs

### Authentication
- POST /api/auth/register
- POST /api/auth/login

### Admin
- GET /api/admin/doctors
- POST /api/admin/doctors
- DELETE /api/admin/doctors/{id}

### Patient
- GET /api/patient/profile
- POST /api/patient/appointments
- GET /api/patient/appointments

### Doctor
- GET /api/doctor/appointments
- PUT /api/doctor/appointments/{id}
- POST /api/doctor/medical-records

## Suggested Timeline

| Week | Tasks |
|------|-------|
| Week 1 | Setup, Database, JWT |
| Week 2 | Patient & Doctor Modules |
| Week 3 | Admin Module & Testing |
