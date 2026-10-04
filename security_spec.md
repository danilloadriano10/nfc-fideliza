# TapHub Firebase Security Specification

## 1. Data Invariants
1. A Company document must possess a valid unique `id` and `slug`.
2. Every Customer, PointRequest, Feedback, and ActivityLog must strictly belong to a valid `companyId`.
3. Point requests start in `status: "pending"`.
4. Point requests can only transition from `pending` to `approved` or `rejected`. Once `approved` or `rejected`, they cannot be altered.
5. In atomic point approvals, exactly 1 point is added, preventing double crediting.
6. Customers from company A cannot be viewed or modified by company B.
7. Customer phone numbers are scoped per establishment.

## 2. The "Dirty Dozen" Threat Payloads
1. **Ghost Tenant Injection**: Creating a point request with non-existent or blank `companyId`.
2. **State Skipping Attack**: Creating a point request directly with `status: "approved"` to bypass cashier approval.
3. **Double Approval Re-execution**: Submitting an approval action against a request that has already been approved.
4. **Tenant Data Leak**: Querying customer records without filtering by authorized `companyId`.
5. **Score Inflation**: Directly manipulating customer `currentPoints` from client side without cashier resolution.
6. **Negative Points Attack**: Subtracting points below 0 or setting arbitrary rewards.
7. **Cross-Company Feedback Hijack**: Reading feedback belonging to another business owner.
8. **Slug Hijack**: Modifying an existing company's slug to break pre-programmed NFC tags.
9. **Password Exposure**: Reading plain-text owner passwords across the public wire.
10. **Junk Character ID Attack**: Passing 1MB strings as document IDs to exhaust Firestore quotas.
11. **Negative Visits/Cycles**: Passing negative integers to totalVisits or completedCycles.
12. **Anonymous Point Credit**: Creating customer points with missing required phone or name.

## 3. Defense Enforcement
- Single source of truth in Cloud Firestore.
- Server-side atomic validation through API routes with atomic transactions and Firestore SDK.
- Rules enforcing read/write boundaries and schema validation.
