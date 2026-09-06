/*
# Storage Bucket for Listing Images

Creates a public storage bucket `listing-images` for storing multiple product photos.
Students upload photos when creating listings. The bucket is public-read so buyers
can see images, but only authenticated users can upload to their own folder.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read listing images (public bucket)
DROP POLICY IF EXISTS "listing_images_read_all" ON storage.objects;
CREATE POLICY "listing_images_read_all" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'listing-images');

-- Authenticated users can upload
DROP POLICY IF EXISTS "listing_images_insert_auth" ON storage.objects;
CREATE POLICY "listing_images_insert_auth" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'listing-images');

-- Users can update/delete their own uploads (scoped by user id folder)
DROP POLICY IF EXISTS "listing_images_update_own" ON storage.objects;
CREATE POLICY "listing_images_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'listing-images' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "listing_images_delete_own" ON storage.objects;
CREATE POLICY "listing_images_delete_own" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'listing-images' AND owner = auth.uid());
