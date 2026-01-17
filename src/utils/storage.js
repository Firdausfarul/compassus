import { keccak256, encodePacked, pad, toHex, encodeAbiParameters, parseAbiParameters } from 'viem'

// Calculate storage slot for an array element
// arraySlot: the slot where the array length is stored
// index: the element index
export function getArrayElementSlot(arraySlot, index) {
  // Array data starts at keccak256(slot)
  // Element i is at keccak256(slot) + i
  const slotHex = typeof arraySlot === 'bigint'
    ? pad(toHex(arraySlot), { size: 32 })
    : pad(arraySlot, { size: 32 })

  const baseSlot = BigInt(keccak256(slotHex))
  const elementSlot = baseSlot + BigInt(index)

  return toHex(elementSlot, { size: 32 })
}

// Calculate storage slot for a mapping value
// mappingSlot: the slot where the mapping is declared
// key: the mapping key
// keyType: the type of the key (address, uint256, bytes32, string)
export function getMappingSlot(mappingSlot, key, keyType = 'uint256') {
  const slotHex = typeof mappingSlot === 'bigint'
    ? pad(toHex(mappingSlot), { size: 32 })
    : pad(mappingSlot, { size: 32 })

  let keyEncoded

  switch (keyType) {
    case 'address':
      keyEncoded = pad(key, { size: 32 })
      break
    case 'uint256':
    case 'uint':
    case 'int256':
    case 'int':
      keyEncoded = pad(toHex(BigInt(key)), { size: 32 })
      break
    case 'bytes32':
      keyEncoded = pad(key, { size: 32 })
      break
    case 'string':
      // For string keys, we need to keccak256 the string first then pad
      keyEncoded = keccak256(new TextEncoder().encode(key))
      break
    default:
      // Try to use as-is
      keyEncoded = pad(key, { size: 32 })
  }

  // slot = keccak256(key . slot) where . is concatenation
  const concat = `${keyEncoded}${slotHex.slice(2)}`
  return keccak256(concat)
}

// Calculate storage slot for nested mapping
// Example: mapping(address => mapping(uint256 => value))
// mappingSlot: base slot
// keys: array of {value, type} objects
export function getNestedMappingSlot(mappingSlot, keys) {
  let currentSlot = typeof mappingSlot === 'bigint'
    ? pad(toHex(mappingSlot), { size: 32 })
    : pad(mappingSlot, { size: 32 })

  for (const { value, type } of keys) {
    currentSlot = getMappingSlot(currentSlot, value, type)
  }

  return currentSlot
}

// Format slot input (handles decimal and hex)
export function normalizeSlot(slot) {
  if (typeof slot === 'string') {
    const trimmed = slot.trim()
    if (trimmed.startsWith('0x')) {
      return pad(trimmed, { size: 32 })
    }
    return pad(toHex(BigInt(trimmed)), { size: 32 })
  }
  if (typeof slot === 'bigint') {
    return pad(toHex(slot), { size: 32 })
  }
  if (typeof slot === 'number') {
    return pad(toHex(BigInt(slot)), { size: 32 })
  }
  return pad(toHex(0n), { size: 32 })
}

// Get multiple consecutive slots (for structs/multi-slot values)
export function getConsecutiveSlots(startSlot, count) {
  const slots = []
  const start = BigInt(normalizeSlot(startSlot))

  for (let i = 0; i < count; i++) {
    slots.push(toHex(start + BigInt(i), { size: 32 }))
  }

  return slots
}
