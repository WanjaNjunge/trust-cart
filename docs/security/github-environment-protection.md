# GitHub Environment Protection Runbook

**Finding:** FIND-033 — No production environment isolation mechanism  
**Severity:** HIGH  
**Scope:** GitHub repository settings  
**Status:** GitHub configuration — not code-implemented

---

## Why This Is Required

TrustCart Kenya processes real payments and customer PII. A mis-targeted deployment or an accidentally triggered workflow could:
- Push unreviewed code to production customers
- Expose a misconfigured API to the internet
- Overwrite production database with test data
- Leak environment secrets

Two-person authorization and environment isolation are the minimum controls for a fintech-adjacent application.

---

## Required GitHub Settings

### 1. Branch Protection on `main`

Navigate to: **Repository → Settings → Branches → Add branch protection rule**

Rule target: `main`

| Setting | Value | Reason |
|---------|-------|--------|
| Require a pull request before merging | ✅ | No direct pushes to main |
| Required approving reviews | **2** | Two-person authorization |
| Dismiss stale reviews on push | ✅ | Re-approval required after new commits |
| Require review from code owners | ✅ (optional) | Specific owners for sensitive paths |
| Require status checks to pass | ✅ | CI must be green |
| Required status checks | `security-audit`, `lint`, `test-api`, `build` | All critical CI jobs |
| Require branches to be up to date | ✅ | Prevents stale branch merges |
| Restrict who can push | ✅ | Limit to specific team members or teams |
| Allow force pushes | ❌ | Never allow force push to main |
| Allow deletions | ❌ | Protect main from deletion |

```bash
# Via GitHub CLI (if available)
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["security-audit","lint","test-api","build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":2,"dismiss_stale_reviews":true}'
```

---

### 2. GitHub Environments

Create two environments in: **Repository → Settings → Environments**

#### `staging` environment
- **Protection rules:** Require reviewers: 1 (tech lead or senior engineer)
- **Deployment branches:** `develop` branch only
- **Secrets:** staging-specific values (separate from production)

#### `production` environment
- **Protection rules:** 
  - Require reviewers: **2** (require both tech lead AND product owner)
  - Wait timer: 5 minutes (gives time to cancel accidental triggers)
- **Deployment branches:** `main` branch only
- **Secrets:** production-specific values (isolated from staging)

---

### 3. Environment Secrets Isolation

**Never share secrets between environments.**

| Secret | staging | production |
|--------|---------|-----------|
| `DATABASE_URL` | `postgresql://...staging_db...` | `postgresql://...prod_db...` |
| `JWT_SECRET` | Separate 64-byte hex value | Separate 64-byte hex value |
| `REDIS_URL` | Staging Redis instance | Production Redis instance |
| `MPESA_CONSUMER_KEY` | Sandbox key | Production key |
| `MPESA_CONSUMER_SECRET` | Sandbox secret | Production secret |

Generate production secrets:
```bash
# JWT_SECRET (minimum 64 bytes = 128 hex chars)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Database password
openssl rand -base64 32
```

Store generated secrets in the production GitHub Environment only, never in code.

---

### 4. Required CI Status Checks

Update `.github/workflows/ci.yml` to reference the environment:

```yaml
deploy-production:
  name: Deploy to Production
  needs: [security-audit, lint, test-api, test-web, build]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  runs-on: ubuntu-latest
  environment:
    name: production          # triggers the protection rules defined above
    url: https://api.trustcart.co.ke
  steps:
    - name: Deploy
      run: echo "Deploy to production platform"
      # Replace with actual deployment step (Railway/Render/Fly.io CLI)
```

---

### 5. Secret Scanning

Enable in: **Repository → Settings → Security → Secret scanning**

- Enable **Secret scanning** (alerts on detected secrets in commits)
- Enable **Push protection** (blocks pushes that contain secrets)
- Configure email alerts for secret detection events

Add to `.github/workflows/ci.yml` for additional secret scanning:
```yaml
- name: Scan for secrets
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

### 6. CODEOWNERS File (Recommended)

Create `.github/CODEOWNERS`:
```
# Global — all changes require review from the security team member
*                           @WanjaNjunge

# Payment and auth code — require additional review
apps/api/src/modules/auth/  @WanjaNjunge
apps/api/src/modules/payments/  @WanjaNjunge
apps/api/prisma/            @WanjaNjunge
```

---

## Verification Checklist

After configuring:
- [ ] Direct push to `main` is rejected: `git push origin main --force` → "protected branch"
- [ ] PR without 2 approvals cannot be merged
- [ ] CI `security-audit` job is listed as required status check
- [ ] `production` environment shows "Required reviewers" in the Environments UI
- [ ] Production and staging secrets are separate GitHub Environment secrets (not repo-level)
- [ ] Secret scanning is enabled on the repository
- [ ] A test push containing a fake secret string is blocked by push protection
