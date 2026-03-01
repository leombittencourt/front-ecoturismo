
-- ============ ENUMS ============
CREATE TYPE public.user_role AS ENUM ('admin', 'prefeitura', 'balneario', 'publico');
CREATE TYPE public.atrativo_tipo AS ENUM ('balneario', 'cachoeira', 'trilha', 'parque');
CREATE TYPE public.atrativo_status AS ENUM ('ativo', 'inativo', 'manutencao');
CREATE TYPE public.reserva_tipo AS ENUM ('day_use', 'camping');
CREATE TYPE public.reserva_status AS ENUM ('confirmada', 'cancelada', 'utilizada');

-- ============ TABLES (no policies yet) ============

CREATE TABLE public.municipios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  uf TEXT NOT NULL CHECK (char_length(uf) = 2),
  logo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'publico',
  municipio_id UUID REFERENCES public.municipios(id),
  atrativo_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.atrativos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo public.atrativo_tipo NOT NULL,
  municipio_id UUID NOT NULL REFERENCES public.municipios(id),
  capacidade_maxima INT NOT NULL CHECK (capacidade_maxima > 0),
  ocupacao_atual INT NOT NULL DEFAULT 0 CHECK (ocupacao_atual >= 0),
  status public.atrativo_status NOT NULL DEFAULT 'ativo',
  descricao TEXT,
  imagem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_atrativo_id_fkey FOREIGN KEY (atrativo_id) REFERENCES public.atrativos(id);

CREATE TABLE public.reservas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atrativo_id UUID NOT NULL REFERENCES public.atrativos(id),
  nome_visitante TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT NOT NULL,
  cidade_origem TEXT NOT NULL,
  uf_origem TEXT NOT NULL CHECK (char_length(uf_origem) = 2),
  tipo public.reserva_tipo NOT NULL DEFAULT 'day_use',
  data DATE NOT NULL,
  status public.reserva_status NOT NULL DEFAULT 'confirmada',
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.validacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id UUID REFERENCES public.reservas(id),
  token TEXT NOT NULL,
  valido BOOLEAN NOT NULL,
  operador_id UUID REFERENCES public.profiles(id),
  atrativo_id UUID REFERENCES public.atrativos(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ RLS ============
ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atrativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validacoes ENABLE ROW LEVEL SECURITY;

-- Municipios
CREATE POLICY "Municipios viewable by everyone" ON public.municipios FOR SELECT USING (true);
CREATE POLICY "Admins manage municipios" ON public.municipios FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Profiles
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Atrativos
CREATE POLICY "Atrativos viewable by everyone" ON public.atrativos FOR SELECT USING (true);
CREATE POLICY "Staff manage atrativos" ON public.atrativos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'prefeitura'))
);

-- Reservas
CREATE POLICY "Anyone can create reservas" ON public.reservas FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated view reservas" ON public.reservas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff update reservas" ON public.reservas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'prefeitura', 'balneario'))
);

-- Validacoes
CREATE POLICY "Staff manage validacoes" ON public.validacoes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'prefeitura', 'balneario'))
);

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_atrativos_updated_at BEFORE UPDATE ON public.atrativos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'publico')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ INDEXES ============
CREATE INDEX idx_reservas_token ON public.reservas(token);
CREATE INDEX idx_reservas_atrativo_data ON public.reservas(atrativo_id, data);
CREATE INDEX idx_reservas_status ON public.reservas(status);
CREATE INDEX idx_atrativos_municipio ON public.atrativos(municipio_id);
CREATE INDEX idx_validacoes_atrativo ON public.validacoes(atrativo_id, created_at DESC);
