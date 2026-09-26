# content-upload Edge Function

Restricted server-side upload endpoint for AI/admin automation.

## Authentication

Send a valid Supabase Auth access token for a user who passes `public.is_directory_admin()`:

```
Authorization: Bearer <access-token>
```

The function validates the user token, checks directory-admin membership, then performs the actual Storage upload with Supabase's server-side secret key. The secret key never leaves the Edge Function environment.

## Request

`POST /functions/v1/content-upload` as `multipart/form-data`.

Fields:

- `kind`: `manufacturer-logo` or `manual`
- `path`: destination object path inside the fixed bucket
- `file`: binary file

The caller cannot choose a bucket.

### manufacturer-logo

- Bucket: `manufacturer-logos`
- MIME: JPEG, PNG, WebP
- Max: 2 MiB
- File signature is checked

### manual

- Bucket: `manuals`
- MIME: PDF
- Max: 50 MiB
- File must begin with a PDF signature

Uploads never overwrite an existing object.

## Response

```json
{
  "bucket": "manuals",
  "storage_path": "<model-id>/<filename>.pdf",
  "filename": "<filename>.pdf",
  "mime_type": "application/pdf",
  "file_size": 123456
}
```

The database record is deliberately not created by this endpoint. Agents should use the existing Supabase database integration to create/update `manufacturers`, `models`, `variants`, `manuals`, and `manual_variants` after a successful file upload.
