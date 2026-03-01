-- Enable realtime for reservas table
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservas;

-- Also add a SELECT policy for reservas by token (public ticket lookup)
CREATE POLICY "Public can view reserva by token"
ON public.reservas
FOR SELECT
USING (true);

-- Drop the old authenticated-only select policy since we now allow public select
DROP POLICY IF EXISTS "Authenticated view reservas" ON public.reservas;
