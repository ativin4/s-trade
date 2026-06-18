import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

// Derive 32-byte key from ENCRYPTION_KEY env (any length passphrase → sha256)
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error('ENCRYPTION_KEY env var not set')
  return createHash('sha256').update(raw).digest()
}

const ALGO = 'aes-256-gcm'

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // format: iv(12):tag(16):ciphertext — all hex
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(encoded: string): string {
  const key = getKey()
  const [ivHex, tagHex, cipherHex] = encoded.split(':')
  if (!ivHex || !tagHex || !cipherHex) throw new Error('Invalid encrypted format')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const ciphertext = Buffer.from(cipherHex, 'hex')
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8')
}

/** Decrypt only if the value looks encrypted (contains two colons). Plain values pass through. */
export function safeDecrypt(value: string | null): string | null {
  if (!value) return null
  try {
    // Encrypted values are hex:hex:hex
    if ((value.match(/:/g) || []).length >= 2) return decrypt(value)
    return value
  } catch {
    return value
  }
}
