# 🔐 Certificados SSL

## Desenvolvimento (Self-signed)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/CN=localhost"
```

Coloque `cert.pem` e `key.pem` nesta pasta (`nginx/ssl/`).

## Produção (Let's Encrypt)

Use [Certbot](https://certbot.eff.org/) para gerar certificados gratuitos:

```bash
certbot certonly --standalone -d seu-dominio.com
```

Copie os certificados gerados:
```bash
cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem ./cert.pem
cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem ./key.pem
```

> ⚠️ **Nunca commite certificados reais no repositório.** Adicione `*.pem` ao `.gitignore`.
