
INSERT INTO public.configuracoes_sistema (chave, valor, descricao)
VALUES 
  ('cor_primaria', '120 56% 24%', 'Cor primária do tema (formato HSL sem wrapper)'),
  ('cor_secundaria', '120 40% 35%', 'Cor secundária do tema (formato HSL sem wrapper)')
ON CONFLICT (chave) DO NOTHING;
