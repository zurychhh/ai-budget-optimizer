# Security & Compliance

## Data Security

### Encryption

| Layer | Method | Details |
|-------|--------|---------|
| At Rest | AES-256 | Database encryption, file storage |
| In Transit | TLS 1.3 | All API communications |
| Secrets | HashiCorp Vault / AWS Secrets Manager | API keys, tokens |

### API Security

```python
# JWT Token Configuration
SECRET_KEY = os.getenv("SECRET_KEY")  # Generate with: openssl rand -hex 32
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Token validation
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception
```

### Platform Authentication

| Platform | Method | Token Refresh |
|----------|--------|---------------|
| Google Ads | OAuth 2.0 | Refresh token (auto) |
| Meta Ads | OAuth 2.0 + Long-lived token | Manual (60 days) |
| TikTok Ads | OAuth 2.0 | Auto refresh |
| LinkedIn Ads | OAuth 2.0 | Auto refresh |

---

## Access Control

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Admin** | Full access, user management, settings |
| **Manager** | View all, approve AI actions, modify budgets |
| **Analyst** | View all, export reports |
| **Viewer** | View dashboard only |

```python
# Permission decorator
def require_permission(permission: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            if not current_user.has_permission(permission):
                raise HTTPException(status_code=403, detail="Permission denied")
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# Usage
@router.post("/campaigns/{campaign_id}/budget")
@require_permission("modify_budget")
async def update_budget(campaign_id: str, new_budget: float):
    pass
```

### Multi-Factor Authentication (MFA)

- Required for Admin and Manager roles
- TOTP (Google Authenticator, Authy)
- Backup codes for recovery

### IP Whitelisting

```yaml
# Production config
allowed_ips:
  - 203.0.113.0/24    # Office network
  - 198.51.100.50     # VPN exit point
  - 192.0.2.100       # Backup access

rate_limits:
  default: 100/minute
  authenticated: 1000/minute
  admin: 5000/minute
```

---

## Audit Logging

### What We Log

| Event Type | Details Logged |
|------------|----------------|
| Authentication | Login attempts, success/failure, IP, user agent |
| Authorization | Permission checks, role changes |
| Data Access | Queries, exports, sensitive data views |
| Modifications | Budget changes, campaign status changes |
| AI Actions | All autonomous decisions, reasoning, confidence |
| System Events | Errors, performance issues, security alerts |

### Log Format

```json
{
  "timestamp": "2026-01-07T10:30:00Z",
  "event_type": "BUDGET_CHANGE",
  "user_id": "user_123",
  "user_role": "manager",
  "ip_address": "203.0.113.50",
  "resource": "campaign",
  "resource_id": "camp_456",
  "action": "update",
  "old_value": {"budget": 1000},
  "new_value": {"budget": 1500},
  "ai_initiated": true,
  "ai_confidence": 0.92,
  "ai_reasoning": "ROAS increased 25% over 7 days..."
}
```

### Log Retention

| Log Type | Retention Period |
|----------|------------------|
| Security events | 2 years |
| AI actions | 1 year |
| Access logs | 90 days |
| Debug logs | 30 days |

---

## Compliance

### GDPR (EU)

**Requirements Met:**
- ✅ Data minimization - collect only necessary data
- ✅ Purpose limitation - clear data usage policies
- ✅ Storage limitation - defined retention periods
- ✅ Right to erasure - data deletion capabilities
- ✅ Data portability - export in standard formats
- ✅ Privacy by design - encryption, access controls

**Data Processing:**
- Campaign metrics only (no PII typically)
- If customer data processed: explicit consent required
- Data Processing Agreement (DPA) with clients

### CCPA (California)

**Requirements Met:**
- ✅ Disclosure of data collection practices
- ✅ Right to know what data is collected
- ✅ Right to delete personal information
- ✅ Right to opt-out of data sale (N/A - no data sale)
- ✅ Non-discrimination for exercising rights

### SOC 2 Type II (Planned Q3 2026)

**Trust Service Criteria:**

| Criteria | Status | Target |
|----------|--------|--------|
| Security | In Progress | Q2 2026 |
| Availability | In Progress | Q2 2026 |
| Processing Integrity | Planned | Q3 2026 |
| Confidentiality | In Progress | Q2 2026 |
| Privacy | Planned | Q3 2026 |

---

## Secrets Management

### Best Practices

```bash
# NEVER commit secrets to git
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
echo "*.pem" >> .gitignore
echo "*.key" >> .gitignore

# Set proper file permissions
chmod 600 .env
chmod 600 *.pem

# Use environment variables, not hardcoded values
# BAD:
api_key = "sk-ant-12345"

# GOOD:
api_key = os.getenv("ANTHROPIC_API_KEY")
```

### Secret Rotation

| Secret Type | Rotation Frequency |
|-------------|-------------------|
| API Keys | 90 days |
| Database Passwords | 90 days |
| JWT Secret | 180 days |
| OAuth Tokens | As needed (platform-dependent) |

### Production Secrets Storage

**Recommended:** AWS Secrets Manager or HashiCorp Vault

```python
# AWS Secrets Manager example
import boto3
from botocore.exceptions import ClientError

def get_secret(secret_name: str) -> dict:
    client = boto3.client('secretsmanager')
    try:
        response = client.get_secret_value(SecretId=secret_name)
        return json.loads(response['SecretString'])
    except ClientError as e:
        raise Exception(f"Failed to retrieve secret: {e}")

# Usage
secrets = get_secret("mbo/production/api-keys")
google_ads_token = secrets["google_ads_refresh_token"]
```

---

## Security Checklist

### Pre-Deployment

```
☐ All secrets in environment variables / secrets manager
☐ SSL certificates installed and valid
☐ Database encrypted at rest
☐ API endpoints require authentication
☐ Rate limiting configured
☐ CORS properly configured
☐ Input validation on all endpoints
☐ SQL injection prevention (parameterized queries)
☐ XSS prevention (output encoding)
☐ CSRF protection enabled
☐ Security headers configured (HSTS, CSP, etc.)
```

### Ongoing

```
☐ Regular security audits (quarterly)
☐ Dependency vulnerability scanning (weekly)
☐ Penetration testing (annually)
☐ Access review (monthly)
☐ Log review (weekly)
☐ Incident response plan updated
☐ Backup verification (monthly)
☐ Disaster recovery testing (quarterly)
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Data breach, system compromise | Immediate (15 min) |
| High | Security vulnerability, service outage | 1 hour |
| Medium | Suspicious activity, minor breach | 4 hours |
| Low | Policy violation, audit finding | 24 hours |

### Response Steps

1. **Detection** - Identify and confirm incident
2. **Containment** - Limit damage, isolate affected systems
3. **Eradication** - Remove threat, patch vulnerabilities
4. **Recovery** - Restore systems, verify integrity
5. **Lessons Learned** - Document, update procedures

### Contacts

```
Security Lead:      security@company.com
On-Call Engineer:   oncall@company.com
Legal/Compliance:   legal@company.com
External CSIRT:     [contracted security firm]
```

## Related Documents

- [Deployment](./08-deployment.md) - Infrastructure security
- [Platform Setup](./07-platform-setup.md) - Credentials management
