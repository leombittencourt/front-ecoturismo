
-- Enum de status do quiosque
CREATE TYPE public.quiosque_status AS ENUM ('disponivel', 'reservado', 'ocupado', 'manutencao');

-- Tabela de quiosques
CREATE TABLE public.quiosques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atrativo_id uuid REFERENCES public.atrativos(id) ON DELETE SET NULL,
  numero integer NOT NULL,
  tem_churrasqueira boolean NOT NULL DEFAULT false,
  status public.quiosque_status NOT NULL DEFAULT 'disponivel',
  posicao_x integer NOT NULL DEFAULT 0,
  posicao_y integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.quiosques ENABLE ROW LEVEL SECURITY;

-- Leitura pública
CREATE POLICY "Quiosques viewable by everyone"
ON public.quiosques FOR SELECT
USING (true);

-- Staff gerencia quiosques
CREATE POLICY "Staff manage quiosques"
ON public.quiosques FOR ALL
TO authenticated
USING (public.get_user_role() = ANY (ARRAY['admin'::user_role, 'prefeitura'::user_role, 'balneario'::user_role]))
WITH CHECK (public.get_user_role() = ANY (ARRAY['admin'::user_role, 'prefeitura'::user_role, 'balneario'::user_role]));

-- Trigger de updated_at
CREATE TRIGGER update_quiosques_updated_at
BEFORE UPDATE ON public.quiosques
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiosques;
