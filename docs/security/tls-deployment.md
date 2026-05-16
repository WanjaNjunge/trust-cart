# TLS / HTTPS Deployment Runbook

**Finding:** FIND-031 — No HTTPS enforcement  
**Severity:** HIGH  
**Scope:** Pre-production and production deployment  
**Status:** Infrastructure configuration — implemented at platform/proxy layer, not in application code

---

## Why TLS is Required

TrustCart Kenya handles:
- Authentication tokens in cookies (`Set-Cookie: access_token=...`)
- MPesa phone numbers and payment data in request bodies
- Customer PII (names, addresses, emails)

Without TLS, any network observer (ISP, café Wi-Fi, mobile carrier) can read and modify all traffic in both directions. HSTS requires HTTPS to be active first.

---

## Requirement

All production traffic must be encrypted with TLS 1.2 or higher. HTTP must redirect to HTTPS. The `access_token` cookie is set with `Secure: true` in production — it will not be transmitted over plain HTTP.

---

## Option A — Platform-managed TLS (Recommended for MVP)

These platforms provide automatic TLS with zero configuration:

### Railway
```
Deploy → Settings → Networking → Enable HTTPS (automatic via Railway proxy)
Custom domain: Settings → Domains → Add domain → Railway handles cert via Let's Encrypt
```

### Render
```
Dashboard → Service → Settings → Custom Domains → Add domain
Render auto-provisions TLS via Let's Encrypt
HTTPS is enforced by default; HTTP redirects to HTTPS automatically
```

### Fly.io
```bash
fly launch          # generates fly.toml
fly certs add api.trustcart.co.ke
fly certs show api.trustcart.co.ke
# Fly manages Let's Encrypt renewal automatically
```

For all platforms: no application code changes required. The platform TLS-terminates at the edge and forwards HTTP internally to the NestJS app on port 3001.

---

## Option B — nginx Reverse Proxy

For self-hosted VMs (DigitalOcean, AWS EC2, GCP Compute):

### 1. Install certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.trustcart.co.ke
```

### 2. nginx site configuration (`/etc/nginx/sites-available/trustcart-api`)
```nginx
server {
    listen 80;
    server_name api.trustcart.co.ke;
    return 301 https://$host$request_uri;   # force HTTPS
}

server {
    listen 443 ssl http2;
    server_name api.trustcart.co.ke;

    ssl_certificate     /etc/letsencrypt/live/api.trustcart.co.ke/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.trustcart.co.ke/privkey.pem;

    # Modern TLS settings (Mozilla Intermediate profile)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:...;
    ssl_prefer_server_ciphers off;

    # HSTS — instruct browsers to always use HTTPS for 1 year
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to NestJS on internal port
    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

### 3. Enable and reload
```bash
sudo ln -s /etc/nginx/sites-available/trustcart-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot renew --dry-run   # verify auto-renewal
```

---

## Option C — Caddy (Simplest self-hosted)

```
# /etc/caddy/Caddyfile
api.trustcart.co.ke {
    reverse_proxy localhost:3001
    # Caddy automatically obtains and renews Let's Encrypt certs
    # HTTPS-only with HSTS is the default
}
```

```bash
sudo systemctl start caddy
sudo systemctl enable caddy
```

---

## Application Configuration After TLS Is Active

### 1. Set trust proxy in NestJS (required when behind a reverse proxy)

Add to `main.ts` for production:
```typescript
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
```

This ensures `req.ip` reflects the real client IP (from `X-Forwarded-For`) and `req.secure` is true for cookie `Secure` flag logic.

### 2. Update CORS_ORIGINS environment variable
```
CORS_ORIGINS=https://trustcart.co.ke,https://www.trustcart.co.ke
```
Remove any `http://` origins from production config.

### 3. Verify access_token cookie attributes
In production (with HTTPS active), the `access_token` cookie will include `Secure` automatically because:
```typescript
// auth.controller.ts
secure: process.env.NODE_ENV === 'production',
```

Verify with browser DevTools → Application → Cookies → check `Secure` column shows ✓.

---

## HSTS Preload Checklist

Before submitting to the HSTS preload list (https://hstspreload.org):
- [ ] HTTPS working on all subdomains
- [ ] `max-age` ≥ 31536000 (1 year)
- [ ] `includeSubDomains` present
- [ ] `preload` directive present
- [ ] HTTP correctly redirects to HTTPS (no mixed content)
- [ ] Test with: `curl -I https://api.trustcart.co.ke`

---

## Verification Checklist

After TLS deployment:
- [ ] `curl -I http://api.trustcart.co.ke` → `301` redirect to HTTPS
- [ ] `curl -I https://api.trustcart.co.ke/api/v1/health` → `200 OK`
- [ ] Response headers include `Strict-Transport-Security`
- [ ] Response headers include `X-Frame-Options`, `X-Content-Type-Options` (from Helmet)
- [ ] SSL Labs test: https://www.ssllabs.com/ssltest/ → A or A+ grade
- [ ] Browser login → DevTools cookies → `access_token` has `Secure`, `HttpOnly`, `SameSite=Strict`
