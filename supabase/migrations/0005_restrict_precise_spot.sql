/*
# Restrict precise_spot to the seller and interested buyers only

## Problem

`listings.precise_spot` holds whatever exact meetup detail a seller typed in
(a room number, a res name, a home address — whatever they entered). Unlike
`meetup_location` (a safe, broad zone from a fixed list), this field was
being returned to ANYONE who loaded a listing's detail page, including
users who have never messaged the seller. That's a real privacy/safety
issue now that real people are posting real listings.

## Fix

1. Revoke column-level SELECT on `precise_spot` from `anon` and
   `authenticated`, so a plain `select('*')` (or any query naming this
   column directly) can no longer return it to anyone.
2. Add a SECURITY DEFINER function `get_precise_spot(p_listing_id)` that
   returns the value only if the caller is the listing's seller, OR the
   caller is a participant in an existing conversation about that listing
   (i.e. they've already started chatting about it). Everyone else gets
   NULL.
3. The frontend must now fetch `precise_spot` via this function instead of
   selecting it directly — see the accompanying frontend changes.

Note: INSERT/UPDATE on this column are untouched by this migration, since
those are governed by existing table-level grants + RLS, not the
column-level SELECT grant. Sellers can still set/edit their own
precise_spot as before.
*/

REVOKE SELECT (precise_spot) ON listings FROM anon, authenticated;

CREATE OR REPLACE FUNCTION get_precise_spot(p_listing_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_spot text;
  v_seller_id uuid;
BEGIN
  SELECT precise_spot, seller_id INTO v_spot, v_seller_id
  FROM listings WHERE id = p_listing_id;

  IF v_seller_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF auth.uid() = v_seller_id THEN
    RETURN v_spot;
  END IF;

  IF EXISTS (
    SELECT 1 FROM conversations
    WHERE listing_id = p_listing_id
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  ) THEN
    RETURN v_spot;
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_precise_spot(uuid) TO authenticated;
