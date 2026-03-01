
-- Create a SECURITY DEFINER function to check user role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Fix profiles policies: replace self-referencing admin policy
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
CREATE POLICY "Admins manage profiles"
ON public.profiles
FOR ALL
USING (public.get_user_role() = 'admin');

-- Fix atrativos policies: make SELECT permissive, restrict staff to non-SELECT
DROP POLICY IF EXISTS "Atrativos viewable by everyone" ON public.atrativos;
DROP POLICY IF EXISTS "Staff manage atrativos" ON public.atrativos;

CREATE POLICY "Atrativos viewable by everyone"
ON public.atrativos
FOR SELECT
USING (true);

CREATE POLICY "Staff manage atrativos"
ON public.atrativos
FOR ALL
USING (public.get_user_role() IN ('admin', 'prefeitura'));

-- Fix reservas policies that also reference profiles
DROP POLICY IF EXISTS "Staff update reservas" ON public.reservas;
CREATE POLICY "Staff update reservas"
ON public.reservas
FOR UPDATE
USING (public.get_user_role() IN ('admin', 'prefeitura', 'balneario'));

-- Fix validacoes policies
DROP POLICY IF EXISTS "Staff manage validacoes" ON public.validacoes;
CREATE POLICY "Staff manage validacoes"
ON public.validacoes
FOR ALL
USING (public.get_user_role() IN ('admin', 'prefeitura', 'balneario'));

-- Fix municipios policies
DROP POLICY IF EXISTS "Admins manage municipios" ON public.municipios;
CREATE POLICY "Admins manage municipios"
ON public.municipios
FOR ALL
USING (public.get_user_role() = 'admin');
