# Community Hero Security Specifications & Hardened Audit Spec

This specification outlines the data invariants, threat model, and "Dirty Dozen" test payloads designed to probe and verify the security integrity of the **Community Hero** platform's Firestore database.

---

## 1. Data Invariants

1. **User Role Lock-in**: Users cannot self-escalate their roles (e.g., from `Citizen` to `Officer` or `Admin`). Newly created user documents MUST have the role set to `Citizen`.
2. **Reporter Accountability**: The `reporterId` of any reported issue MUST match the authenticated user's UID (`request.auth.uid`). No spoofed reports are allowed.
3. **Temporal Validity**: Timestamp properties (`createdAt`, `updatedAt`) MUST be strictly validated against the server timestamp (`request.time.toMillis()`).
4. **Idempotency of Verification**: A citizen cannot upvote/verify the same issue multiple times. This is guarded at the database level by the composite key schema of the `/upvotes` collection: `issueId_userId`.
5. **No Orphaned Comments**: Comments must reference a valid, pre-existing issue in `/issues` verified via `exists()`.
6. **Immutable Fields**: High-value attributes such as `reporterId` and `createdAt` are immutable and cannot be altered after creation.

---

## 2. The "Dirty Dozen" Threat Payloads

Below are twelve malicious payloads designed to test and break our rules. Every payload MUST return `PERMISSION_DENIED` on submission.

### T1: Self-Privilege Escalation
* **Vector**: Citizen registers as an Administrator during onboarding.
* **Payload**:
  ```json
  {
    "uid": "victim_user_123",
    "email": "victim@gmail.com",
    "displayName": "Infiltrator",
    "role": "Admin",
    "createdAt": 1729000000000
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (role must be default `Citizen` or assigned through server/admin).

### T2: Identity Spoofing (Report as Someone Else)
* **Vector**: A user submits a civic issue but sets the `reporterId` to a different user's UID to frame them or make fake claims.
* **Payload**:
  ```json
  {
    "id": "issue_abc",
    "title": "Fake Pothole Report",
    "description": "Pothole spotted",
    "category": "Pothole",
    "severity": "High",
    "status": "Submitted",
    "location": { "lat": 37.7749, "lng": -122.4194 },
    "reporterId": "innocent_citizen_uid",
    "upvotes": 1,
    "createdAt": 1729000000000,
    "updatedAt": 1729000000000
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (the reporterId must match `request.auth.uid`).

### T3: Temporal Tampering (Backdated Timestamp)
* **Vector**: Citizen submits a report with a historical or future creation timestamp to skew analytics or urgency.
* **Payload**:
  ```json
  {
    "id": "issue_pqr",
    "title": "Damaged streetlight",
    "createdAt": 1000000000000
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (`createdAt` must match `request.time.toMillis()`).

### T4: Double Verification / Upvote Spam
* **Vector**: A malicious actor attempts to write a second upvote entry or artificially inflate the issue upvotes by skipping the upvote mapping.
* **Payload**:
  ```json
  {
    "id": "issue_pqr_malicious_attacker_uid",
    "issueId": "issue_pqr",
    "userId": "another_victim_uid"
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (uid must match authenticated user, composite document key must match `issueId_userId`).

### T5: Orphaned Comment Injection
* **Vector**: Attacker writes a comment referencing an issue that does not exist.
* **Payload**:
  ```json
  {
    "id": "comment_999",
    "issueId": "non_existent_issue_id",
    "userId": "attacker_uid",
    "userName": "Hacker",
    "text": "Fake comment",
    "createdAt": 1729000000000
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (fails the `exists()` verification on the parent issue).

### T6: Status Hijacking / Unverified Closure
* **Vector**: A Citizen attempts to mark their own issue as "Resolved" without officer verification or city inspection.
* **Payload**:
  ```json
  {
    "status": "Resolved"
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (status transitions are strictly guarded; citizens can only edit title, description, and category; only officers or admins can change status).

### T7: Path Injection / Denial of Wallet Attack
* **Vector**: Injecting an extremely long, malicious string into the `issueId` path variable to trigger memory allocation errors or inflate read costs.
* **Payload**: Path variable `/issues/long_junk_string_containing_bytes_to_poison_indexing...`
* **Expected Result**: `PERMISSION_DENIED` (guarded by `isValidId(issueId)` constraint).

### T8: Ghost Field Injection (Shadow Update)
* **Vector**: Attacker updates an issue and injects an unmapped field to exploit undocumented database schemas.
* **Payload**:
  ```json
  {
    "title": "Updated pothole",
    "ghost_admin_field": "unauthorized_override"
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (`keys().hasAll()` and strict size validation prevents undocumented fields).

### T9: Modifying Immutable Historical Data
* **Vector**: A user attempts to update their user registration `createdAt` timestamp.
* **Payload**:
  ```json
  {
    "createdAt": 1700000000000
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (`createdAt` must equal existing `createdAt`).

### T10: Comment Identity Spoofing
* **Vector**: Attacker attempts to post a comment using another user's display name or UID.
* **Payload**:
  ```json
  {
    "id": "comment_xyz",
    "issueId": "issue_123",
    "userId": "target_victim_uid",
    "userName": "Admin",
    "text": "Your issue is rejected."
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (userId must strictly match `request.auth.uid`).

### T11: Fraudulent Audit Log Writing
* **Vector**: Attacker tries to inject fake history into the audit trail.
* **Payload**:
  ```json
  {
    "id": "log_fake",
    "actorId": "victim_uid",
    "actorName": "Chief Officer",
    "action": "Issue Approved"
  }
  ```
* **Expected Result**: `PERMISSION_DENIED` (must be written with auth actorId equal to caller's UID and valid timestamps).

### T12: PII Data Leakage via Blanket Queries
* **Vector**: A user attempts to run a blanket list query on the `users` collection.
* **Expected Result**: `PERMISSION_DENIED` (blanket `list` queries on user accounts are restricted to admins only to prevent user directory scraping).
