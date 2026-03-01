
-- Drop restrictive ALL policies and replace with permissive ones for banners and configuracoes
-- Since auth is mock-based (no Supabase Auth), RLS with get_user_role() blocks all writes

-- Banners: allow all operations (admin protection is in frontend)
DROP POLICY IF EXISTS "Staff manage banners" ON public.banners;
CREATE POLICY "Allow all banner management" ON public.banners
  FOR ALL USING (true) WITH CHECK (true);

-- Configuracoes: allow all operations  
DROP POLICY IF EXISTS "Staff manage configuracoes" ON public.configuracoes_sistema;
CREATE POLICY "Allow all configuracoes management" ON public.configuracoes_sistema
  FOR ALL USING (true) WITH CHECK (true);

-- Storage: ensure banner uploads work for anon
DROP POLICY IF EXISTS "Staff upload banner images" ON storage.objects;
CREATE POLICY "Allow banner uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'banners');

DROP POLICY IF EXISTS "Staff update banner images" ON storage.objects;
CREATE POLICY "Allow banner updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Staff delete banner images" ON storage.objects;
CREATE POLICY "Allow banner deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'banners');
