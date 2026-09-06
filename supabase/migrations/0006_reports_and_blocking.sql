/*
# Reports and Blocking

## New tables

1. `reports` — lets a user report a listing or another user. Reporters can
   see their own submitted reports (so they know it went through) but not
   anyone else's. There's deliberately no admin/review UI wired up yet —
   this just captures the data so it exists once one is built. Rows are
   never visible to the reported party.

2. `blocked_users` — lets a user block another user. A block is one-way
   (only the blocker needs to know about it) and stops the blocked user
   from being able to message the blocker going forward.

## Enforcement

The existing `messages_insert_participants` policy is replaced with a
version that also checks neither participant has blocked the other before
allowing a new message into an existing conversation.
*/

-- ============ REPORTS ============
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('listing', 'user')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_own" ON reports;
CREATE POLICY "reports_select_own" ON reports FOR SELECT
  TO authenticated USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);

-- ============ BLOCKED USERS ============
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_users_select_own" ON blocked_users;
CREATE POLICY "blocked_users_select_own" ON blocked_users FOR SELECT
  TO authenticated USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "blocked_users_insert_own" ON blocked_users;
CREATE POLICY "blocked_users_insert_own" ON blocked_users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "blocked_users_delete_own" ON blocked_users;
CREATE POLICY "blocked_users_delete_own" ON blocked_users FOR DELETE
  TO authenticated USING (auth.uid() = blocker_id);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);

-- ============ ENFORCE BLOCKS ON MESSAGING ============
DROP POLICY IF EXISTS "messages_insert_participants" ON messages;
CREATE POLICY "messages_insert_participants" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
      AND NOT EXISTS (
        SELECT 1 FROM blocked_users b
        WHERE (b.blocker_id = c.buyer_id AND b.blocked_id = c.seller_id)
           OR (b.blocker_id = c.seller_id AND b.blocked_id = c.buyer_id)
      )
    )
    AND auth.uid() = sender_id
  );
