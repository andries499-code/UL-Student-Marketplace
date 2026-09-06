/*
# Lock Conversation Identity Fields

## Problem

The `conversations_update_participants` policy allows either participant to
UPDATE any column on a conversation they're part of, including `listing_id`,
`buyer_id`, and `seller_id` — the fields that define what the conversation
actually IS. In practice this means a participant could, for example, change
`listing_id` to point the conversation at a different listing, or change
`seller_id` to a different user, effectively hijacking or corrupting an
existing conversation thread.

## Fix

Add a trigger that blocks changes to `listing_id`, `buyer_id`, and
`seller_id` on UPDATE. The only thing conversations should need to update
after creation is `updated_at` (e.g. bumped whenever a new message arrives).
*/

CREATE OR REPLACE FUNCTION prevent_conversation_identity_edit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.listing_id IS DISTINCT FROM OLD.listing_id
     OR NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
     OR NEW.seller_id IS DISTINCT FROM OLD.seller_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'listing_id, buyer_id, and seller_id cannot be changed after a conversation is created';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_conversation_identity_edit_blocked ON conversations;
CREATE TRIGGER on_conversation_identity_edit_blocked
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION prevent_conversation_identity_edit();
