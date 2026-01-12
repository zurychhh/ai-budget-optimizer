# Platform Credentials Setup

## Strategy: Single-Tenant Approach (First Client)

Dla pierwszego klienta używamy prostego podejścia:
- ✅ Credentials w environment variables (.env file)
- ✅ Single tenant (jedna firma, jedno wdrożenie)
- ✅ Szybki setup (2-3 dni platform credentials + 1 tydzień deployment)
- ✅ Łatwy debugging (wszystko w jednym miejscu)
- ❌ Multi-tenant dopiero w iteracji 2 (gdy będzie więcej klientów)

---

## 1. Google Ads API Setup

**CZAS:** 2-3 godziny
**WYMAGANIA:** Google Cloud Console access, Google Ads Manager Account

### KROK 1: Google Cloud Console

```
1. Idź do: https://console.cloud.google.com/
2. Create New Project: "MBO-Client1-GoogleAds"
3. Enable APIs:
   Navigation Menu > APIs & Services > Library
   Search: "Google Ads API" → Enable

4. Create OAuth 2.0 Credentials:
   APIs & Services > Credentials > Create Credentials
   > OAuth 2.0 Client ID

   Application type: Web application
   Name: "MBO Production"
   Authorized redirect URIs:
     - https://mbo.example.com/oauth/google/callback
     - http://localhost:8000/oauth/google/callback (testing)

5. Zapisz credentials:
   - Client ID: 123456789-xxxxxxx.apps.googleusercontent.com
   - Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxx
```

### KROK 2: Google Ads Manager Account

```
1. Idź do: https://ads.google.com/
2. Przejdź do Manager Account (MCC)
3. Settings > Setup > API Center
4. Apply for Developer Token:
   - Wypełnij formularz
   - Opisz use case: "Marketing budget optimization tool"
   - Approval time: 1-2 business days

5. Po approval otrzymasz:
   Developer Token (format: letters + numbers, ~15-20 chars)
```

### KROK 3: Link Ad Account

```
1. W Google Ads Manager:
   Accounts > Add Account > Link existing account
2. Customer ID w formacie: 123-456-7890
   (Zapisz BEZ myślników dla API: 1234567890)
```

### KROK 4: Generate Refresh Token

```
1. Use Google OAuth Playground:
   https://developers.google.com/oauthplayground
2. Settings (gear icon) > Use your own OAuth credentials
   - Client ID: [your Client ID from Step 1]
   - Client Secret: [your Secret from Step 1]
3. Scope: https://www.googleapis.com/auth/adwords
4. Authorize APIs → Exchange authorization code for tokens
5. Zapisz Refresh Token: 1//xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

✅ **GOTOWE!** Masz wszystkie credentials dla Google Ads.

---

## 2. Meta Ads API Setup

**CZAS:** 1-2 godziny
**WYMAGANIA:** Facebook Developer Account, Business Manager access

### KROK 1: Facebook for Developers

```
1. Idź do: https://developers.facebook.com/
2. My Apps > Create App
3. Use Case: "Other" → Next
4. App Type: "Business" → Next
5. App Name: "MBO-Client1-Meta"
6. Contact Email: [your email]
7. Create App
```

### KROK 2: Add Marketing API Product

```
1. W App Dashboard:
   Add Product → Marketing API → Set Up
2. Basic Settings:
   - App ID: 1234567890123456
   - App Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   (ZAPISZ te wartości!)
```

### KROK 3: Business Manager Setup

```
1. Idź do: https://business.facebook.com/
2. Business Settings > Ad Accounts
3. Znajdź Ad Account ID: act_1234567890
4. Assign App to Ad Account:
   Business Settings > Apps > Add > Add App
   Search: [your app name] → Add
5. Set Permissions:
   Ad Accounts > [select account] > Assign Assets
   Select App → Permissions:
   ☑ Manage Ads
   ☑ Read Ads
   → Save
```

### KROK 4: Generate Long-Lived Access Token

```
1. Tools > Access Token Tool
   https://developers.facebook.com/tools/access-token/
2. Select App: [your app]
3. User Token > Add Permissions:
   ☑ ads_management
   ☑ ads_read
   ☑ business_management
4. Generate Token (60-day token)
5. Extend to Long-Lived:
   Use Graph API Explorer:
   GET /oauth/access_token?
       grant_type=fb_exchange_token&
       client_id={app-id}&
       client_secret={app-secret}&
       fb_exchange_token={short-lived-token}
```

✅ **GOTOWE!** Zapisz: App ID, App Secret, Long-Lived Token, Account ID

---

## 3. TikTok Ads API Setup

**CZAS:** 1-2 godziny + 1-2 business days approval
**WYMAGANIA:** TikTok Ads Manager account

### KROK 1: Apply for API Access

```
1. Idź do: https://ads.tiktok.com/marketing_api/
2. Apply for Access > Get Started
3. Wypełnij formularz:
   - Company name
   - Use case: "Marketing budget optimization platform"
   - Expected monthly API calls: 10,000+
   - Description: [describe your use case]
4. Submit → Wait 1-2 business days for approval email
```

### KROK 2: Create App (po approval)

```
1. Marketing API Portal > My Apps > Create App
2. App Name: "MBO-Client1-TikTok"
3. Otrzymasz:
   - App ID: 1234567890
   - Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### KROK 3: Authorization Setup

```
1. App Settings > Redirect URI:
   https://mbo.example.com/oauth/tiktok/callback
2. Required Scopes:
   ☑ Ad Account Management
   ☑ Ad Management
   ☑ Reporting
```

### KROK 4: Get Advertiser ID

```
1. TikTok Ads Manager
2. Settings > Advertiser Info
3. Advertiser ID: 1234567890123456
```

### KROK 5: Generate Access Token via OAuth

```
1. OAuth URL:
   https://business-api.tiktok.com/portal/auth?
     app_id={APP_ID}&
     redirect_uri={REDIRECT_URI}&
     state={STATE}
2. User authorizes → receives auth_code
3. Exchange for access token:
   POST https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/
   Body: {
     "app_id": "...",
     "secret": "...",
     "auth_code": "..."
   }
```

✅ **GOTOWE!** Zapisz: App ID, Secret, Access Token, Advertiser ID

---

## 4. LinkedIn Ads API Setup

**CZAS:** 1 godzina
**WYMAGANIA:** LinkedIn Developer Account, Campaign Manager access

### KROK 1: Create LinkedIn App

```
1. Idź do: https://www.linkedin.com/developers/
2. Create App
3. App Name: "MBO-Client1-LinkedIn"
4. LinkedIn Page: [associate with company page]
5. App Description: "Marketing budget optimization platform"
```

### KROK 2: Add Products

```
1. Products tab > Request Access:
   - Marketing Developer Platform ✓
2. Wypełnij formularz → Submit
3. Approval: typically instant or few hours
```

### KROK 3: Auth Configuration

```
1. Auth tab:
   - Client ID: xxxxxxxxxxxxxxxx
   - Client Secret: xxxxxxxxxxxxxxxx
2. Redirect URLs:
   Add: https://mbo.example.com/oauth/linkedin/callback
3. OAuth 2.0 scopes:
   ☑ r_ads (read ads)
   ☑ r_ads_reporting (read reports)
   ☑ w_ads (write/modify ads)
```

### KROK 4: Get Ad Account ID

```
1. LinkedIn Campaign Manager
2. Account Settings > Account Details
3. Account ID (usually 9 digits): 123456789
```

✅ **GOTOWE!** Zapisz: Client ID, Client Secret, Account ID

---

## Environment Variables Configuration

Po zebraniu wszystkich credentials, skonfiguruj `.env` file:

```bash
# File: /home/claude/mbo-backend/.env

# ============================================
# CLIENT IDENTIFICATION
# ============================================
CLIENT_NAME=acme_corp
CLIENT_ID=client_001
DEPLOYMENT_ENV=production

# ============================================
# GOOGLE ADS CREDENTIALS
# ============================================
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here
GOOGLE_ADS_CLIENT_ID=123456789-xxxxxxx.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx
GOOGLE_ADS_REFRESH_TOKEN=1//xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_ADS_CUSTOMER_ID=1234567890

# ============================================
# META ADS CREDENTIALS
# ============================================
META_APP_ID=1234567890123456
META_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
META_AD_ACCOUNT_ID=act_1234567890

# ============================================
# TIKTOK ADS CREDENTIALS
# ============================================
TIKTOK_APP_ID=1234567890
TIKTOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TIKTOK_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TIKTOK_ADVERTISER_ID=1234567890123456

# ============================================
# LINKEDIN ADS CREDENTIALS
# ============================================
LINKEDIN_CLIENT_ID=xxxxxxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxxxxxx
LINKEDIN_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINKEDIN_AD_ACCOUNT_ID=123456789

# ============================================
# MCP SERVER CONFIGURATION
# ============================================
MCP_GOOGLE_ADS_PORT=3001
MCP_META_ADS_PORT=3002
MCP_TIKTOK_ADS_PORT=3003
MCP_LINKEDIN_ADS_PORT=3004
MCP_HOST=localhost

# ============================================
# ANTHROPIC CLAUDE API
# ============================================
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-sonnet-4-20250514
ANTHROPIC_MAX_TOKENS=8000

# ============================================
# DATABASE CONFIGURATION
# ============================================
DATABASE_URL=postgresql://mbo_user:secure_password@localhost:5432/mbo_client1
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=

# TimescaleDB
TIMESCALE_ENABLED=true

# ============================================
# APPLICATION SETTINGS
# ============================================
SECRET_KEY=generate-with-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# CORS
CORS_ORIGINS=["https://mbo.example.com","http://localhost:3000"]

# ============================================
# MONITORING & ALERTS
# ============================================
ENABLE_MONITORING=true
SENTRY_DSN=https://xxxxxxxxxxxxx@sentry.io/xxxxxxx

# Email alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASSWORD=app_specific_password
ALERT_EMAIL=manager@client.com

# ============================================
# OPTIMIZATION SETTINGS
# ============================================
AUTONOMOUS_MODE=true
CONFIDENCE_THRESHOLD=0.85
MAX_DAILY_ADJUSTMENTS=50
MAX_BUDGET_REALLOCATION_PCT=30
MIN_CAMPAIGN_RUNTIME_HOURS=72
```

## Security Best Practices

```bash
# Dodaj do .gitignore
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore

# Ustaw odpowiednie permissions
chmod 600 .env

# Nigdy nie commituj .env do git!
```

## Testing Credentials

Po setupie, przetestuj każdą platformę:

```bash
# 1. Test Google Ads
curl -X POST http://localhost:3001 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# 2. Test Meta Ads
curl -X POST http://localhost:3002 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# 3. Test TikTok Ads
curl -X POST http://localhost:3003 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# 4. Test LinkedIn Ads
curl -X POST http://localhost:3004 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Related Documents

- [Deployment](./08-deployment.md) - Infrastructure setup
- [Security](./11-security.md) - Security best practices
