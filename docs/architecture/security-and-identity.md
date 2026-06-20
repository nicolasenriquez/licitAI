# Security And Identity

## Purpose
Document the security and identity model for the Twenty CRM platform. This covers authentication, authorization (RBAC + RLS), session management, and security infrastructure.

## Primary Audience
AI agents, engineers, architects, and security reviewers.

## Executive Summary
Twenty supports multiple authentication methods: email/password, Google SSO, Microsoft SSO, SAML, OIDC, and API keys. JWT tokens use ES256 (ECDSA P-256) with automatic key rotation for modern security, with HS256 fallback for legacy API keys. Authorization combines role-based access control (RBAC) with 24 granular permission flags and row-level security predicates for enterprise deployments. The permission model is metadata-driven: roles, permissions, and predicates are defined in the database and enforced at the ORM layer via WorkspaceEntityManager.

## Authentication

### Authentication Providers

| Provider | Strategy | Guard | Description |
| --- | --- | --- | --- |
| Email / Password | `sign-in-up.service.ts` | None (manual validation) | Password validated via bcrypt `compareHash()`. Email verification optional. |
| Google SSO | `google.auth.strategy.ts` (Passport) | `google-oauth.guard.ts` | OAuth 2.0. Returns `{ firstName, lastName, email, picture }` from Google profile. |
| Microsoft SSO | `microsoft.auth.strategy.ts` (Passport) | `microsoft-oauth.guard.ts` | OAuth 2.0 with Microsoft Entra ID. |
| SAML | `saml.auth.strategy.ts` (Passport) | `saml-auth.guard.ts` | Enterprise SAML. Configured per workspace via SSO module. |
| OIDC | `oidc.auth.strategy.ts` (Passport) | `oidc-auth.guard.ts` | Enterprise OIDC. Configured per workspace via SSO module. |
| API Key | Via JWT strategy (HS256) | Custom in `jwt.auth.strategy.ts` | Programmatic access. Token signed with workspace-scoped secret. |
| App Token | `app-token.*` | App-scoped context | Tokens for SDK apps. Persisted as `AppTokenEntity`. |

### JWT Token System

#### Algorithm: Dual System

**ES256 (ECDSA P-256) — Primary modern path:**
- Key pairs generated at startup (`generateEcP256KeyPair`)
- Private key encrypted at rest via `secret-encryption.service.ts` (AES-256-GCM)
- Public key stored in `SigningKeyEntity` with `isCurrent` flag for active key
- Cron job rotates signing keys periodically (`rotate-signing-keys.cron.job.ts`)
- Verification: resolves key by `kid` header → fetches public key → verifies
- Verify counter tracks key usage per key for rotation decisions

**HS256 — Legacy fallback:**
- Used for API_KEY tokens and tokens without `kid` header
- Secret derived as: `SHA256(APP_SECRET + workspaceId|userId + tokenType)`
- Workspace-scoped HMAC secret generation (`generateAppSecret()`)

#### Token Types (`JwtTokenTypeEnum`)

| Token Type | Purpose | Expiry |
| --- | --- | --- |
| `ACCESS` | User session token | Configurable (`ACCESS_TOKEN_EXPIRES_IN`) |
| `REFRESH` | Token renewal | Persisted as `AppTokenEntity`, supports grace-period reuse |
| `WORKSPACE_AGNOSTIC` | Pre-workspace selection token | No workspaceId in payload |
| `LOGIN` | SSO callback redirect bridge | Short-lived (`LOGIN_TOKEN_EXPIRES_IN`) |
| `FILE` | File download/upload | Short-lived |
| `API_KEY` | Programmatic API access | API key lifespan |
| `APPLICATION_ACCESS` | App-scoped access | App token lifespan |
| `APPROVED_ACCESS_DOMAIN` | Domain allowlist validation | Domain validation window |

### Login Flow (Email / Password)

```
1. POST credentials → auth.service.ts:validateLoginWithPassword()
2. Find user by email → verify bcrypt hash → check email verification
3. Check workspace membership (invitation or existing member)
4. Generate ACCESS token (ES256) via accessTokenService.generateAccessToken()
5. Generate REFRESH token → persist AppTokenEntity → return JWT
6. Response: { accessOrWorkspaceAgnosticToken, refreshToken }
```

### Login Flow (Social SSO — Google / Microsoft)

```
1. Passport strategy returns { firstName, lastName, email, picture }
2. signInUpWithSocialSSO():
   - No workspaceId → workspace-agnostic token → redirect to workspace selection
   - Workspace specified → create user if new → generate LOGIN token
3. LOGIN token sent via redirect URL → frontend extracts → calls verify mutation
4. verify exchanges LOGIN for ACCESS + REFRESH
```

### Refresh Token Flow

```
1. verifyRefreshToken(): validate JWT signature, check type === REFRESH, lookup AppTokenEntity
2. Reuse grace period: if token revoked recently (within REFRESH_TOKEN_REUSE_GRACE_PERIOD),
   allows concurrent refresh (e.g., two browser tabs)
3. If revoked before grace period → reject
4. renew-token.service.ts: revoke old refresh token → issue new ACCESS + REFRESH pair
```

### API Key Authentication

```
1. generateApiKeyToken(): create HS256 JWT with { sub: workspaceId, type: API_KEY, workspaceId }
2. Signed with APP_SECRET-derived key
3. Validation in jwt.auth.strategy.ts:validateAPIKey():
   - Check workspace exists
   - Look up API key from workspace cache (apiKeyMap)
   - Check not revoked, not expired
4. Auth context carries apiKey and workspace
```

## Authorization (RBAC + RLS)

### Role-Based Access Control

Roles are defined in the metadata schema and assigned to users, API keys, and agents.

#### Role Entity Structure

| Capability | Field | Description |
| --- | --- | --- |
| Super-admin settings | `canUpdateAllSettings` | All settings permissions |
| Super-admin tools | `canAccessAllTools` | All tool permissions |
| Global read | `canReadAllObjectRecords` | Read any object record |
| Global write | `canUpdateAllObjectRecords` | Write any object record |
| Global soft-delete | `canSoftDeleteAllObjectRecords` | Soft-delete any record |
| Global hard-delete | `canDestroyAllObjectRecords` | Hard-delete any record |

#### Granular Permission Flags (24 flags)

**Settings category** (gated by `canUpdateAllSettings`):
- `WORKSPACE`, `WORKSPACE_MEMBERS`, `ROLES`, `DATA_MODEL`, `SECURITY`, `WORKFLOWS`
- `APPLICATIONS`, `LAYOUTS`, `BILLING`, `AI_SETTINGS`, `VIEWS`, `CONNECTED_ACCOUNTS`
- `API_KEYS_AND_WEBHOOKS`, `MARKETPLACE_APPS`

**Tools category** (gated by `canAccessAllTools`):
- `AI`, `UPLOAD_FILE`, `DOWNLOAD_FILE`, `SEND_EMAIL_TOOL`, `HTTP_REQUEST_TOOL`
- `CODE_INTERPRETER_TOOL`, `IMPORT_CSV`, `EXPORT_CSV`

**Special flags**:
- `IMPERSONATE` — Ability to impersonate other users within the workspace
- `SSO_BYPASS` — Bypass workspace auth provider restrictions
- `PROFILE_INFORMATION` — Edit own profile

### Permission Checking Engine

The `permissions.service.ts` resolves permissions from the auth context:

```
Input: { userWorkspaceId?, workspaceId, setting: PermissionFlagType, apiKeyId?, applicationId? }

Resolution order:
1. apiKeyId → check role via apiKeyRoleService
2. userWorkspaceId → check user's role via userRoleService
3. applicationId → check application's defaultRoleId

checkRolePermissions():
  - Tool permission → check role.canAccessAllTools first (super-admin bypass)
  - Settings permission → check role.canUpdateAllSettings first (super-admin bypass)
  - Then check granular flags via rolePermissionFlags relation
```

### Row-Level Security (RLS)

Enterprise feature for per-record access control:

- **Predicates**: conditions on fields (e.g., `company.ownerId = currentUser.id`)
- **Operands**: `CONTAINS`, `EQUALS`, etc.
- **Grouping**: predicates grouped with AND/OR semantics
- **Dynamic values**: `workspaceMemberFieldMetadataId` references the current user for dynamic filtering
- **Per role + per object**: each group has a `roleId` and `objectMetadataId`
- **Injected at ORM level**: WorkspaceEntityManager injects RLS predicates into all queries

## Security Infrastructure

### Encryption at Rest

Two-layer encryption via `secret-encryption.service.ts`:

| Layer | Algorithm | Use |
| --- | --- | --- |
| Legacy | AES-CTR | Older secrets without key rotation support |
| Modern (v2) | AES-256-GCM | Current standard. Envelope format: `enc:v2:${keyId}:${base64urlPayload}` |

Features:
- Key derivation: workspace-scoped HMAC optional
- Key ID: SHA256 of raw key, supports multi-key rotation
- Integrity: GCM auth tag protects against tampering
- Masking: `decryptAndMask()` reveals first few chars for display
- Keys sourced from `ENCRYPTION_KEY` and `FALLBACK_ENCRYPTION_KEY` environment variables
- Used for: JWT private key storage, connected account credentials

### Rate Limiting

Token bucket algorithm via `throttler.service.ts`:
- `tokenBucketThrottleOrThrow(key, tokensToConsume, maxTokens, timeWindow)` — throws on limit
- State stored in Redis / engine cache (`CacheStorageNamespace.EngineWorkspace`)
- Tokens refill at `maxTokens / timeWindow` per millisecond
- State TTL: `timeWindow * 2`

### CAPTCHA

- `CaptchaGuard` extracts `captchaToken` from GraphQL args
- Driver factory supports: Google reCAPTCHA, Cloudflare Turnstile, or Disabled (no-op)
- Configurable via `CAPTCHA_DRIVER`, `CAPTCHA_SITE_KEY`, `CAPTCHA_SECRET_KEY`
- Failed CAPTCHAs logged as `MetricsKeys.InvalidCaptcha`

### Impersonation

Two levels of impersonation via `impersonation-authorization.service.ts`:

| Level | Requirements | Scope |
| --- | --- | --- |
| Server-level | `user.canImpersonate === true` AND workspace `allowImpersonation === true`. Non-dev environments also require 2FA. | Cross-workspace. Admin impersonates any user. |
| Workspace-level | User's role has `IMPERSONATE` permission flag. Cannot impersonate admin users unless impersonator also has admin privileges. | Within same workspace. |

Impersonation tokens carry: `isImpersonating: true`, `impersonatorUserWorkspaceId`, `impersonatedUserWorkspaceId`.

### SQL Injection Prevention

`sql-sanitization` module validates values interpolated into raw SQL against a whitelist of known-safe values (enum values, action keywords).

### Domain Allowlisting

`approved-access-domain` module:
- `ApprovedAccessDomainEntity`: `{ domain, isValidated, workspaceId }`
- If user email domain matches a validated approved access domain: skip workspace membership/invitation checks

## Middleware Stack

### GraphQL / Metadata / Admin-Panel Endpoints

```
Request → Middleware Pipeline (in order):

1. GraphQLHydrateRequestFromTokenMiddleware
   - Extracts JWT from Authorization header (Bearer token)
   - Validates token via AccessTokenService.validateTokenByRequest()
   - Dispatches by token type (ACCESS, API_KEY, APPLICATION_ACCESS, WORKSPACE_AGNOSTIC)
   - Gets metadata version from workspace storage cache
   - Binds auth data to request object:
     { user, workspace, apiKey, application, userWorkspace, workspaceMember,
       workspaceMemberId, userWorkspaceId, authProvider, tokenType,
       impersonationContext, workspaceMetadataVersion }
   - If no token: sets locale from x-locale header, passes through (unauthenticated)

2. WorkspaceAuthContextMiddleware
   - Only runs if req.workspace is defined
   - Builds WorkspaceAuthContext (user | apiKey | application | pending-activation-user)
   - Sets Sentry context
   - Stores in AsyncLocalStorage via withWorkspaceAuthContext()
```

### REST Endpoints

```
Request → RestCoreMiddleware → WorkspaceAuthContextMiddleware
```

### MCP Endpoint

```
Request → McpMethodGuardMiddleware (protocol-specific)
```

## Guard Catalog

### Engine-Level Guards

| Guard | Purpose |
| --- | --- |
| `JwtAuthGuard` | REST endpoint JWT validation. Checks token, apiKey/user/application existence. |
| `UserAuthGuard` | Ensures `request.user` exists. Used on GraphQL resolvers requiring authentication. |
| `WorkspaceAuthGuard` | Ensures `request.workspace` exists. Used on workspace-scoped resolvers. |
| `SettingsPermissionGuard(flag)` | Factory/mixin. Checks granular permission flag via `permissionsService`. Bypasses during workspace creation. |
| `CustomPermissionGuard` | Marker: resolver handles its own authorization. Always passes. |
| `NoPermissionGuard` | Marker: explicitly no permission required. For init, onboarding, self-service. |
| `PublicEndpointGuard` | Marker: public/unauthenticated. |
| `RequireAccessTokenGuard` | Rejects non-ACCESS tokens (blocks API_KEY, APPLICATION_ACCESS for sensitive ops). |
| `FeatureFlagGuard` | Feature flag gating via `@RequireFeatureFlag(key)` decorator. |
| `AdminPanelGuard` | Server admin only. Checks `userIsFullAdmin()`. |
| `AdminPanelOrImpersonateGuard` | Admin + impersonator access for admin panel read-only lookups. |
| `ImpersonatePermissionGuard` | Checks server-level or workspace-level impersonation permission. |
| `ServerLevelImpersonateGuard` | Server-level impersonation only. |
| `NoImpersonationGuard` | Blocks sensitive operations during impersonation. |
| `BillingDisabledGuard` | Returns true when billing is disabled. |

### Auth Module Guards

| Guard | Purpose |
| --- | --- |
| `IsUserAuthContextGuard` | Ensures auth context is user-based |
| `IsApiKeyAuthContextGuard` | Ensures auth context is API key-based |
| `IsApplicationAuthContextGuard` | Ensures auth context is application-based |
| `IsSystemAuthContextGuard` | Ensures auth context is system-based |
| `GoogleOAuthGuard` | Passport Google OAuth |
| `GoogleProviderEnabledGuard` | Checks Google SSO enabled for workspace |
| `MicrosoftOAuthGuard` | Passport Microsoft OAuth |
| `MicrosoftProviderEnabledGuard` | Checks Microsoft SSO enabled |
| `SamlAuthGuard` | SAML authentication |
| `OidcAuthGuard` | OIDC authentication |
| `EnterpriseFeaturesEnabledGuard` | Checks enterprise features enabled |

## Current Assumptions

- ES256 (ECDSA P-256) with automatic key rotation is the primary JWT signing method.
- HS256 is maintained for backward compatibility with legacy API keys.
- RBAC with granular permission flags remains the primary authorization model.
- Row-level security predicates remain an enterprise feature.
- PostgreSQL schema isolation (`workspace_<id>`) is the primary multi-tenant security boundary.
- Secrets are encrypted at rest using AES-256-GCM.
- CAPTCHA is optional and configurable per environment.

## Open Decisions

- Should there be a formal security audit schedule for the auth module?
- Should API key authentication be migrated from HS256 to ES256?
- Should row-level security be available in the community edition or remain enterprise-only?
- Should there be a session management UI for users to view and revoke active sessions?
- Should 2FA be extended beyond server-level impersonation to general user authentication?
