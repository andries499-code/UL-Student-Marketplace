/*
# Security Hardening

## Fixes

1. **messages**: previously, a message's sender could update ANY column on
   their own message row (including `body`) at any time, letting them
   silently rewrite what they said after the other person already read it.
   This adds a trigger that only allows `read_at` to change on UPDATE —
   `body`, `sender_id`, `conversation_id`, and `created_at` become immutable
   after creation, regardless of who runs the UPDATE.

2. **storage.objects (listing-images)**: previously, any authenticated user
   could upload into the shared bucket at any path, with no check that the
   path belonged to them. The app already uploads to `${user.id}/filename`,
   so this tightens the INSERT policy to require the first folder segment
   of the path to match the uploader's own user id.
*/

-- ============ MESSAGES: lock down which columns can change ============
CREATE OR REPLACE FUNCTION prevent_message_content_edit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.body IS DISTINCT FROM OLD.body
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only read_at may be updated on an existing message';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_content_edit_blocked ON messages;
CREATE TRIGGER on_message_content_edit_blocked
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION prevent_message_content_edit();

-- ============ STORAGE: scope uploads to the uploader's own folder ============
DROP POLICY IF EXISTS "listing_images_insert_auth" ON storage.objects;
CREATE POLICY "listing_images_insert_own_folder" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
