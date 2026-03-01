
-- Add quantidade_pessoas and data_fim columns to reservas
ALTER TABLE public.reservas ADD COLUMN quantidade_pessoas integer NOT NULL DEFAULT 1;
ALTER TABLE public.reservas ADD COLUMN data_fim date;
