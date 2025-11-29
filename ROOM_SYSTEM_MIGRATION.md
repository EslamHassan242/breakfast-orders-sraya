# Multi-Tenant Room System - Database Migration Guide

This document outlines the database changes needed to support the new multi-tenant room system.

## Overview

The app now supports isolated ordering rooms. Each room has a unique UUID that prevents unauthorized access. All orders and votes are filtered by `room_id`.

## Required Database Changes

### 1. Add `room_id` column to `orders` table

```sql
ALTER TABLE orders
ADD COLUMN room_id UUID;

-- Optional: Add index for faster queries
CREATE INDEX idx_orders_room_id ON orders(room_id);

-- Optional: Add NOT NULL constraint after migrating existing data
-- ALTER TABLE orders ALTER COLUMN room_id SET NOT NULL;
```

### 2. Add `room_id` column to `votes` table

```sql
ALTER TABLE votes
ADD COLUMN room_id UUID;

-- Optional: Add index for faster queries
CREATE INDEX idx_votes_room_id ON votes(room_id);

-- Optional: Add NOT NULL constraint after migrating existing data
-- ALTER TABLE votes ALTER COLUMN room_id SET NOT NULL;
```

### 3. (Optional) Migrate existing data

If you have existing orders/votes that you want to assign to a default room:

```sql
-- Create a default room for existing data
INSERT INTO orders (room_id, ...) 
UPDATE orders 
SET room_id = '00000000-0000-0000-0000-000000000000' 
WHERE room_id IS NULL;
```

**Note:** For new installations, the `room_id` will always be required. For existing installations, you may want to either:
- Set a default room_id for all existing records
- Make room_id nullable initially and migrate gradually
- Archive old data without room_id

## How It Works

1. **Room Creation**: Users create a room and get a UUID v4 (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
2. **Room Sharing**: Users can share the Room ID or a direct link (`/?room=UUID`)
3. **Data Isolation**: All queries filter by `room_id`:
   - Orders only show within the same room
   - Votes only count within the same room
   - Each team's orders are completely isolated

## Security

- Room IDs use UUID v4 format (cryptographically random, unpredictable)
- No authentication required - only those with the Room ID can access
- Room IDs are stored in localStorage (client-side only)
- Server validates room_id format before processing queries

## Testing

1. Create a room and verify orders are saved with `room_id`
2. Join a room with the Room ID and verify you see only that room's orders
3. Create a second room and verify orders are isolated
4. Test sharing via URL parameter: `/?room=UUID`

