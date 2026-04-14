# Data Model and API Design Guidelines

This document is not the final schema, but it defines the structural rules that should guide database design and API design so the system stays extensible and consistent.

---

## 1. Data Design Principles

### Principle 1: Model the workflow, not just the form
Store complaint lifecycle states, assignments, approvals, and events explicitly.

### Principle 2: Store ownership and scope
Every complaint must know:
- which city it belongs to,
- which ward / zone it belongs to,
- which department it belongs to,
- who created it,
- and who is responsible for it now.

### Principle 3: Keep auditability first-class
Do not treat logs as optional developer output.

### Principle 4: Separate current state from history
Keep a current complaint record plus a state history / event table.

### Principle 5: Avoid schema dead ends
If a future city, department, or workflow change cannot be represented without altering core structure, the schema is too rigid.

---

## 2. Core Entity Set

### 2.1 User
Represents any authenticated actor.

Key fields:
- id,
- name,
- mobile / email,
- password hash or auth reference,
- role,
- status,
- city scope,
- department scope,
- ward / zone scope,
- language preference,
- created_at,
- updated_at.

---

### 2.2 Complaint
The main case record.

Key fields:
- id,
- complaint_number,
- created_by,
- title,
- description,
- category,
- subcategory,
- location,
- latitude,
- longitude,
- ward,
- zone,
- department,
- current_status,
- priority,
- duplicate_group_id,
- visibility,
- trust_score,
- created_at,
- updated_at.

---

### 2.3 Complaint Media
Stores images or attachments.

Key fields:
- id,
- complaint_id,
- media_type,
- storage_url,
- thumbnail_url,
- uploaded_by,
- created_at.

---

### 2.4 Complaint State History
Stores every state transition.

Key fields:
- id,
- complaint_id,
- from_state,
- to_state,
- changed_by,
- reason,
- timestamp.

---

### 2.5 Assignment
Tracks who is responsible for the complaint.

Key fields:
- id,
- complaint_id,
- assigned_to,
- assigned_by,
- department,
- status,
- deadline,
- accepted_at,
- rejected_at,
- completed_at.

---

### 2.6 Department
Represents civic departments.

Key fields:
- id,
- name,
- code,
- active,
- city_id,
- contact_info.

---

### 2.7 Ward / Zone
Represents geographic administrative units.

Key fields:
- id,
- name,
- geometry or boundary reference,
- city_id,
- active.

---

### 2.8 Notification
Stores in-app or push notification records.

Key fields:
- id,
- recipient_id,
- complaint_id,
- type,
- message,
- read_status,
- created_at.

---

### 2.9 Feedback
Stores citizen feedback after closure.

Key fields:
- id,
- complaint_id,
- user_id,
- rating,
- comment,
- created_at.

---

### 2.10 Audit Log
Stores all important actions.

Key fields:
- id,
- actor_id,
- action_type,
- entity_type,
- entity_id,
- before_state,
- after_state,
- ip_address,
- timestamp.

---

## 3. Useful Supporting Tables

Depending on scope, also include:
- complaint_comments,
- complaint_support_votes,
- escalation_records,
- SLA_policies,
- worker_skill_map,
- department_mapping_rules,
- attachments,
- tags,
- duplicate_clusters,
- task_routes,
- report_exports,
- and system_events.

---

## 4. Complaint State Design

Do not store status as an unrestricted text field.

Use an enum-like controlled model with transitions validated in service logic.

Recommended states:
- SUBMITTED
- DUPLICATE_CHECKED
- VERIFIED
- ROUTED
- ASSIGNED
- ACKNOWLEDGED
- IN_PROGRESS
- RESOLVED
- VERIFIED_FOR_CLOSURE
- CLOSED
- REOPENED
- REJECTED
- CANCELLED
- ESCALATED

---

## 5. API Design Principles

### Principle 1: Resource-oriented
Use clean REST-style endpoints for major entities.

### Principle 2: Role-aware
Endpoints should check role and scope.

### Principle 3: State-aware
Actions should be allowed only when the complaint is in a valid state.

### Principle 4: Idempotent where possible
Critical actions should not create duplicates on retry.

### Principle 5: Separate public and internal APIs
Citizen endpoints and admin endpoints should not be mixed casually.

---

## 6. Suggested API Groups

### Authentication
- register,
- login,
- logout,
- refresh token,
- OTP verify,
- password reset.

### Citizen complaints
- create complaint,
- list own complaints,
- view complaint details,
- reopen complaint,
- support complaint,
- submit feedback.

### Officer operations
- list queue,
- verify complaint,
- assign complaint,
- reassign complaint,
- approve resolution,
- reject resolution.

### Worker operations
- list assigned tasks,
- accept task,
- reject task,
- update progress,
- submit completion evidence.

### Admin operations
- department dashboard,
- zone analytics,
- SLA metrics,
- escalation queue,
- policy configuration.

### Public / transparency
- public complaint map,
- complaint cluster summaries,
- public status summary where policy permits.

### Reporting
- generate report,
- export PDF,
- export CSV,
- download department summary.

---

## 7. Service Layer Boundaries

Structure backend service logic in modules such as:
- auth service,
- complaint service,
- routing service,
- assignment service,
- notification service,
- analytics service,
- audit service,
- AI service,
- reporting service,
- user management service.

Keep state transitions inside service logic, not in controllers.

---

## 8. Validation Rules

Every complaint creation request should validate:
- description length,
- category validity,
- location availability,
- media type,
- file size,
- and user authorization.

Assignment requests should validate:
- complaint status,
- assignee role,
- department alignment,
- zone scope,
- and deadline correctness.

Closure requests should validate:
- completion proof,
- state correctness,
- officer permissions,
- and audit logging.

---

## 9. Duplicate Detection Logic

A duplicate issue should be determined using a combination of:
- distance threshold,
- time proximity,
- category match,
- semantic similarity,
- and image similarity where available.

The duplicate group should be stored as a cluster reference rather than forcing full deletion of duplicate records.

---

## 10. Search and Filter Guidelines

Support efficient filtering by:
- status,
- category,
- department,
- ward,
- zone,
- priority,
- date range,
- assignment owner,
- escalated flag,
- reopened flag,
- resolved flag.

This is essential for officer and admin productivity.

---

## 11. Analytics Data Requirements

To support future dashboards, store enough structured data to answer:
- how many issues were reported,
- how long each issue stayed in each state,
- how many were reopened,
- how many were duplicates,
- who handled them,
- which zones generate the most complaints,
- and which departments miss SLA most often.

---

## 12. Future Compatibility Requirements

The model should allow later addition of:
- multiple cities,
- citizen reputation / trust scoring,
- worker skill tags,
- incident grouping,
- IoT-triggered issues,
- external system integrations,
- and policy-based automation.

---

## 13. Implementation Safety Notes

- Do not use hardcoded department names in scattered places.
- Do not store workflow logic only in frontend.
- Do not leave geospatial logic outside the database layer.
- Do not make AI-generated suggestions authoritative without rules.
- Do not lose audit history on updates.

---

## 14. Final Structural Rule

If a future feature cannot be expressed through:
- a new table,
- a new relation,
- a new state,
- a new role permission,
- or a new event,

then the data model is probably too weak and should be redesigned before implementation.
