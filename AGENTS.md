# AGENTS.md — Online Healthcare Management System

## MANDATORY: Read the docs before writing any code

Before generating, editing, or reviewing ANY code in this repository, you MUST read
both documents below and follow them. They are the source of truth. If a request
conflicts with them, stop and ask the user.

1. `__DOC__/docs/Healthcare_Coding_Standards.md` — coding standards & development rules
2. `__DOC__/docs/Online_Healthcare_Project_Plan.md` — project plan, modules, schema, APIs

Workflow for every coding task:

1. Read `__DOC__/docs/Healthcare_Coding_Standards.md`.
2. Read `__DOC__/docs/Online_Healthcare_Project_Plan.md` to confirm the module,
   table, and API endpoint you are touching are the ones already planned.
3. Write the code following the standards.
4. Verify against the Development Checklist below before reporting done.

## Project layout

```
Basant Project/
├── __DOC__/docs/        # standards + project plan (read-only reference)
└── codebase/
    ├── server/          # Spring Boot backend (Java, Maven, PostgreSQL)
    └── clinet/          # React frontend (folder name is spelled "clinet")
```

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Java, Spring Boot (monolith) |
| Frontend | React.js |
| Database | PostgreSQL |
| Auth | JWT + role-based authorization |
| Build | Maven |

## Non-negotiable rules (summary of the standards doc)

- **Comments**: every class needs a class-level doc comment; every public method
  needs a block comment. Inline comments only for complex logic.
- **Swagger**: every API endpoint must be documented with OpenAPI annotations.
- **One class per module** — never mix modules in a single class.
- **DB naming**: every table name starts with `tbl` (`tblUsers`, `tblDoctors`,
  `tblPatients`, `tblAppointments`, `tblMedicalRecords`).
- **PostgreSQL**: prefer functions over stored procedures.
- **Pagination**: always backend-side, default page size **10**.
- **Backend folders**: `controller`, `service`, `repository`, `entity`, `dto`,
  `security`, `config`.
- **Frontend folders**: `components`, `pages`, `services`, `layouts`, `utils`.
- **Naming**: classes PascalCase, methods camelCase, meaningful variable names.
- **Exceptions**: handle via a single `GlobalExceptionHandler`.
- **DTOs**: never expose entities from controllers.
- **Validation**: validate every incoming request.
- **Security**: BCrypt password hashing, JWT auth, role-based authorization.
- **React**: functional components only, one component per file, all API calls
  live in `services`.
- **Code quality**: methods under 30–40 lines, no duplicate code, no unused
  imports, constants instead of hard-coded values.

## API response format

Success:
```json
{ "success": true, "message": "Operation completed successfully." }
```

Error:
```json
{ "success": false, "message": "Something went wrong." }
```

## Commit messages

Use the conventional prefixes shown in the standards doc:

- `feat: Add appointment booking`
- `fix: Resolve login issue`
- `refactor: Separate DoctorService`

## Development checklist (run before declaring a task complete)

- [ ] Class-level comment added
- [ ] Method-level comments added
- [ ] Swagger/OpenAPI docs updated
- [ ] Request validation implemented
- [ ] Backend pagination with default page size 10
- [ ] JWT / role authorization verified
- [ ] DTOs used, no entity leakage
- [ ] Standard success/error response shape used

## Golden rule

Write clean, readable, and maintainable code.

## Build & verification commands

Not yet established — `codebase/server` and `codebase/clinet` are currently empty.
Once the projects are scaffolded, record the real commands here (expected:
`mvn clean verify` for the backend, `npm run build` / `npm test` for the frontend).
