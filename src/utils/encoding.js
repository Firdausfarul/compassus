import {
  encodeAbiParameters,
  decodeAbiParameters,
  parseAbiParameters,
  keccak256,
  toHex,
  fromHex,
  hexToBytes,
  bytesToHex
} from 'viem'

// Encode a value with its type
export function encodeValue(value, type) {
  try {
    const params = parseAbiParameters(type)
    return encodeAbiParameters(params, [value])
  } catch (err) {
    throw new Error(`Failed to encode: ${err.message}`)
  }
}

// Decode a hex value with its type
export function decodeValue(hex, type) {
  try {
    const params = parseAbiParameters(type)
    const result = decodeAbiParameters(params, hex)
    return result[0]
  } catch (err) {
    throw new Error(`Failed to decode: ${err.message}`)
  }
}

// Get the keccak256 hash of data
export function getKeccak256(data) {
  if (typeof data === 'string') {
    if (data.startsWith('0x')) {
      return keccak256(data)
    }
    // Treat as UTF-8 string
    return keccak256(new TextEncoder().encode(data))
  }
  return keccak256(data)
}

// Convert hex to various formats
export function hexToNumber(hex) {
  return fromHex(hex, 'bigint')
}

export function numberToHex(num, size = 32) {
  return toHex(BigInt(num), { size })
}

export function hexToUtf8(hex) {
  const bytes = hexToBytes(hex)
  return new TextDecoder().decode(bytes)
}

export function utf8ToHex(str) {
  const bytes = new TextEncoder().encode(str)
  return bytesToHex(bytes)
}

// Pad hex to specific byte size
export function padHex(hex, size = 32) {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const padded = clean.padStart(size * 2, '0')
  return `0x${padded}`
}

// Calculate function selector from signature
export function getFunctionSelector(signature) {
  const hash = keccak256(new TextEncoder().encode(signature))
  return hash.slice(0, 10) // 4 bytes = 8 hex chars + 0x
}

// Parse calldata into selector and params
export function parseCalldata(data) {
  if (!data || data.length < 10) {
    return { selector: null, params: null }
  }

  return {
    selector: data.slice(0, 10),
    params: `0x${data.slice(10)}`
  }
}
