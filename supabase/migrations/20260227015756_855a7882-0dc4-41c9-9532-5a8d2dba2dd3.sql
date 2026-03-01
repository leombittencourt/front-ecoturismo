
-- Add quiosque_id to reservas (optional FK)
ALTER TABLE public.reservas
  ADD COLUMN quiosque_id uuid REFERENCES public.quiosques(id);
