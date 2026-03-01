-- ============================================================
-- EcoTurismo — DDL para SQL Server (compatível com schema Supabase)
-- ============================================================

-- ENUMS como constraints CHECK (SQL Server não tem ENUM nativo)

CREATE TABLE municipios (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    nome            NVARCHAR(200)    NOT NULL,
    uf              NVARCHAR(2)      NOT NULL,
    logo            NVARCHAR(500)    NULL,
    created_at      DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE profiles (
    id              UNIQUEIDENTIFIER NOT NULL PRIMARY KEY, -- mesmo id do auth
    nome            NVARCHAR(200)    NOT NULL,
    email           NVARCHAR(200)    NOT NULL,
    role            NVARCHAR(20)     NOT NULL DEFAULT 'publico'
                    CHECK (role IN ('admin', 'prefeitura', 'balneario', 'publico')),
    municipio_id    UNIQUEIDENTIFIER NULL REFERENCES municipios(id),
    atrativo_id     UNIQUEIDENTIFIER NULL, -- FK adicionada após criar atrativos
    created_at      DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at      DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE atrativos (
    id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    municipio_id        UNIQUEIDENTIFIER NOT NULL REFERENCES municipios(id),
    nome                NVARCHAR(200)    NOT NULL,
    tipo                NVARCHAR(20)     NOT NULL
                        CHECK (tipo IN ('balneario', 'cachoeira', 'trilha', 'parque', 'camping')),
    descricao           NVARCHAR(MAX)    NULL,
    imagem              NVARCHAR(500)    NULL,
    capacidade_maxima   INT              NOT NULL,
    ocupacao_atual      INT              NOT NULL DEFAULT 0,
    status              NVARCHAR(20)     NOT NULL DEFAULT 'ativo'
                        CHECK (status IN ('ativo', 'inativo', 'manutencao')),
    created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

-- FK retroativa
ALTER TABLE profiles ADD CONSTRAINT FK_profiles_atrativo
    FOREIGN KEY (atrativo_id) REFERENCES atrativos(id);

CREATE TABLE reservas (
    id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    atrativo_id         UNIQUEIDENTIFIER NOT NULL REFERENCES atrativos(id),
    quiosque_id         UNIQUEIDENTIFIER NULL, -- FK adicionada após quiosques
    nome_visitante      NVARCHAR(200)    NOT NULL,
    email               NVARCHAR(200)    NOT NULL,
    cpf                 NVARCHAR(14)     NOT NULL,
    cidade_origem       NVARCHAR(100)    NOT NULL,
    uf_origem           NVARCHAR(2)      NOT NULL,
    tipo                NVARCHAR(10)     NOT NULL DEFAULT 'day_use'
                        CHECK (tipo IN ('day_use', 'camping')),
    data                DATE             NOT NULL,
    data_fim            DATE             NULL,
    quantidade_pessoas  INT              NOT NULL DEFAULT 1,
    status              NVARCHAR(15)     NOT NULL DEFAULT 'confirmada'
                        CHECK (status IN ('confirmada', 'cancelada', 'utilizada')),
    token               NVARCHAR(50)     NOT NULL,
    created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE validacoes (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    reserva_id      UNIQUEIDENTIFIER NULL REFERENCES reservas(id),
    atrativo_id     UNIQUEIDENTIFIER NULL REFERENCES atrativos(id),
    operador_id     UNIQUEIDENTIFIER NULL REFERENCES profiles(id),
    token           NVARCHAR(50)     NOT NULL,
    valido          BIT              NOT NULL,
    created_at      DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE quiosques (
    id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    atrativo_id         UNIQUEIDENTIFIER NULL REFERENCES atrativos(id),
    numero              INT              NOT NULL,
    tem_churrasqueira   BIT              NOT NULL DEFAULT 0,
    status              NVARCHAR(15)     NOT NULL DEFAULT 'disponivel'
                        CHECK (status IN ('disponivel', 'reservado', 'ocupado', 'manutencao')),
    posicao_x           INT              NOT NULL DEFAULT 0,
    posicao_y           INT              NOT NULL DEFAULT 0,
    created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

-- FK retroativa
ALTER TABLE reservas ADD CONSTRAINT FK_reservas_quiosque
    FOREIGN KEY (quiosque_id) REFERENCES quiosques(id);

CREATE TABLE banners (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    titulo          NVARCHAR(200)    NULL,
    subtitulo       NVARCHAR(300)    NULL,
    imagem_url      NVARCHAR(500)    NOT NULL,
    link            NVARCHAR(500)    NULL,
    ordem           INT              NOT NULL DEFAULT 0,
    ativo           BIT              NOT NULL DEFAULT 1,
    created_at      DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at      DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE configuracoes_sistema (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    chave           NVARCHAR(100)    NOT NULL UNIQUE,
    valor           NVARCHAR(MAX)    NULL,
    descricao       NVARCHAR(300)    NULL,
    updated_at      DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IX_atrativos_municipio ON atrativos(municipio_id);
CREATE INDEX IX_reservas_atrativo ON reservas(atrativo_id);
CREATE INDEX IX_reservas_token ON reservas(token);
CREATE INDEX IX_quiosques_atrativo ON quiosques(atrativo_id);
CREATE INDEX IX_validacoes_token ON validacoes(token);
CREATE INDEX IX_profiles_email ON profiles(email);

-- ============================================================
-- SEED: Configurações padrão
-- ============================================================
INSERT INTO configuracoes_sistema (chave, valor, descricao) VALUES
('nome_sistema', 'EcoTurismo', 'Nome exibido no sistema'),
('footer_texto', 'Plataforma de Gestão Inteligente do Ecoturismo Municipal', NULL),
('footer_links', '[]', 'Links do rodapé em JSON'),
('banner_largura', '1200', NULL),
('banner_altura', '400', NULL),
('cor_primaria', '120 56% 24%', 'Cor primária HSL'),
('cor_secundaria', '120 40% 35%', 'Cor secundária HSL'),
('cor_accent', '204 98% 37%', 'Cor de destaque HSL'),
('cor_sidebar_bg', '120 20% 12%', 'Cor de fundo da sidebar HSL'),
('cor_sucesso', '120 40% 44%', 'Cor de sucesso HSL'),
('cor_warning', '45 100% 51%', 'Cor de warning HSL'),
('logo_login', NULL, 'URL do logo da tela de login'),
('logo_publica', NULL, 'URL do logo público');
