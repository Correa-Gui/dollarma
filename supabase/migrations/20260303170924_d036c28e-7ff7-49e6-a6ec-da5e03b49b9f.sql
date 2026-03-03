-- Create storage bucket for store logos
INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true);

-- Allow authenticated users to upload to store-assets
CREATE POLICY "Authenticated users can upload store assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'store-assets');

-- Allow authenticated users to update store assets
CREATE POLICY "Authenticated users can update store assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'store-assets');

-- Allow public read access to store assets
CREATE POLICY "Public read access to store assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'store-assets');

-- Allow authenticated users to delete store assets
CREATE POLICY "Authenticated users can delete store assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'store-assets');

-- Add logo_url column to store_settings
ALTER TABLE public.store_settings ADD COLUMN logo_url text DEFAULT NULL;