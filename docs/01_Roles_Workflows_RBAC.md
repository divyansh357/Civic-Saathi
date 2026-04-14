# Roles, Workflows, and RBAC Specification

This document defines who uses the system, what they can do, how they interact with complaints, and how access control should be enforced.

---

## 1. Role Model

### 1.1 Citizen
Citizen is the reporting and feedback role.

Capabilities:
- register / login,
- submit complaints,
- attach images,
- provide text or voice descriptions,
- view complaint status,
- receive notifications,
- support existing complaints,
- give feedback after closure,
- reopen unresolved complaints,
- and view public complaint maps where allowed.

Restrictions:
- cannot assign issues,
- cannot modify department queues,
- cannot edit other users’ complaints,
- cannot approve closure,
- cannot view internal notes,
- cannot override system decisions.

---

### 1.2 Field Worker
Field Worker is the execution role.

Capabilities:
- view assigned tasks,
- accept or reject assignments if policy allows,
- navigate to complaint locations,
- update progress,
- upload before/after evidence,
- request clarification,
- mark work as resolved,
- and see daily task summaries.

Restrictions:
- cannot change priority rules,
- cannot approve final closure unless explicitly permitted,
- cannot see system-wide analytics,
- cannot access citizen private data beyond task scope.

---

### 1.3 Department Officer
Department Officer is the operational triage role.

Capabilities:
- view complaints in their jurisdiction,
- verify complaints,
- classify or reclassify complaints,
- assign tasks to workers,
- reassign tasks,
- set deadlines,
- monitor SLA,
- add internal notes,
- and approve or reject resolution requests.

Restrictions:
- cannot alter city-level policy,
- cannot access all departments unless granted permission,
- cannot delete audit history,
- cannot bypass controlled workflows.

---

### 1.4 City Admin
City Admin is the high-level municipal operations role.

Capabilities:
- view all departments,
- monitor performance dashboards,
- view heatmaps,
- manage escalation,
- configure SLA thresholds,
- manage departments and zones,
- view audit summaries,
- and generate reports.

Restrictions:
- should not normally alter complaint evidence,
- should not directly perform field execution,
- should not bypass approval chains without traceability.

---

### 1.5 Super Admin
Super Admin is the platform governance role, useful for future multi-city scaling.

Capabilities:
- manage cities,
- manage global system settings,
- define role templates,
- configure platform-level integrations,
- oversee security policies,
- and inspect system health.

Restrictions:
- should be separate from day-to-day municipal operation,
- should not be used for normal complaint handling.

---

## 2. RBAC Principles

### Rule 1: Least privilege
Each user gets only the permissions necessary for the role.

### Rule 2: Scope-based access
Permissions should be limited by:
- city,
- department,
- ward,
- zone,
- and complaint ownership where relevant.

### Rule 3: State-based authorization
Permissions should depend on complaint state.

Example:
- a citizen can reopen only after closure,
- a worker can resolve only assigned complaints,
- an officer can verify only complaints in scope.

### Rule 4: Audit-first design
Every privileged action should be logged.

### Rule 5: No hidden side effects
A role should not silently gain extra powers just because it reaches a different screen.

---

## 3. Complaint Lifecycle State Machine

A complaint should move through a controlled state machine.

### Recommended states
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

### Important rule
State changes should be explicit and validated.  
The system should never allow arbitrary jumps without business rules.

---

## 4. Citizen Workflows

### 4.1 Registration and login
- citizen registers with mobile number or email,
- OTP or password-based login,
- profile setup,
- optional language preference,
- optional locality / ward association.

### 4.2 Complaint submission
- open form,
- capture or upload image,
- auto-detect location,
- enter description or voice note,
- choose category or accept AI suggestion,
- submit complaint,
- receive complaint ID.

### 4.3 Tracking workflow
- open “My Complaints,”
- see current state,
- see timeline,
- receive push notification on transitions,
- optionally view mapped location.

### 4.4 Feedback workflow
- complaint marked resolved,
- citizen receives closure notification,
- citizen rates service and adds feedback,
- system stores satisfaction score.

### 4.5 Reopen workflow
- if issue remains, citizen reopens complaint,
- adds reason and optional evidence,
- complaint re-enters routing or verification queue.

### 4.6 Support / upvote workflow
- citizen supports an existing nearby complaint,
- system increases priority score,
- system links citizen support to the issue cluster.

### 4.7 Anonymous reporting workflow
- allow limited reporting without full identity,
- restrict features,
- lower trust score,
- and route through anti-spam validation.

---

## 5. Field Worker Workflows

### 5.1 Task intake
- view assigned tasks,
- inspect complaint details,
- accept or reject where policy permits,
- confirm expected completion time.

### 5.2 Task execution
- navigate to complaint location,
- start work,
- update progress,
- add comments,
- request additional information if needed.

### 5.3 Completion
- upload after-image,
- mark task as resolved,
- provide closure notes,
- wait for officer approval if required.

### 5.4 Daily planning
- view ordered task list,
- optionally use route-optimized sequence,
- complete tasks in priority order.

### 5.5 Rework / correction
- if a task is rejected, revise or revisit,
- upload additional evidence,
- resubmit resolution.

---

## 6. Department Officer Workflows

### 6.1 Complaint review
- inspect incoming queue,
- validate complaint quality,
- identify duplicates,
- verify category and jurisdiction.

### 6.2 Assignment workflow
- choose worker manually or by policy,
- set deadline,
- assign complaint,
- notify worker.

### 6.3 Monitoring workflow
- track pending tasks,
- detect delays,
- inspect SLA breaches,
- review map-based clustering.

### 6.4 Reassignment workflow
- if worker rejects or misses deadline,
- reassign to another worker,
- log reason.

### 6.5 Verification workflow
- review resolution proof,
- approve closure or send back for rework,
- maintain traceability.

### 6.6 Escalation handling
- inspect escalated complaints,
- take administrative action,
- re-route or force resolution steps.

---

## 7. City Admin Workflows

### 7.1 System oversight
- monitor city-wide complaint load,
- inspect department metrics,
- compare zones,
- track trends over time.

### 7.2 Policy configuration
- define SLAs,
- configure priority rules,
- map categories to departments,
- configure escalation thresholds.

### 7.3 Incident management
- merge related complaints into a single incident,
- coordinate multi-team response,
- oversee critical cases such as flooding, outage, or contamination.

### 7.4 Reporting
- download summaries,
- inspect resolution times,
- measure citizen satisfaction,
- identify high-pain zones.

---

## 8. Super Admin Workflows

### 8.1 Multi-city governance
- create new city tenants,
- assign local admins,
- apply global templates.

### 8.2 Platform configuration
- manage identity providers,
- set security baselines,
- manage feature flags,
- inspect logs and health.

---

## 9. System Automation Workflows

### 9.1 Duplicate detection
- compare new complaint against nearby complaints,
- use spatial proximity and semantic similarity,
- link duplicates,
- optionally merge or cluster.

### 9.2 Priority scoring
- score by category,
- score by location sensitivity,
- score by upvotes,
- score by age,
- score by recurrence.

### 9.3 Routing engine
- map category to department,
- check jurisdiction,
- detect nearest field unit if applicable,
- create assignment queue.

### 9.4 Escalation engine
- trigger escalation when SLA is violated,
- escalate repeated reopen cases,
- escalate high-impact complaints faster.

### 9.5 Notification engine
- send push notification when status changes,
- create in-app notification,
- send summary alerts on overdue tasks.

### 9.6 Audit engine
- log every state transition,
- log every role-action event,
- keep an immutable trail.

---

## 10. Edge-Case Workflows

### 10.1 Worker rejects assignment
- complaint returns to queue,
- reason is logged,
- officer is notified.

### 10.2 Complaint is false or abusive
- officer marks invalid,
- reason is recorded,
- trust score may be adjusted.

### 10.3 No worker is available
- complaint remains unassigned,
- escalation timer starts,
- city admin can intervene.

### 10.4 Citizen reopens repeatedly
- complaint is flagged for manual review,
- abuse detection may apply.

### 10.5 System outage or temporary failure
- queue events safely,
- retry later,
- prevent data loss,
- maintain idempotency.

---

## 11. Workflow Design Rules for Future-Proofing

### 11.1 Use state machines
Do not store complaints as free-form status text.

### 11.2 Use events internally
Each major action should produce an event that can trigger downstream processes.

### 11.3 Keep modules decoupled
Complaint handling, notifications, reporting, and AI should not be tightly welded together.

### 11.4 Preserve extensibility
New roles, departments, categories, and cities must be addable without schema redesign.

### 11.5 Keep authorization state-aware
The same role should not have identical permissions in every complaint state.

---

## 12. Permission Matrix Outline

A proper RBAC matrix should be generated during implementation, but the design baseline is:

| Action | Citizen | Field Worker | Department Officer | City Admin | Super Admin |
|---|---:|---:|---:|---:|---:|
| Submit complaint | Yes | No | No | No | No |
| View own complaint | Yes | No | Yes, scoped | Yes | Yes |
| Assign complaint | No | No | Yes | Yes | Yes |
| Update resolution | No | Yes | Yes, verify | Yes | Yes |
| Approve closure | No | No | Yes | Yes | Yes |
| View analytics | No | No | Limited | Yes | Yes |
| Change policies | No | No | No | Yes | Yes |
| Manage cities | No | No | No | No | Yes |

---

## 13. Implementation Note

The RBAC model should be enforced:
- at the API layer,
- at the service layer,
- and in the frontend route guards.

Do not rely only on frontend hiding buttons.
