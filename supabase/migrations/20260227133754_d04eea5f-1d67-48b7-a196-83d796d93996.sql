
-- Create configuracoes_sistema table
CREATE TABLE public.configuracoes_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  valor text,
  descricao text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Configuracoes viewable by everyone"
ON public.configuracoes_sistema
FOR SELECT
USING (true);

-- Admin/prefeitura write
CREATE POLICY "Staff manage configuracoes"
ON public.configuracoes_sistema
FOR ALL
TO authenticated
USING (get_user_role() = ANY (ARRAY['admin'::user_role, 'prefeitura'::user_role]))
WITH CHECK (get_user_role() = ANY (ARRAY['admin'::user_role, 'prefeitura'::user_role]));

-- Insert default values
INSERT INTO public.configuracoes_sistema (chave, valor, descricao) VALUES
  ('logo_login', null, 'Logo exibido na tela de login'),
  ('logo_publica', null, 'Logo exibido no header da area publica'),
  ('nome_sistema', 'EcoTurismo', 'Nome exibido nos headers'),
  ('footer_texto', 'Plataforma de Gestão Inteligente do Ecoturismo Municipal', 'Texto do rodape'),
  ('footer_links', '[]', 'Links adicionais do footer (JSON)'),
  ('banner_largura', '1200', 'Largura recomendada dos banners em pixels'),
  ('banner_altura', '400', 'Altura recomendada dos banners em pixels');

-- Trigger for updated_at
CREATE TRIGGER update_configuracoes_updated_at
BEFORE UPDATE ON public.configuracoes_sistema
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create logos bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Storage policies for logos bucket
CREATE POLICY "Logos publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Staff upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos' AND (public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'prefeitura'::public.user_role])));

CREATE POLICY "Staff update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos' AND (public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'prefeitura'::public.user_role])));

CREATE POLICY "Staff delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos' AND (public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'prefeitura'::public.user_role])));
