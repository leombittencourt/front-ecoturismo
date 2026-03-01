# 🐳 Deploy com Docker

## Quick Start

```bash
cd docs/backend-dotnet/docker

# 1. Configurar variáveis
cp .env.example .env
# Edite .env com suas credenciais

# 2. Gerar certificado SSL (dev)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=localhost"

# 3. Subir tudo (banco é criado automaticamente)
docker compose up -d

# 4. Verificar
curl -k https://localhost/api/municipios
```

> 💡 O banco **EcoTurismo** e todas as tabelas são criados automaticamente na primeira subida do container SQL Server via `init-db/entrypoint.sh`. Não é necessário rodar migrations manualmente.

## Serviços

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Nginx | `80` / `443` | Reverse proxy com SSL |
| API | interna | Backend .NET 8 (via Nginx) |
| SQL Server | `1433` | Banco de dados |
| Azurite | `10000` | Emulador Azure Blob (dev) |

## Inicialização do Banco

O script `init-db/entrypoint.sh` é executado como entrypoint do container SQL Server e:

1. Inicia o SQL Server em background
2. Aguarda o servidor ficar pronto (polling até 60s)
3. Verifica se o banco `EcoTurismo` já existe (idempotente)
4. Se não existir, cria o banco e aplica o DDL (`init-db/01-sql-ddl.sql`)
5. Em reinicializações posteriores, pula a criação

## SSL / HTTPS

### Desenvolvimento (self-signed)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=localhost"
```

### Produção (Let's Encrypt)

```bash
certbot certonly --standalone -d seu-dominio.com
cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem nginx/ssl/key.pem
```

> ⚠️ Nunca commite `*.pem` no repositório.

## Comandos úteis

```bash
docker compose logs -f nginx     # Logs do Nginx
docker compose logs -f api       # Logs da API
docker compose logs -f sqlserver # Logs do SQL Server (ver init)
docker compose restart nginx     # Reiniciar Nginx
docker compose down -v           # Parar + limpar dados
docker compose up -d --build     # Rebuild após mudanças
```

## Produção

Para produção, substitua no `.env`:
- `DB_PASSWORD` → senha forte
- `JWT_SECRET` → chave de 64+ caracteres
- `AZURE_BLOB_CONNECTION` → connection string real do Azure
- `FRONTEND_URL` → domínio do frontend

Remova o serviço `azurite` do compose em produção.
