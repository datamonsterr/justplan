# Supabase Configuration (config.toml)

Complete reference for `supabase/config.toml`.

## File Location

Created by `supabase init` at: `supabase/config.toml`

## Basic Structure

```toml
# Project ID (set after linking)
project_id = "your-project-ref"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.pooler]
enabled = false
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[studio]
enabled = true
port = 54323
api_url = "http://localhost"

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
file_size_limit = "50MiB"

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
enable_signup = true
enable_anonymous_sign_ins = false

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[auth.sms]
enable_signup = true
enable_confirmations = false

[realtime]
enabled = true

[analytics]
enabled = false
port = 54327
vector_port = 54328
```

## API Configuration

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000
```

| Setting | Description |
|---------|-------------|
| `enabled` | Enable/disable API |
| `port` | API port |
| `schemas` | Exposed schemas |
| `max_rows` | Max rows per request |

## Database Configuration

```toml
[db]
port = 54322
shadow_port = 54320
major_version = 15

[db.pooler]
enabled = false
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100
```

| Setting | Description |
|---------|-------------|
| `port` | PostgreSQL port |
| `shadow_port` | Shadow DB for migrations |
| `major_version` | PostgreSQL version |
| `pooler.pool_mode` | `transaction` or `session` |

## Auth Configuration

```toml
[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
enable_signup = true
enable_anonymous_sign_ins = false
minimum_password_length = 6

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
secure_password_change = true
max_frequency = "1s"
otp_length = 6
otp_expiry = 3600

[auth.sms]
enable_signup = true
enable_confirmations = false
```

## OAuth Providers

```toml
[auth.external.github]
enabled = true
client_id = "env(GITHUB_CLIENT_ID)"
secret = "env(GITHUB_SECRET)"
redirect_uri = ""

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_SECRET)"
redirect_uri = ""

[auth.external.azure]
enabled = false
client_id = ""
secret = ""
url = ""
```

### Using Environment Variables

```toml
# Reference environment variables with env()
client_id = "env(GITHUB_CLIENT_ID)"
secret = "env(GITHUB_SECRET)"
```

Create `.env` file in project root:

```bash
GITHUB_CLIENT_ID=your-client-id
GITHUB_SECRET=your-client-secret
```

**Add to `.gitignore`:**
```
.env
.env.local
```

## Storage Configuration

```toml
[storage]
enabled = true
file_size_limit = "50MiB"

[storage.image_transformation]
enabled = true

# Define buckets
[storage.buckets.avatars]
public = true
file_size_limit = "10MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/gif"]

[storage.buckets.documents]
public = false
file_size_limit = "50MiB"
allowed_mime_types = ["application/pdf"]
```

## Edge Functions Configuration

```toml
[functions.hello-world]
verify_jwt = true
import_map = "./supabase/functions/deno.json"

[functions.webhook-handler]
verify_jwt = false
```

| Setting | Description |
|---------|-------------|
| `verify_jwt` | Require authentication |
| `import_map` | Deno import map file |

## Email Templates

```toml
[auth.email.template.invite]
subject = "You are invited"
content_path = "./supabase/templates/invite.html"

[auth.email.template.confirmation]
subject = "Confirm your email"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.recovery]
subject = "Reset your password"
content_path = "./supabase/templates/recovery.html"

[auth.email.template.magic_link]
subject = "Your magic link"
content_path = "./supabase/templates/magic-link.html"
```

## Branch Configuration

For multi-environment setups:

```toml
[remotes.staging]
project_id = "staging-project-ref"

[remotes.production]
project_id = "production-project-ref"
```

## Realtime Configuration

```toml
[realtime]
enabled = true
ip_version = 4
max_header_length = 4096
```

## Analytics Configuration

```toml
[analytics]
enabled = false
port = 54327
vector_port = 54328
gcp_project_id = ""
gcp_project_number = ""
gcp_jwt_path = "supabase/gcloud.json"
```

## Applying Configuration Changes

### Local

```bash
supabase stop
supabase start
```

### Remote

```bash
supabase projects update-config
```

## Complete Example

```toml
# supabase/config.toml
project_id = "your-project-ref"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
max_rows = 1000

[db]
port = 54322
major_version = 15

[studio]
enabled = true
port = 54323

[inbucket]
enabled = true
port = 54324

[storage]
enabled = true
file_size_limit = "50MiB"

[storage.buckets.avatars]
public = true
file_size_limit = "5MiB"
allowed_mime_types = ["image/png", "image/jpeg"]

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = [
  "http://localhost:3000/auth/callback",
  "https://yourapp.com/auth/callback"
]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[auth.external.github]
enabled = true
client_id = "env(GITHUB_CLIENT_ID)"
secret = "env(GITHUB_SECRET)"

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_SECRET)"

[functions.api-handler]
verify_jwt = true

[functions.webhook]
verify_jwt = false

[realtime]
enabled = true

[analytics]
enabled = false
```

## Troubleshooting

### Config Not Applied

1. Stop local stack: `supabase stop`
2. Restart: `supabase start`

### Environment Variable Not Found

1. Check `.env` file exists in project root
2. Verify variable name matches exactly
3. Restart local stack

### Invalid Config

```bash
# Validate config
supabase start --debug
```

Check output for configuration errors.
