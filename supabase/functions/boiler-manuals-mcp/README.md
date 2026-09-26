# Boiler Manuals MCP

Remote MCP server deployed as a Supabase Edge Function.

It exposes only two write tools:

- `upload_manufacturer_logo`
- `upload_manual`

Both tools take a direct HTTPS `source_url`, download the asset server-side, verify the actual file signature, and upload it to the correct fixed Supabase Storage bucket.

## Claude connector URL

The production endpoint is:

```
https://eqttpdbkdsdedpiciarz.supabase.co/functions/v1/boiler-manuals-mcp?key=<access-key>
```

The access key itself is intentionally **not committed to Git**. Only its SHA-256 hash is stored in the Edge Function source.

## Tool behaviour

### upload_manufacturer_logo

Inputs:

- `manufacturer_id` — existing manufacturer UUID
- `source_url` — direct HTTPS URL to PNG, JPEG or WebP
- `filename` — optional friendly basename

Rules:

- max 2 MiB
- actual image signature is checked
- destination bucket is always `manufacturer-logos`
- generated path begins with the manufacturer UUID
- never overwrites an existing object

The returned `storage_path` can be written to `manufacturers.logo_path`.

### upload_manual

Inputs:

- `model_id` — existing model UUID
- `source_url` — direct HTTPS URL to PDF
- `filename` — optional friendly basename

Rules:

- max 50 MiB
- PDF signature is checked
- destination bucket is always `manuals`
- generated path begins with the model UUID
- never overwrites an existing object

The returned `storage_path` and `file_size` can be used when creating the `manuals` database row.

## Security

- MCP access requires the secret query-string key.
- The plaintext key is not stored in source control.
- Supabase secret credentials remain available only inside Edge Functions.
- Only HTTPS source URLs are accepted.
- localhost, link-local, and common private IPv4 ranges are blocked.
- Redirect destinations are revalidated.
- The client cannot choose a Storage bucket.

The query-string key is a pragmatic connector-compatible first step. For a broader production rollout, migrate the MCP endpoint to Supabase OAuth 2.1 so each user authorizes Claude/ChatGPT with their own account.
