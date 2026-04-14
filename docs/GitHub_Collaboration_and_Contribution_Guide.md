# GitHub Collaboration and Contribution Guide
## Project: Crowdsourced Civic Issue Reporting and Resolution System

This document defines how the team should use GitHub while building the project.
It is meant to keep the repository clean, avoid merge conflicts, preserve accountability, and make the codebase easy to scale.

---

## 1. Purpose of the GitHub Workflow

The GitHub process must support:

- clean team collaboration
- predictable branch usage
- safe code reviews
- traceable contributions
- stable main branch
- easy release management
- future scaling without repository chaos

The repository should never be used as a dumping ground for unfinished work.
Every contribution should follow a clear path from planning to review to merge.

---

## 2. Recommended Repository Structure

Use one monorepo unless the project becomes very large.

### Suggested top-level structure

```text
project-root/
├── backend/
├── mobile-app/
├── web-dashboard/
├── docs/
├── scripts/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
├── README.md
├── CONTRIBUTING.md
├── LICENSE
├── .gitignore
└── docker-compose.yml
```

### What each folder is for

- `backend/`  
  Spring Boot APIs, business logic, database layer, security, services, background jobs.

- `mobile-app/`  
  React Native app for citizens and, if needed, field staff.

- `web-dashboard/`  
  Admin and department dashboards in React.js.

- `docs/`  
  Architecture notes, workflow docs, API notes, roadmap, and team decisions.

- `scripts/`  
  Database scripts, seed data, helper scripts, deployment utilities.

- `.github/`  
  GitHub issue templates, PR template, and CI/CD workflows.

---

## 3. Branching Strategy

Use a simple, disciplined branching model.

### Main branches

#### `main`
- Always stable
- Always deployable
- Only receives approved merges
- Never used for direct development

#### `dev`
- Integration branch for ongoing development
- Receives merged feature branches
- May be unstable for short periods, but should still be mostly functional

### Supporting branches

#### `feature/<short-name>`
Used for new functionality.

Examples:
- `feature/login-rbac`
- `feature/complaint-upload`
- `feature/admin-dashboard`
- `feature/map-heatmap`
- `feature/fcm-notifications`

#### `bugfix/<short-name>`
Used for fixes.

Examples:
- `bugfix/duplicate-complaint-check`
- `bugfix/image-upload-fail`
- `bugfix/auth-token-expiry`

#### `hotfix/<short-name>`
Used for urgent issues in production or demo builds.

Examples:
- `hotfix/login-crash`
- `hotfix/api-timeout`

#### `docs/<short-name>`
Used for documentation-only updates.

Examples:
- `docs/readme-update`
- `docs/api-spec`

#### `refactor/<short-name>`
Used for internal cleanup without changing behavior.

Examples:
- `refactor/service-layer`
- `refactor/api-validation`

---

## 4. Branch Rules

### Never do this
- work directly on `main`
- keep long-lived unmerged branches with large drift
- mix unrelated tasks in one branch
- merge unfinished code into `dev`
- force-push shared branches unless the team agrees

### Recommended rule
A branch should represent **one task or one small cluster of closely related tasks**.

### Branch lifespan
Try to keep branches short-lived:
- small task: 1–2 days
- medium task: 3–5 days
- large task: split into smaller branches

---

## 5. Role-Based GitHub Responsibilities

The team has 4 members. Assign responsibilities clearly.

### Member 1: Backend Engineer
Responsibilities:
- Spring Boot APIs
- database schema
- service layer
- security and RBAC
- integration with storage, notifications, and background jobs

GitHub behavior:
- creates backend feature branches
- opens backend PRs
- writes API notes in docs if needed

### Member 2: Frontend / Mobile Engineer
Responsibilities:
- React Native citizen app
- React admin dashboard
- UI state management
- frontend API integration
- forms, maps, and workflow screens

GitHub behavior:
- creates frontend feature branches
- opens UI/UX PRs
- adds screenshots to PRs when relevant

### Member 3: Full-Stack / Integration Engineer
Responsibilities:
- glue between backend and frontend
- authentication flow integration
- map + complaint lifecycle integration
- notifications and realtime updates
- deployment support

GitHub behavior:
- reviews both backend and frontend PRs
- handles cross-module issues
- maintains integration branches if required

### Member 4: Presentation / Product / QA Lead
Responsibilities:
- documentation
- issue tracking
- test cases
- PR review checklist
- release notes
- demo scripts
- PPT and presentation artifacts

GitHub behavior:
- creates issues
- labels tasks
- validates PR descriptions
- tracks milestones and progress
- maintains docs and changelog

---

## 6. Contribution Workflow

This is the standard development path.

### Step 1: Create or pick an issue
Every task should begin as a GitHub Issue.

The issue should contain:
- problem statement
- expected output
- module affected
- priority
- assignee
- acceptance criteria

### Step 2: Create a branch
Branch from `dev`, not from `main`.

Example:
```bash
git checkout dev
git pull origin dev
git checkout -b feature/complaint-status-timeline
```

### Step 3: Develop the feature
During development:
- commit small changes
- keep commits focused
- avoid unrelated edits
- update docs if workflow changes

### Step 4: Push branch to GitHub
```bash
git push origin feature/complaint-status-timeline
```

### Step 5: Open a Pull Request
Open PR from the feature branch into `dev`.

The PR must include:
- what was changed
- why it was changed
- screenshots or API examples if relevant
- how to test
- linked issue number

### Step 6: Review
At least one team member should review before merge.
For critical modules, get two reviews.

### Step 7: Merge into `dev`
Only merge after:
- code review approval
- basic testing
- no unresolved conflicts
- docs updated if needed

### Step 8: Promote from `dev` to `main`
Only when a stable milestone is ready:
- demo build
- tested feature set
- release candidate

---

## 7. Commit Message Rules

Use clear, meaningful commit messages.

### Good format
```text
type: short summary
```

### Recommended types
- `feat` for new features
- `fix` for bug fixes
- `docs` for documentation
- `refactor` for cleanup
- `test` for test updates
- `chore` for config or maintenance
- `style` for formatting only

### Examples
```text
feat: add complaint image upload
fix: prevent duplicate complaint submission
docs: update workflow guide
refactor: simplify routing service
test: add validation tests for login
```

### Commit guidelines
- one logical change per commit
- avoid vague messages like `update` or `changes`
- do not commit broken code if it can be avoided
- commit often enough to preserve work, but not every tiny edit

---

## 8. Pull Request Rules

Every PR should be easy to review.

### PR title
Should be short and descriptive.

Examples:
- `Add complaint submission screen`
- `Implement RBAC middleware`
- `Fix duplicate detection bug`

### PR description should contain
- summary of changes
- linked issue
- test evidence
- screenshots or sample payloads
- notes about edge cases
- any follow-up work

### PR checklist
- code runs locally
- no secrets committed
- no unused debug logs
- validation added where needed
- documentation updated
- tested with sample data

---

## 9. Review Standards

Reviews should not be casual approvals.
They should check whether the change is safe, maintainable, and aligned with the product.

### Review checklist
- Does it solve the issue?
- Does it break existing workflow?
- Are permissions correct?
- Is the API stable?
- Is the UI understandable?
- Are edge cases handled?
- Are logs and error handling enough?
- Is the code readable and modular?

### Review rules
- request changes if a feature introduces dead ends
- request changes if role permissions are too broad
- request changes if data flow is unclear
- request changes if the code cannot scale later

---

## 10. Issue Tracking Rules

Use GitHub Issues as the source of truth for work.

### Labels to use
- `backend`
- `frontend`
- `mobile`
- `admin`
- `bug`
- `feature`
- `docs`
- `urgent`
- `blocked`
- `research`
- `ui`
- `api`
- `database`
- `deployment`

### Issue states
- To Do
- In Progress
- Review
- Testing
- Done
- Blocked

### Issue template should include
- title
- problem statement
- expected result
- acceptance criteria
- assignee
- priority
- dependencies
- screenshots or references if needed

---

## 11. Milestones and Project Planning

Use milestones to group work.

### Example milestones
- `M1 - Authentication and RBAC`
- `M2 - Complaint Lifecycle`
- `M3 - Admin Dashboard`
- `M4 - Notifications and Realtime Updates`
- `M5 - Analytics and Reports`
- `M6 - Final Integration and Demo`

Milestones help avoid random feature development and keep the roadmap visible.

---

## 12. Code Ownership Strategy

To avoid confusion, each module should have an owner.

### Suggested ownership
- Auth / Security → Backend Engineer
- Complaint Flow → Backend Engineer + Full-Stack Engineer
- Mobile UI → Frontend / Mobile Engineer
- Admin Dashboard → Frontend / Mobile Engineer + Full-Stack Engineer
- Documentation / QA → Presentation / Product / QA Lead

Ownership does not mean exclusion.
It means one person is responsible for keeping the module organized.

---

## 13. Merge Policy

### Merge into `dev`
Allowed only after:
- review approval
- local tests pass
- branch is up to date with `dev`
- no unresolved comments

### Merge into `main`
Allowed only after:
- release is stable
- code is demo-ready
- no critical open bugs
- milestone is complete

### Recommended merge method
Use **squash merge** for feature branches when you want a clean history.
Use regular merge when preserving commit history matters.

---

## 14. Handling Conflicts

Conflicts are normal in team development.

### Best practice
- pull latest `dev` often
- keep branches small
- communicate before editing the same files
- resolve conflicts early

### Conflict resolution rule
If two people need the same file:
- announce the area in the team chat
- split responsibility by component or function
- avoid silent overlapping edits

---

## 15. Secrets and Environment Variables

Never commit:
- API keys
- JWT secrets
- database passwords
- service account files
- private certificates

### Use:
- `.env`
- `.env.example`
- GitHub Secrets for deployment

### `.env.example` should contain:
- variable names
- placeholder values
- no actual secrets

---

## 16. Documentation Responsibilities

Documentation is not optional.

### Must maintain
- `README.md`
- setup instructions
- API documentation
- database schema notes
- workflow document
- role definitions
- release notes

### When to update docs
Update documentation when:
- API contract changes
- workflow changes
- role permissions change
- deployment steps change
- feature behavior changes

---

## 17. Suggested GitHub Automation

If possible, configure GitHub Actions for:
- build checks
- linting
- test execution
- dependency scanning
- formatting checks

### Minimum pipeline
For every PR:
- install dependencies
- run tests
- run lint
- build project

This prevents broken merges.

---

## 18. Suggested Team Operating Rules

### Daily rule
Each member should report:
- what they worked on
- what they plan next
- any blockers

### Before starting a task
- check if an issue already exists
- assign yourself
- create a branch
- mention it in the team chat

### Before merge
- ensure the branch is updated
- test the feature
- attach proof
- request review

---

## 19. Example Weekly Workflow

### Monday
- finalize issues
- assign tasks
- create branches

### Tuesday to Thursday
- development
- PR creation
- code review

### Friday
- integration
- bug fixing
- documentation update

### Weekend
- demo prep
- milestone review
- backlog cleanup

---

## 20. Release Workflow

When preparing a demo or release:

### Step 1
Freeze new feature work.

### Step 2
Create a release branch from `dev`.

Example:
```bash
git checkout dev
git checkout -b release/v1.0
```

### Step 3
Only allow bug fixes and polish.

### Step 4
Test end-to-end.

### Step 5
Merge into `main` and tag the release.

Example:
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 21. Suggested File Naming for GitHub Docs

Add these files to the repo:

- `README.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `CHANGELOG.md`
- `docs/architecture.md`
- `docs/workflows.md`
- `docs/rbac.md`
- `docs/api.md`
- `docs/github-workflow.md`

---

## 22. Minimum Contribution Rules for the Team

1. Every task must have an issue.
2. Every branch must have a clear name.
3. Every PR must explain the change.
4. Every merge must be reviewed.
5. Every major module must be documented.
6. No direct pushes to `main`.
7. No large unrelated changes in one PR.
8. No secrets in GitHub.
9. No dead-end code paths.
10. Keep the repo stable.

---

## 23. Final Recommended Git Model for This Project

### Simple version
- `main` → stable production/demo code
- `dev` → integration branch
- `feature/*` → development branches
- `bugfix/*` → fixes
- `hotfix/*` → urgent patching
- `docs/*` → documentation

This model is enough for your team of 4 and is easy to maintain.

---

## 24. Practical Rule for Your Team

If a change is:
- small and isolated → feature branch
- production-breaking → hotfix branch
- documentation only → docs branch
- cleanup only → refactor branch

Do not overcomplicate the workflow.
The goal is to make progress without losing control of the codebase.

---

## 25. Final Reminder

The GitHub repo should reflect a real engineering process, not just uploaded code.
A clean repository will help with:
- team coordination
- future expansion
- demo quality
- funding discussions
- internship/placement presentation
- long-term maintainability

Keep the repository structured from day one.
