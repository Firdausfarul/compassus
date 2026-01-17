import { parseAbi, parseAbiItem, encodeFunctionData, decodeFunctionResult, toFunctionSelector } from 'viem'

// Parse a function signature like "add(uint256 x, uint256 y)" or "add(uint256,uint256)"
export function parseFunctionSignature(signature) {
  const trimmed = signature.trim()

  // Handle "function" prefix
  const withoutPrefix = trimmed.startsWith('function ')
    ? trimmed.slice(9).trim()
    : trimmed

  // Match function name and params
  const match = withoutPrefix.match(/^(\w+)\s*\((.*)\)(?:\s*(?:returns|view|pure|payable|external|public|private|internal).*)?$/i)
  if (!match) {
    throw new Error('Invalid function signature format. Expected: functionName(type1,type2,...)')
  }

  const [, name, paramsStr] = match
  const params = paramsStr.trim() ? parseParams(paramsStr) : []

  return {
    name,
    inputs: params,
    outputs: [], // We'll decode raw for manual signatures
    stateMutability: 'nonpayable',
    type: 'function'
  }
}

function parseParams(paramsStr) {
  const params = []
  let depth = 0
  let current = ''

  for (const char of paramsStr) {
    if (char === '(' || char === '[') depth++
    if (char === ')' || char === ']') depth--

    if (char === ',' && depth === 0) {
      if (current.trim()) {
        params.push(parseParam(current.trim()))
      }
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) {
    params.push(parseParam(current.trim()))
  }

  return params
}

// Keywords to filter out when parsing parameter types
const SOLIDITY_KEYWORDS = ['memory', 'calldata', 'storage', 'indexed']

function parseParam(paramStr) {
  // Handle: "uint256[] calldata ids" or "string memory name" or just "uint256 x" or "uint256"
  const parts = paramStr.trim().split(/\s+/)

  // First part is always the type
  const type = parts[0]

  // Filter out Solidity keywords and get the variable name (last non-keyword part)
  const remainingParts = parts.slice(1).filter(p => !SOLIDITY_KEYWORDS.includes(p.toLowerCase()))
  const name = remainingParts[remainingParts.length - 1] || ''

  // Handle array types
  if (type.includes('[')) {
    return { type, name, internalType: type }
  }

  // Handle tuple types (simplified - not supporting complex nested tuples for manual input)
  if (type === 'tuple') {
    return { type: 'tuple', name, components: [], internalType: 'tuple' }
  }

  return { type, name, internalType: type }
}

export function parseAbiJson(abiString) {
  try {
    const parsed = JSON.parse(abiString)
    // Filter to only functions
    const functions = parsed.filter(item => item.type === 'function')
    return { functions, error: null }
  } catch (err) {
    return { functions: null, error: `Invalid JSON: ${err.message}` }
  }
}

export function createAbiItem(funcDef) {
  return {
    type: 'function',
    name: funcDef.name,
    inputs: funcDef.inputs || [],
    outputs: funcDef.outputs || [],
    stateMutability: funcDef.stateMutability || 'nonpayable'
  }
}

export function getFunctionSelector(funcDef) {
  const abiItem = createAbiItem(funcDef)
  return toFunctionSelector(abiItem)
}

export function encodeCallData(funcDef, args) {
  const abi = [createAbiItem(funcDef)]
  return encodeFunctionData({
    abi,
    functionName: funcDef.name,
    args
  })
}

export function decodeReturnData(funcDef, data) {
  if (!data || data === '0x') {
    return null
  }

  const abi = [createAbiItem(funcDef)]
  try {
    const result = decodeFunctionResult({
      abi,
      functionName: funcDef.name,
      data
    })
    return result
  } catch {
    // Return raw data if decoding fails
    return data
  }
}

export function parseInputValue(value, type, components = null) {
  const trimmed = value.trim()

  // Handle arrays
  if (type.endsWith('[]') || type.match(/\[\d+\]$/)) {
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(trimmed)
      if (!Array.isArray(parsed)) {
        throw new Error('Expected array')
      }
      const baseType = type.replace(/\[\d*\]$/, '')
      return parsed.map(item => {
        if (baseType === 'tuple' && components) {
          return parseStructValue(item, components)
        }
        return parseInputValue(typeof item === 'string' ? item : JSON.stringify(item), baseType)
      })
    } catch {
      // Try comma-separated for simple arrays
      if (!type.startsWith('tuple')) {
        const items = trimmed.split(',').map(s => s.trim())
        const baseType = type.replace(/\[\d*\]$/, '')
        return items.map(item => parseInputValue(item, baseType))
      }
      throw new Error(`Invalid array format for ${type}`)
    }
  }

  // Handle basic types
  if (type.startsWith('uint') || type.startsWith('int')) {
    return BigInt(trimmed)
  }

  if (type === 'bool') {
    return trimmed.toLowerCase() === 'true' || trimmed === '1'
  }

  if (type === 'address') {
    return trimmed
  }

  if (type.startsWith('bytes')) {
    // Ensure hex format
    return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`
  }

  if (type === 'string') {
    return trimmed
  }

  // Tuple/struct types
  if (type === 'tuple') {
    try {
      const parsed = JSON.parse(trimmed)
      if (components && components.length > 0) {
        return parseStructValue(parsed, components)
      }
      return parsed
    } catch {
      throw new Error('Invalid struct format. Use JSON: {"field1": value, "field2": value}')
    }
  }

  return trimmed
}

// Parse a struct value according to its component types
function parseStructValue(obj, components) {
  if (Array.isArray(obj)) {
    // Handle array input: [val1, val2, ...]
    return components.map((comp, i) => {
      const val = obj[i]
      if (comp.type === 'tuple' && comp.components) {
        return parseStructValue(val, comp.components)
      }
      return parseInputValue(typeof val === 'string' ? val : String(val), comp.type)
    })
  }

  // Handle object input: {field1: val1, field2: val2}
  return components.map(comp => {
    const val = obj[comp.name] !== undefined ? obj[comp.name] : obj[components.indexOf(comp)]
    if (val === undefined) {
      throw new Error(`Missing field: ${comp.name}`)
    }
    if (comp.type === 'tuple' && comp.components) {
      return parseStructValue(val, comp.components)
    }
    return parseInputValue(typeof val === 'string' ? val : String(val), comp.type)
  })
}

export function isViewFunction(funcDef) {
  return funcDef.stateMutability === 'view' || funcDef.stateMutability === 'pure'
}

// Parse a custom return type string into ABI parameters
// Supports: uint256, (address, uint256), (uint256 id, string name), uint256[], (address owner, uint256 balance)[]
export function parseReturnType(typeStr) {
  const trimmed = typeStr.trim()

  // Check if it's an array type
  const arrayMatch = trimmed.match(/^(.+)\[\]$/)
  if (arrayMatch) {
    const baseType = arrayMatch[1].trim()
    const baseParams = parseReturnType(baseType)
    if (baseParams.length === 1 && baseParams[0].type === 'tuple') {
      // Array of structs
      return [{ type: 'tuple[]', name: '', components: baseParams[0].components }]
    }
    // Array of simple type
    return [{ type: `${baseParams[0].type}[]`, name: baseParams[0].name }]
  }

  // Check if it's a tuple/struct: (type1 name1, type2 name2, ...)
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(1, -1)
    const components = parseTupleComponents(inner)
    return [{ type: 'tuple', name: '', components }]
  }

  // Simple type: uint256, address, etc.
  const parts = trimmed.split(/\s+/)
  const type = parts[0]
  const name = parts[1] || ''

  return [{ type, name, internalType: type }]
}

function parseTupleComponents(str) {
  const components = []
  let depth = 0
  let current = ''

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    if (char === '(' || char === '[') depth++
    if (char === ')' || char === ']') depth--

    if (char === ',' && depth === 0) {
      if (current.trim()) {
        components.push(parseComponentType(current.trim()))
      }
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) {
    components.push(parseComponentType(current.trim()))
  }

  return components
}

function parseComponentType(str) {
  // Handle nested tuple
  if (str.startsWith('(')) {
    const parenEnd = findMatchingParen(str, 0)
    const tupleContent = str.slice(1, parenEnd)
    const rest = str.slice(parenEnd + 1).trim()

    // Check for array suffix
    const isArray = rest.startsWith('[]')
    const nameStart = isArray ? 2 : 0
    const name = rest.slice(nameStart).trim()

    const components = parseTupleComponents(tupleContent)

    return {
      type: isArray ? 'tuple[]' : 'tuple',
      name,
      components
    }
  }

  // Simple type with optional name: "uint256 id" or just "uint256"
  const parts = str.split(/\s+/)
  const type = parts[0]
  const name = parts[1] || ''

  // Handle array types: "uint256[] amounts"
  return { type, name, internalType: type }
}

function findMatchingParen(str, start) {
  let depth = 0
  for (let i = start; i < str.length; i++) {
    if (str[i] === '(') depth++
    if (str[i] === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  return str.length - 1
}

// Decode data with a custom return type string
export function decodeWithCustomType(data, typeStr) {
  const parsedTypes = parseReturnType(typeStr)

  // Build a minimal ABI for decoding
  const abi = [{
    type: 'function',
    name: '_decode',
    inputs: [],
    outputs: parsedTypes,
    stateMutability: 'view'
  }]

  try {
    const result = decodeFunctionResult({
      abi,
      functionName: '_decode',
      data
    })
    return { decoded: result, parsedTypes }
  } catch (err) {
    throw new Error(`Failed to decode: ${err.message}`)
  }
}
