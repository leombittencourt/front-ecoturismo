
-- Tabela de banners
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text,
  subtitulo text,
  imagem_url text NOT NULL,
  link text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners viewable by everyone" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Staff manage banners" ON public.banners FOR ALL
  USING (public.get_user_role() IN ('admin', 'prefeitura'))
  WITH CHECK (public.get_user_role() IN ('admin', 'prefeitura'));

CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para imagens de banners
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

CREATE POLICY "Banner images publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Staff upload banner images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.uid() IS NOT NULL);
CREATE POLICY "Staff update banner images" ON storage.objects FOR UPDATE USING (bucket_id = 'banners' AND auth.uid() IS NOT NULL);
CREATE POLICY "Staff delete banner images" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND auth.uid() IS NOT NULL);
