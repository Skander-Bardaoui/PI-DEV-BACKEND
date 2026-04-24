# Deprecated Scripts

The following scripts in `src/scripts/` are deprecated and need to be updated or removed:

## Scripts to Update/Remove

1. **check-member-permissions.ts** - Uses old `permissions` string field
2. **fix-permission-format.ts** - Uses old `permissions` string field and `getRoleDefaultPermissions()`
3. **test-permission-utils.ts** - Tests old string-based permission utilities

## Reason

These scripts were written for the old string-based permission system (`permissions: string`).
The system has been migrated to granular JSONB permissions:
- `collaboration_permissions: Record<string, boolean>`
- `stock_permissions: Record<string, boolean>`

## Action Required

Either:
1. Delete these scripts if they're no longer needed
2. Rewrite them to work with the new granular permission system

## Temporary Solution

These scripts have been left in place but will cause TypeScript compilation errors.
They can be safely ignored or deleted as they are utility/testing scripts, not part of the main application.
