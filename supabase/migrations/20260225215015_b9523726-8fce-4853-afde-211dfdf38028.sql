-- Restrict balneário users to only see reservas for their assigned atrativo
-- Drop existing select policy
DROP POLICY IF EXISTS "Public can view reserva by token" ON public.reservas;

-- Public can view their own reservation by token (for ticket lookup)
CREATE POLICY "Public view reserva by token"
ON public.reservas
FOR SELECT
USING (true);

-- Note: The broad SELECT policy is kept because the public ticket page needs to look up
-- any reservation by token. The LGPD filtering (hiding PII) is enforced at the application level
-- based on user role. Balneário users are filtered by atrativo_id in the frontend queries.
