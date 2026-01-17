import { hexToString, hexToBigInt, getAddress, hexToBytes, bytesToHex } from 'viem'

export const FORMAT_TYPES = ['raw', 'string', 'uint', 'int', 'bytes32', 'address']

export function formatValue(hexValue, format) {
  if (!hexValue || hexValue === '0x') {
    return { value: '(empty)', error: null }
  }

  // Ensure proper hex format
  const hex = hexValue.startsWith('0x') ? hexValue : `0x${hexValue}`

  try {
    switch (format) {
      case 'raw':
        return { value: hex, error: null }

      case 'string': {
        // Try to decode as string, filtering non-printable characters
        try {
          const decoded = hexToString(hex)
          // Filter out null bytes and check if it's printable
          const printable = decoded.replace(/\x00/g, '').trim()
          if (printable.length === 0) {
            return { value: '(empty string)', error: null }
          }
          return { value: printable, error: null }
        } catch {
          return { value: null, error: 'Invalid UTF-8 string' }
        }
      }

      case 'uint': {
        const bigInt = hexToBigInt(hex)
        return { value: bigInt.toString(), error: null }
      }

      case 'int': {
        // Interpret as signed 256-bit integer
        const bigInt = hexToBigInt(hex)
        const maxPositive = BigInt(2) ** BigInt(255) - BigInt(1)
        if (bigInt > maxPositive) {
          // Negative number in two's complement
          const signedValue = bigInt - (BigInt(2) ** BigInt(256))
          return { value: signedValue.toString(), error: null }
        }
        return { value: bigInt.toString(), error: null }
      }

      case 'bytes32': {
        // Pad to 32 bytes if needed
        const cleanHex = hex.slice(2)
        const padded = cleanHex.padStart(64, '0')
        return { value: `0x${padded}`, error: null }
      }

      case 'address': {
        // Take the last 20 bytes (40 hex chars)
        const cleanHex = hex.slice(2).padStart(64, '0')
        const addressHex = cleanHex.slice(-40)
        try {
          const address = getAddress(`0x${addressHex}`)
          return { value: address, error: null }
        } catch {
          return { value: `0x${addressHex}`, error: 'Invalid checksum' }
        }
      }

      default:
        return { value: hex, error: null }
    }
  } catch (err) {
    return { value: null, error: err.message }
  }
}

export function shortenAddress(address, chars = 4) {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function shortenHash(hash, chars = 6) {
  if (!hash) return ''
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`
}

export function formatEther(wei) {
  if (!wei) return '0'
  const bigInt = typeof wei === 'bigint' ? wei : BigInt(wei)
  const ether = Number(bigInt) / 1e18
  if (ether === 0) return '0'
  if (ether < 0.0001) return '< 0.0001'
  return ether.toFixed(6).replace(/\.?0+$/, '')
}

export function formatGas(gas) {
  if (!gas) return '0'
  const num = typeof gas === 'bigint' ? Number(gas) : Number(gas)
  return num.toLocaleString()
}
