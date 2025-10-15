# User Model Refactoring - Migration Guide

## Changes Made

### 1. Renamed `enable` → `is_active`
The `enable` field has been renamed to `is_active` for better clarity.

**Before:**
```typescript
enable: {
  type: Number,
  default: 0
}
```

**After:**
```typescript
is_active: {
  type: Number,
  default: 0
}
```

### 2. Restructured Package Fields → Nested `package` Object

Package-related fields have been consolidated into a nested object structure.

**Before:**
```typescript
pack_id: {
  type: Schema.Types.ObjectId,
  ref: 'Package'
},
pack_start_date: {
  type: Date
},
pack_end_date: {
  type: Date
}
```

**After:**
```typescript
package: {
  id: {
    type: Schema.Types.ObjectId,
    ref: 'Package'
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  }
}
```

## Database Migration Required

### MongoDB Migration Script

Run this script to migrate existing user data:

```javascript
// migrate-user-fields.js
const mongoose = require('mongoose');
require('dotenv').config();

async function migrateUserFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Step 1: Rename 'enable' to 'is_active'
    console.log('Step 1: Renaming enable to is_active...');
    const renameResult = await usersCollection.updateMany(
      {},
      { $rename: { enable: 'is_active' } }
    );
    console.log(`Renamed enable to is_active for ${renameResult.modifiedCount} users`);

    // Step 2: Migrate package fields to nested structure
    console.log('Step 2: Migrating package fields...');
    
    const users = await usersCollection.find({
      $or: [
        { pack_id: { $exists: true } },
        { pack_start_date: { $exists: true } },
        { pack_end_date: { $exists: true } }
      ]
    }).toArray();

    console.log(`Found ${users.length} users with package data`);

    for (const user of users) {
      const packageData = {};
      
      if (user.pack_id) packageData.id = user.pack_id;
      if (user.pack_start_date) packageData.start_date = user.pack_start_date;
      if (user.pack_end_date) packageData.end_date = user.pack_end_date;

      // Update user with new package structure
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: { package: packageData },
          $unset: {
            pack_id: '',
            pack_start_date: '',
            pack_end_date: ''
          }
        }
      );
    }

    console.log(`Migrated package data for ${users.length} users`);

    // Step 3: Verify migration
    console.log('Step 3: Verifying migration...');
    const oldFieldsCount = await usersCollection.countDocuments({
      $or: [
        { enable: { $exists: true } },
        { pack_id: { $exists: true } },
        { pack_start_date: { $exists: true } },
        { pack_end_date: { $exists: true } }
      ]
    });

    if (oldFieldsCount === 0) {
      console.log('✅ Migration successful! All old fields removed.');
    } else {
      console.log(`⚠️ Warning: ${oldFieldsCount} users still have old fields`);
    }

    const newFieldsCount = await usersCollection.countDocuments({
      $or: [
        { is_active: { $exists: true } },
        { 'package.id': { $exists: true } },
        { 'package.start_date': { $exists: true } },
        { 'package.end_date': { $exists: true } }
      ]
    });

    console.log(`✅ ${newFieldsCount} users have new field structure`);

    await mongoose.disconnect();
    console.log('Migration complete!');
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateUserFields();
```

### How to Run Migration

1. **Save the script:**
   ```bash
   # Save as: src/migrations/migrate-user-fields.js
   ```

2. **Run the migration:**
   ```bash
   node src/migrations/migrate-user-fields.js
   ```

3. **Verify results:**
   Check the console output to ensure all users were migrated successfully.

## Code Changes Summary

### Files Modified:

1. **src/models/User.model.ts**
   - Changed `enable` → `is_active`
   - Restructured `pack_id`, `pack_start_date`, `pack_end_date` → `package { id, start_date, end_date }`
   - Added login validation for `is_active`

2. **src/interfaces/user.ts**
   - Updated interface to match new structure

3. **src/controllers/UserController.ts**
   - Updated profile response to use `is_active` and `package`

4. **src/services/AdminUserService.ts**
   - Updated approval logic to use `is_active`

5. **src/controllers/ExcelController.ts**
   - Updated package expiration checks to use `user.package?.end_date`

6. **src/controllers/ApiController.ts**
   - Updated package expiration checks to use `user.package?.end_date`

## API Response Changes

### Before:
```json
{
  "user": {
    "_id": "...",
    "enable": 1,
    "pack_start_date": "2025-01-01",
    "pack_end_date": "2025-12-31"
  }
}
```

### After:
```json
{
  "user": {
    "_id": "...",
    "is_active": 1,
    "package": {
      "id": "package_id_here",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31"
    }
  }
}
```

## Frontend Updates Required

If you have frontend code accessing these fields, update:

```javascript
// Before
if (user.enable === 1) { ... }
const endDate = user.pack_end_date;

// After
if (user.is_active === 1) { ... }
const endDate = user.package?.end_date;
```

## Rollback Plan

If you need to rollback:

```javascript
// rollback-user-fields.js
await usersCollection.updateMany({}, { $rename: { is_active: 'enable' } });

const users = await usersCollection.find({ 'package': { $exists: true } }).toArray();
for (const user of users) {
  await usersCollection.updateOne(
    { _id: user._id },
    {
      $set: {
        pack_id: user.package?.id,
        pack_start_date: user.package?.start_date,
        pack_end_date: user.package?.end_date
      },
      $unset: { package: '' }
    }
  );
}
```

## Testing Checklist

- [ ] Run migration script successfully
- [ ] Verify user login works
- [ ] Verify package expiration checks work
- [ ] Verify admin approval sets `is_active: 1`
- [ ] Verify profile endpoint returns correct structure
- [ ] Test Excel upload with package validation
- [ ] Test API product creation with package validation
- [ ] Update frontend code to use new field names

---

**Date:** October 15, 2025  
**Status:** Migration script ready, manual testing required
