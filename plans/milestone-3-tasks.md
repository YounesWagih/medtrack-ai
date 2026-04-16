# Milestone 3 — Medicine Tracking Core: Task Breakdown

## Overview
Milestone 3 delivers the medicine tracking backend vertical slice for authenticated users. The work includes completing the medicine database model, implementing user-scoped CRUD endpoints, adding expiry status business logic, registering a scheduled sync job, and covering the milestone with tests and documentation.

This milestone must follow the current backend architecture:

* **Controller** -> HTTP transport only
* **Service** -> business rules and orchestration
* **Repository** -> Prisma access only

This milestone must also follow the team execution rule:

* One implementation task is completed by an implementer agent
* Immediately after that task, spawn a dedicated QA agent
* The QA agent verifies the finished task before the next task begins
* If QA finds issues, fix them before moving on

---

## Team Workflow

### Execution Loop Per Task

1. Assign one implementer agent to the task
2. Limit the implementer to the files and responsibility of that task
3. Review the implementation locally
4. Spawn one QA agent for that completed task
5. QA agent verifies behavior, edge cases, and integration safety
6. Resolve QA findings
7. Mark the task complete only after QA passes

### QA Agent Checklist Per Task

For every completed task, the QA agent must check:

* The implementation matches the task spec
* No layer violations were introduced
* Error handling is consistent with the project
* Types are correct and no obvious runtime mismatch exists
* Existing behavior outside milestone scope was not broken
* Relevant tests exist or the missing test gap is clearly noted

---

## Task 3.1: Database Schema — Medicines

### Goal
Finalize the Prisma medicine model so it is production-ready for CRUD, filtering, expiry sync, and soft removal.

### Implementer Scope

* `prisma/schema.prisma`
* migration files generated for the schema change
* optional seed updates if a maintained seed script exists

### Implementation Checklist

- [ ] Verify `MedicineStatus` enum contains `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `REMOVED`
- [ ] Verify `Medicine.userId` is a required foreign key to `User.id`
- [ ] Verify `onDelete: Cascade` exists on the `User` -> `Medicine` relation
- [ ] Add index on `userId`
- [ ] Add composite index on `(userId, status)`
- [ ] Add composite index on `(userId, expiryDate)`
- [ ] Verify `createdAt` uses `@default(now())`
- [ ] Verify `updatedAt` uses `@updatedAt`
- [ ] Keep `status` as enum, not string
- [ ] Create a Prisma migration for the schema update
- [ ] Regenerate Prisma client
- [ ] Update seed data only if the project already maintains medicine seeds

### Acceptance Criteria

* Prisma schema supports user-scoped medicine queries efficiently
* Soft delete is represented by `REMOVED`
* Migration is reproducible and committed
* No schema decisions are left to the implementer of later tasks

### QA After Task 3.1

- [ ] Spawn QA agent for schema review
- [ ] Confirm model, enum, relation, and index definitions match the plan
- [ ] Confirm migration reflects intended changes only
- [ ] Confirm the schema remains compatible with existing `User` and chat models

---

## Task 3.2: Validation & Request Contracts

### Goal
Define strict Zod validation for all medicine endpoints before controller implementation.

### Implementer Scope

* `src/schemas/medicine.schema.ts`
* shared query helpers in `src/schemas/common.schema.ts` if needed
* validation middleware reuse only, no controller logic

### Implementation Checklist

- [ ] Create separate schemas for create, update, list query, id param, and remove operations
- [ ] Accept only `name` and `expiryDate` in create requests
- [ ] Accept only partial `name` and `expiryDate` in update requests
- [ ] Reject empty update payloads
- [ ] Validate medicine id as UUID
- [ ] Add list query validation for `status`, `page`, and `limit`
- [ ] Exclude `userId`, `status`, `createdAt`, and `updatedAt` from writable input
- [ ] Reuse common pagination schema from `common.schema.ts` when practical
- [ ] Export inferred TypeScript types for service/controller use

### Acceptance Criteria

* Every medicine route has a dedicated request contract
* Validation happens before controller logic
* Clients cannot write protected fields
* Validation shapes are reusable and typed

### QA After Task 3.2

- [ ] Spawn QA agent for schema validation review
- [ ] Confirm no inline validation is required in controllers/services
- [ ] Confirm invalid dates, invalid UUIDs, and invalid status filters are rejected
- [ ] Confirm update schema rejects empty patches

---

## Task 3.3: Repository Layer

### Goal
Create a medicine repository that owns all Prisma access for medicines.

### Implementer Scope

* `src/repositories/medicine.repository.ts`

### Implementation Checklist

- [ ] Create repository with explicit method inputs and outputs
- [ ] Implement `create(userId, data)`
- [ ] Implement `findManyByUser(userId, filters, pagination)`
- [ ] Implement `countByUser(userId, filters)`
- [ ] Implement `findByIdForUser(id, userId)`
- [ ] Implement `updateForUser(id, userId, data)`
- [ ] Implement `markRemoved(id, userId)`
- [ ] Implement `findCandidatesForStatusSync(referenceDate)`
- [ ] Implement `updateStatus(id, status)`
- [ ] Centralize user scoping in all user-facing queries
- [ ] Centralize soft-delete filtering for list behavior
- [ ] Use explicit Prisma `select` shapes rather than returning full records everywhere

### Acceptance Criteria

* Controllers and services never touch Prisma for medicine operations
* All user-facing queries are scoped by `userId`
* Repository supports both API flows and cron sync flows

### QA After Task 3.3

- [ ] Spawn QA agent for repository verification
- [ ] Confirm no repository method leaks cross-user access
- [ ] Confirm soft-delete behavior is consistent
- [ ] Confirm query methods align with the planned service contract

---

## Task 3.4: Expiry Logic Service

### Goal
Create a pure expiry-status service that determines medicine status from `expiryDate`.

### Implementer Scope

* `src/services/expiry.service.ts`
* env consumption only if needed for threshold behavior

### Implementation Checklist

- [ ] Implement `computeStatus(expiryDate: Date)`
- [ ] Implement `isExpired(expiryDate: Date)`
- [ ] Implement `isExpiringSoon(expiryDate: Date, thresholdDays: number)`
- [ ] Read threshold from env through the validated config layer
- [ ] Normalize comparisons to one day-boundary rule
- [ ] Keep `REMOVED` outside expiry computation
- [ ] Document the chosen day-boundary behavior in code comments only where needed

### Acceptance Criteria

* Status computation is deterministic
* Threshold is configurable from env
* Logic is pure and easy to unit test

### QA After Task 3.4

- [ ] Spawn QA agent for expiry logic review
- [ ] Confirm boundary behavior for yesterday, today, threshold day, and day after threshold
- [ ] Confirm no timezone ambiguity is left undocumented
- [ ] Confirm the service stays independent from HTTP and Prisma

---

## Task 3.5: Medicine Service

### Goal
Implement the medicine business logic and orchestration layer.

### Implementer Scope

* `src/services/medicine.service.ts`

### Implementation Checklist

- [ ] Implement `createMedicine(userId, input)`
- [ ] Implement `listMedicines(userId, filters)`
- [ ] Implement `getMedicineById(userId, medicineId)`
- [ ] Implement `updateMedicine(userId, medicineId, input)`
- [ ] Implement `removeMedicine(userId, medicineId)`
- [ ] Implement `syncMedicineStatuses()`
- [ ] Compute initial status on create
- [ ] Recompute status when `expiryDate` changes
- [ ] Exclude `REMOVED` from default list queries unless explicitly requested
- [ ] Enforce ownership by relying on user-scoped repository methods
- [ ] Throw typed `ApiError` values for not-found or invalid operations

### Acceptance Criteria

* Service owns medicine business rules
* Status logic is applied consistently on create, update, and sync
* Remove behavior is soft delete and idempotent

### QA After Task 3.5

- [ ] Spawn QA agent for service-layer review
- [ ] Confirm services contain business logic but no Prisma access
- [ ] Confirm status recomputation behavior is correct
- [ ] Confirm remove behavior does not hard-delete rows

---

## Task 3.6: Controllers & Routes

### Goal
Expose medicine APIs through authenticated, validated, Express 5 routes.

### Implementer Scope

* `src/controllers/medicine.controller.ts`
* `src/routes/medicine.routes.ts`
* `src/routes/index.ts`
* app/router integration if needed

### Implementation Checklist

- [ ] Create async controller handlers for create, list, getById, update, and remove
- [ ] Keep controllers limited to request extraction and response formatting
- [ ] Use authenticated `userId` from `req.user`
- [ ] Create medicine routes and mount them under the versioned API router
- [ ] Apply middleware in this order: `authenticate` -> validation -> controller
- [ ] Wire `POST /api/v1/medicines`
- [ ] Wire `GET /api/v1/medicines`
- [ ] Wire `GET /api/v1/medicines/:id`
- [ ] Wire `PATCH /api/v1/medicines/:id`
- [ ] Wire `PATCH /api/v1/medicines/:id/remove`
- [ ] Return `201` for create
- [ ] Return consistent success/error response shapes with project helpers

### Acceptance Criteria

* Medicine routes are authenticated and user-scoped
* Express 5 async error flow is preserved
* No business logic is embedded in controllers

### QA After Task 3.6

- [ ] Spawn QA agent for route/controller verification
- [ ] Confirm middleware order is correct
- [ ] Confirm route mounting path matches project versioning strategy
- [ ] Confirm each endpoint maps to the right service method

---

## Task 3.7: Scheduled Expiry Sync & Notification Stub

### Goal
Register a daily job that synchronizes medicine statuses and triggers a placeholder notification flow.

### Implementer Scope

* `src/jobs/medicine-expiry.job.ts`
* scheduler/bootstrap integration
* `src/services/notification.service.ts` or equivalent stub
* env-config integration for cron settings

### Implementation Checklist

- [ ] Add `node-cron` if not already installed
- [ ] Create a scheduler entrypoint or bootstrap hook for jobs
- [ ] Register the medicine expiry job once at app startup
- [ ] Read cron expression from env
- [ ] Read cron timezone from env
- [ ] Implement job handler that calls `MedicineService.syncMedicineStatuses()`
- [ ] Update only rows whose status changed
- [ ] Add a notification service interface or stub
- [ ] Trigger stub notifications only for newly changed relevant statuses
- [ ] Log job start, completion, duration, and failure
- [ ] Keep the job idempotent and safe to rerun

### Acceptance Criteria

* Cron registration is explicit and not duplicated
* Expiry sync runs through the service layer, not direct Prisma calls in job code
* Notification integration point exists without blocking milestone completion

### QA After Task 3.7

- [ ] Spawn QA agent for scheduled-job verification
- [ ] Confirm job registration is safe in development and tests
- [ ] Confirm the job does not perform full-table unsafe work by default
- [ ] Confirm notification behavior is stubbed cleanly and does not create hidden side effects

---

## Task 3.8: Testing & Verification

### Goal
Add enough tests to trust the milestone before handoff.

### Implementer Scope

* route/integration tests
* service tests
* pure expiry-logic tests

### Implementation Checklist

- [ ] Add unit tests for `ExpiryService`
- [ ] Cover yesterday, today, tomorrow, threshold boundary, and after-threshold cases
- [ ] Cover month-end or leap-year edge cases where practical
- [ ] Add tests for `MedicineService` create/list/get/update/remove flows
- [ ] Add tests for status recomputation on update
- [ ] Add tests for idempotent remove behavior
- [ ] Add route/integration tests for authenticated CRUD endpoints
- [ ] Verify unauthorized requests are rejected
- [ ] Verify invalid payloads are rejected
- [ ] Verify not-found medicine access returns `404`
- [ ] Verify list filtering and pagination behavior
- [ ] Verify removed medicines are excluded by default

### Acceptance Criteria

* Core medicine behaviors are covered by automated tests
* Boundary rules around expiry status are explicitly tested
* Auth, validation, and ownership behaviors are verified

### QA After Task 3.8

- [ ] Spawn QA agent for test-suite review
- [ ] Confirm the new tests cover the milestone acceptance criteria
- [ ] Confirm there are no obvious untested critical paths
- [ ] Confirm tests verify behavior, not implementation details only

---

## Task 3.9: Docs, Env, and Final Milestone Verification

### Goal
Finish the milestone with configuration and documentation updates so the feature is runnable by the team.

### Implementer Scope

* `.env.example`
* `README.md`
* relevant config documentation

### Implementation Checklist

- [ ] Add `MEDICINE_EXPIRING_SOON_DAYS`
- [ ] Add `MEDICINE_EXPIRY_CRON`
- [ ] Add `MEDICINE_EXPIRY_CRON_TIMEZONE`
- [ ] Document the medicine status lifecycle
- [ ] Document the soft-delete behavior for remove endpoint
- [ ] Document pagination/filter behavior for list endpoint
- [ ] Document how scheduled expiry sync is started
- [ ] Document any known limitations for single-instance cron execution
- [ ] Run final milestone verification pass across schema, API, cron, and tests

### Acceptance Criteria

* Another engineer can run and understand the medicine module without guessing
* Required environment variables are documented
* Milestone 3 is ready for implementation handoff or merge review

### QA After Task 3.9

- [ ] Spawn QA agent for final milestone review
- [ ] Confirm documentation matches implemented behavior
- [ ] Confirm env variables are complete and clearly described
- [ ] Confirm Milestone 3 definition of done is fully satisfied

---

## API Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /api/v1/medicines | Yes | Create medicine and compute initial status |
| GET | /api/v1/medicines | Yes | List user medicines with filters and pagination |
| GET | /api/v1/medicines/:id | Yes | Get one user-scoped medicine |
| PATCH | /api/v1/medicines/:id | Yes | Partially update a medicine |
| PATCH | /api/v1/medicines/:id/remove | Yes | Soft-remove a medicine |

---

## Implementation Order

1. Complete Prisma schema and migration work
2. Finalize medicine validation contracts
3. Build the medicine repository
4. Build the expiry logic service
5. Build the medicine service
6. Add controllers and routes
7. Add scheduled expiry sync and notification stub
8. Add tests
9. Update env docs and perform final QA

After each numbered task:

* spawn a QA agent
* resolve findings
* only then move to the next task

---

## Definition of Done

Milestone 3 is complete only when:

* medicine schema changes are migrated
* user-scoped CRUD endpoints are implemented
* expiry status logic is consistent across create, update, and scheduled sync
* remove is implemented as soft delete
* cron-based status sync is registered
* tests cover core behavior and edge cases
* docs and env variables are updated
* every task has passed its QA-agent verification step

