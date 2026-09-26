import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.100.0'
import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js'
import { z } from 'npm:zod@4.1.13'

const ACCESS_KEY_SHA256 = '16803a2a5ea6711b1e7da7e924dff978a13914af7b0a9be99dd75b5acfd9ce78'
const PROJECT_URL = Deno.env.get('SUPABASE_URL')!

type DownloadedFile = {
  bytes: Uint8Array
  mimeType: string
  extension: string
  sourceFilename: string
}

function secretKey(): string {
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (!raw) throw new Error('SUPABASE_SECRET_KEYS is not configured')
  const keys = JSON.parse(raw) as Record<string, string>
  if (!keys.default) throw new Error('No default Supabase secret key is configured')
  return keys.default
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function safeFilename(value: string): string {
  const cleaned = value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._ -]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return cleaned.slice(0, 120) || 'file'
}

function blockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) return true
  if (h === '0.0.0.0' || h === '::1') return true

  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (v4) {
    const [a, b] = v4.slice(1).map(Number)
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
  }
  return false
}

function validateSourceUrl(raw: string): URL {
  const url = new URL(raw)
  if (url.protocol !== 'https:') throw new Error('source_url must use HTTPS')
  if (blockedHost(url.hostname)) throw new Error('source_url points to a blocked host')
  return url
}

async function fetchWithSafeRedirects(rawUrl: string, maxBytes: number): Promise<{ response: Response; finalUrl: URL }> {
  let url = validateSourceUrl(rawUrl)

  for (let i = 0; i < 6; i++) {
    const response = await fetch(url, {
      redirect: 'manual',
      headers: {
        'user-agent': 'BoilerManualsMCP/1.0',
        'accept': '*/*',
      },
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) throw new Error('Redirect response had no Location header')
      url = validateSourceUrl(new URL(location, url).toString())
      continue
    }

    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`)

    const declaredLength = Number(response.headers.get('content-length') ?? 0)
    if (declaredLength > maxBytes) throw new Error(`Source file is larger than the ${maxBytes}-byte limit`)

    return { response, finalUrl: url }
  }

  throw new Error('Too many redirects while downloading source_url')
}

function detectFile(bytes: Uint8Array, kind: 'logo' | 'manual'): { mimeType: string; extension: string } {
  if (kind === 'manual') {
    if (
      bytes.length >= 5 &&
      bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 &&
      bytes[3] === 0x46 && bytes[4] === 0x2d
    ) return { mimeType: 'application/pdf', extension: '.pdf' }
    throw new Error('Downloaded file is not a valid PDF')
  }

  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length >= 8 && png.every((v, i) => bytes[i] === v)) {
    return { mimeType: 'image/png', extension: '.png' }
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: '.jpg' }
  }
  if (
    bytes.length >= 12 &&
    new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
  ) {
    return { mimeType: 'image/webp', extension: '.webp' }
  }
  throw new Error('Downloaded file is not a valid PNG, JPEG or WebP image')
}

async function downloadValidated(
  sourceUrl: string,
  kind: 'logo' | 'manual',
  maxBytes: number,
): Promise<DownloadedFile> {
  const { response, finalUrl } = await fetchWithSafeRedirects(sourceUrl, maxBytes)
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength === 0) throw new Error('Downloaded file is empty')
  if (buffer.byteLength > maxBytes) throw new Error(`Downloaded file is larger than the ${maxBytes}-byte limit`)

  const bytes = new Uint8Array(buffer)
  const detected = detectFile(bytes, kind)
  const urlFilename = decodeURIComponent(finalUrl.pathname.split('/').pop() || 'file')

  return {
    bytes,
    mimeType: detected.mimeType,
    extension: detected.extension,
    sourceFilename: urlFilename,
  }
}

async function upload(
  bucket: 'manufacturer-logos' | 'manuals',
  path: string,
  file: DownloadedFile,
) {
  const supabase = createClient(PROJECT_URL, secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const { data, error } = await supabase.storage.from(bucket).upload(path, file.bytes, {
    contentType: file.mimeType,
    upsert: false,
  })
  if (error) throw new Error(error.message)

  return {
    bucket,
    storage_path: data.path,
    filename: data.path.split('/').pop() ?? '',
    mime_type: file.mimeType,
    file_size: file.bytes.byteLength,
  }
}

const server = new McpServer({
  name: 'boiler-manuals',
  version: '1.0.0',
})

server.registerTool(
  'upload_manufacturer_logo',
  {
    title: 'Upload manufacturer logo',
    description:
      'Download an official manufacturer logo from an HTTPS URL, validate it as PNG/JPEG/WebP, and upload it to the manufacturer-logos Supabase Storage bucket. Returns the storage path to save as manufacturers.logo_path.',
    inputSchema: {
      manufacturer_id: z.string().describe('Existing manufacturer UUID in Supabase'),
      source_url: z.string().url().describe('Direct HTTPS URL to the logo image'),
      filename: z.string().optional().describe('Optional friendly filename; extension is determined from the actual image contents'),
    },
  },
  async ({ manufacturer_id, source_url, filename }) => {
    try {
      if (!isUuid(manufacturer_id)) throw new Error('manufacturer_id must be a valid UUID')
      const file = await downloadValidated(source_url, 'logo', 2 * 1024 * 1024)
      const base = safeFilename((filename ?? file.sourceFilename).replace(/\.[^.]+$/, ''))
      const path = `${manufacturer_id}/${base}-${crypto.randomUUID()}${file.extension}`
      const result = await upload('manufacturer-logos', path, file)

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      }
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: error instanceof Error ? error.message : 'Logo upload failed' }],
      }
    }
  },
)

server.registerTool(
  'upload_manual',
  {
    title: 'Upload boiler manual',
    description:
      'Download an official boiler manual from an HTTPS URL, validate it as a PDF, and upload it to the private manuals Supabase Storage bucket. Returns the storage path and file metadata for the manuals database record.',
    inputSchema: {
      model_id: z.string().describe('Existing boiler model UUID in Supabase'),
      source_url: z.string().url().describe('Direct HTTPS URL to the official PDF'),
      filename: z.string().optional().describe('Optional friendly PDF filename'),
    },
  },
  async ({ model_id, source_url, filename }) => {
    try {
      if (!isUuid(model_id)) throw new Error('model_id must be a valid UUID')
      const file = await downloadValidated(source_url, 'manual', 50 * 1024 * 1024)
      const base = safeFilename((filename ?? file.sourceFilename).replace(/\.pdf$/i, ''))
      const path = `${model_id}/${Date.now()}-${base}.pdf`
      const result = await upload('manuals', path, file)

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      }
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: error instanceof Error ? error.message : 'Manual upload failed' }],
      }
    }
  },
)

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const key = url.searchParams.get('key') ?? ''

  if (!key || (await sha256(key)) !== ACCESS_KEY_SHA256) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  const transport = new WebStandardStreamableHTTPServerTransport()
  await server.connect(transport)
  return transport.handleRequest(req)
})
