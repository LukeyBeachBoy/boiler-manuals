import { createClient } from 'npm:@supabase/supabase-js@2.100.0';

type UploadKind = 'manufacturer-logo' | 'manual';

type UploadRule = {
  bucket: 'manufacturer-logos' | 'manuals';
  maxBytes: number;
  mimeTypes: readonly string[];
  extensions: readonly string[];
};

const RULES: Record<UploadKind, UploadRule> = {
  'manufacturer-logo': {
    bucket: 'manufacturer-logos',
    maxBytes: 2 * 1024 * 1024,
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    extensions: ['.png', '.jpg', '.jpeg', '.webp'],
  },
  manual: {
    bucket: 'manuals',
    maxBytes: 50 * 1024 * 1024,
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
  },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function parseNamedKey(envName: string): string {
  const raw = Deno.env.get(envName);
  if (!raw) throw new Error(`Missing ${envName}`);
  const parsed = JSON.parse(raw) as Record<string, string>;
  const key = parsed.default;
  if (!key) throw new Error(`${envName} does not contain a default key`);
  return key;
}

function isSafePath(path: string): boolean {
  if (!path || path.length > 512) return false;
  if (path.startsWith('/') || path.endsWith('/')) return false;
  if (path.includes('\\')) return false;
  const parts = path.split('/');
  return parts.every((part) => part.length > 0 && part !== '.' && part !== '..');
}

function extensionOf(path: string): string {
  const fileName = path.split('/').at(-1) ?? '';
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot).toLowerCase() : '';
}

async function hasExpectedSignature(file: File, kind: UploadKind): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (kind === 'manual') {
    return bytes.length >= 5 &&
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46 && // F
      bytes[4] === 0x2d;   // -
  }

  if (file.type === 'image/png') {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return png.every((value, index) => bytes[index] === value);
  }

  if (file.type === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (file.type === 'image/webp') {
    return bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }

  return false;
}

Deno.serve(async (req: Request) => {
  try {
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return json({ error: 'Missing bearer token.' }, 401);
    }

    const token = authorization.slice('Bearer '.length).trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) return json({ error: 'Server configuration error.' }, 500);

    const publishableKey = parseNamedKey('SUPABASE_PUBLISHABLE_KEYS');
    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) {
      return json({ error: 'Invalid or expired user token.' }, 401);
    }

    const { data: isAdmin, error: adminError } = await userClient.rpc('is_directory_admin');
    if (adminError) {
      console.error('Admin check failed', adminError);
      return json({ error: 'Could not verify directory admin access.' }, 500);
    }
    if (!isAdmin) {
      return json({ error: 'Directory admin access required.' }, 403);
    }

    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405);
    }

    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      return json({ error: 'Expected multipart/form-data.' }, 415);
    }

    const form = await req.formData();
    const kind = form.get('kind');
    const path = form.get('path');
    const file = form.get('file');

    if (kind !== 'manufacturer-logo' && kind !== 'manual') {
      return json({ error: 'kind must be manufacturer-logo or manual.' }, 400);
    }
    if (typeof path !== 'string' || !isSafePath(path)) {
      return json({ error: 'Invalid storage path.' }, 400);
    }
    if (!(file instanceof File)) {
      return json({ error: 'file is required.' }, 400);
    }

    const rule = RULES[kind];
    if (!rule.mimeTypes.includes(file.type)) {
      return json({ error: `Unsupported MIME type for ${kind}.` }, 415);
    }
    if (!rule.extensions.includes(extensionOf(path))) {
      return json({ error: `File extension does not match allowed ${kind} types.` }, 400);
    }
    if (file.size <= 0 || file.size > rule.maxBytes) {
      return json({ error: `File size must be between 1 byte and ${rule.maxBytes} bytes.` }, 413);
    }
    if (!(await hasExpectedSignature(file, kind))) {
      return json({ error: 'File contents do not match the declared file type.' }, 415);
    }

    const secretKey = parseNamedKey('SUPABASE_SECRET_KEYS');
    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { data: upload, error: uploadError } = await adminClient.storage
      .from(rule.bucket)
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload failed', uploadError);
      const status = uploadError.message.includes('already exists') ? 409 : 400;
      return json({ error: uploadError.message }, status);
    }

    const filename = path.split('/').at(-1) ?? file.name;
    return json({
      bucket: rule.bucket,
      storage_path: upload.path,
      filename,
      mime_type: file.type,
      file_size: file.size,
    }, 201);
  } catch (error) {
    console.error('Unhandled upload error', error);
    return json({ error: 'Unexpected server error.' }, 500);
  }
});
