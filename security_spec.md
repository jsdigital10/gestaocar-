# Security Specification — GESTÃO CAR (Firestore Zero-Trust Rules)

## 1. Data Invariants
1. **Strict Tenant Isolation**: Every document under `/users/{uid}` and its subcollections (`rides`, `expenses`, `goals`, `settings`) belongs strictly to the user whose `request.auth.uid == uid`. Cross-user reads, lists, writes, or deletes are unconditionally denied.
2. **Relational Master Gate**: Subcollection single-document writes (`rides`, `expenses`, `goals`, `settings`) require that the parent user profile `/users/{uid}` exists or is created in the same transaction (`exists(...) || existsAfter(...)`) and matches `request.auth.uid`.
3. **Immutable Ownership & Creation Time**: `uid` and `createdAt` can never be mutated on update (`incoming().uid == existing().uid && incoming().createdAt == existing().createdAt`).
4. **Server Temporal Integrity**: `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
5. **Monetary & Numeric Bounds**: `amountCents` in `rides` and `expenses` must be positive integers (`> 0` and `<= 100000000`). Distances and durations must be non-negative numbers within realistic upper limits.
6. **Strict Schema Keys (`hasAll` & `hasOnly`)**: Neither shadow fields nor partial malformed schemas are permitted.

## 2. The "Dirty Dozen" Payloads (Designed to Break Identity, Integrity, and State)
1. **Cross-Tenant Read/Write**: Authenticated as `user_A`, attempting to write to `/users/user_B/rides/ride_1`.
2. **UID Spoofing in Payload**: Authenticated as `user_A`, writing to `/users/user_A/rides/ride_1` with `{ uid: "user_B", ... }`.
3. **Shadow Field Injection**: Creating `/users/user_A/rides/ride_1` with an extra `{ isAdmin: true }` property.
4. **Negative Monetary Value**: Creating a ride with `amountCents: -5000`.
5. **Floating-Point Cents Injection**: Creating an expense with `amountCents: 19.99` instead of integer cents.
6. **Client Timestamp Forgery**: Creating a ride with a forged past/future `createdAt` instead of `serverTimestamp()` (`request.time`).
7. **Immutable Field Mutation**: Updating an existing ride's `createdAt` or `uid` field.
8. **Oversized String Denial-of-Wallet**: Sending a 10,000-character string in `notes` (limit is 500 chars).
9. **Malformed Document ID Poisoning**: Creating a ride with ID containing special characters or length > 128.
10. **Invalid Enum Platform/Payment**: Creating a ride with `platform: "FakeApp"` or multiple payment methods concatenated.
11. **Unbounded Custom Categories Array**: Updating `/users/user_A/settings/preferences` with 100 custom categories (limit is 30).
12. **Unauthorized List Scraping**: Listing `/users/user_B/expenses` while authenticated as `user_A`.
