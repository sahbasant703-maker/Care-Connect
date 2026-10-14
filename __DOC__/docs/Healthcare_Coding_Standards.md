# Online Healthcare Management System
# Coding Standards & Development Guidelines

Version: 1.0

## Purpose

This document defines the coding standards and development rules for the project.

## 1. Commenting Standards

### 1.1 Class-Level Comment (Mandatory)

Every class must have a top-level documentation comment.

### 1.2 Method-Level Comment (Mandatory)

Every public method should have a block comment describing its purpose.

### 1.3 Inline Comment

Use inline comments only for complex logic.

## 2. Swagger

Use Swagger (OpenAPI) for documenting every API.

## 3. One Class Per Module

Never mix multiple modules into one class.

## 4. Database Naming Convention

Every table must start with `tbl`.

Examples:
- tblUsers
- tblDoctors
- tblPatients
- tblAppointments
- tblMedicalRecords

## 5. PostgreSQL Guidelines

Prefer Functions over Stored Procedures.

## 6. Backend Pagination

Pagination must happen in the backend.

Default page size: **10 records**

## 7. Folder Structure

Backend:
- controller
- service
- repository
- entity
- dto
- security
- config

Frontend:
- components
- pages
- services
- layouts
- utils

## 8. Naming Conventions

- Classes: PascalCase
- Methods: camelCase
- Variables: Meaningful names

## 9. Exception Handling

Use a GlobalExceptionHandler.

## 10. DTO Usage

Never expose Entity objects directly.

## 11. Validation

Validate every incoming request.

## 12. Security Rules

- BCrypt password hashing
- JWT authentication
- Role-based authorization

## 13. React Guidelines

- Functional components
- One component per file
- API calls inside services

## 14. Git Rules

Good commit examples:
- feat: Add appointment booking
- fix: Resolve login issue
- refactor: Separate DoctorService

## 15. Code Quality Rules

- Keep methods under 30–40 lines.
- Avoid duplicate code.
- Remove unused imports.
- Use constants instead of hard-coded values.

## 16. API Response Format

Success:
{
  "success": true,
  "message": "Operation completed successfully."
}

Error:
{
  "success": false,
  "message": "Something went wrong."
}

## 17. Development Checklist

- Class comment added
- Method comments added
- Swagger updated
- Validation implemented
- Backend pagination (10 records)
- JWT verified
- DTOs used

## Golden Rule

Write clean, readable, and maintainable code.
