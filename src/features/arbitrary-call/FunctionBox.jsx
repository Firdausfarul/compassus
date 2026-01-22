import { useState } from 'react'
import { ParameterInput } from './ParameterInput'
import { ResultDisplay } from '../../components/ResultDisplay'
import { CopyButton } from '../../components/CopyButton'
import { getFunctionSelector, encodeCallData, decodeReturnData, decodeWithCustomType, parseInputValue, isViewFunction } from '../../utils/abi'

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ChevronIcon = ({ expanded }) => (
  <svg className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

// Format a decoded value for display
function formatDecodedValue(val) {
  if (val === null || val === undefined) return 'null'
  if (typeof val === 'bigint') return val.toString()
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'string') return val
  if (Array.isArray(val)) {
    return val.map(v => formatDecodedValue(v))
  }
  if (typeof val === 'object') {
    const result = {}
    for (const [k, v] of Object.entries(val)) {
      result[k] = formatDecodedValue(v)
    }
    return result
  }
  return String(val)
}

// Recursively render decoded values
function DecodedValue({ value, outputs, depth = 0 }) {
  // Handle array of values (multiple return values)
  if (Array.isArray(value) && outputs && outputs.length > 1) {
    return (
      <div className="flex flex-col gap-2">
        {value.map((val, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="text-xs text-muted">
              {outputs[i]?.name || `[${i}]`} <span className="opacity-75">({outputs[i]?.type})</span>
            </span>
            <DecodedValue
              value={val}
              outputs={outputs[i]?.components}
              depth={depth + 1}
            />
          </div>
        ))}
      </div>
    )
  }

  // Handle single tuple/struct
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const entries = Object.entries(value)
    return (
      <div className={`flex flex-col gap-1 ${depth > 0 ? 'pl-3 border-l-2 border-[var(--border)]' : ''}`}>
        {entries.map(([key, val], i) => (
          <div key={key} className="flex flex-col gap-0.5">
            <span className="text-xs text-muted font-mono">{key}:</span>
            <div className="value-display text-sm">
              {typeof val === 'object' && val !== null ? (
                <DecodedValue value={val} depth={depth + 1} />
              ) : (
                formatDecodedValue(val)
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Handle array of items
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <div className="value-display text-sm">[]</div>
    }

    // Check if it's an array of primitives or structs
    const firstItem = value[0]
    const isStructArray = typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)

    if (isStructArray) {
      return (
        <div className="flex flex-col gap-2">
          {value.map((item, i) => (
            <div key={i} className="p-2 bg-[var(--bg)] rounded">
              <span className="text-xs text-muted font-mono">[{i}]</span>
              <DecodedValue value={item} depth={depth + 1} />
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="value-display text-sm">
        [{value.map(v => formatDecodedValue(v)).join(', ')}]
      </div>
    )
  }

  // Handle primitive value
  return (
    <div className="value-display text-sm">
      {formatDecodedValue(value)}
    </div>
  )
}

// Convert value to wei based on unit
function toWei(value, unit) {
  if (!value || value === '') return 0n
  const num = value.toString()
  switch (unit) {
    case 'eth':
      return BigInt(Math.floor(parseFloat(num) * 1e18))
    case 'gwei':
      return BigInt(Math.floor(parseFloat(num) * 1e9))
    case 'wei':
    default:
      return BigInt(num)
  }
}

export function FunctionBox({ funcDef, contractAddress, wallet, onRemove }) {
  const [expanded, setExpanded] = useState(true)
  const [params, setParams] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [showReturnType, setShowReturnType] = useState(false)
  const [customReturnType, setCustomReturnType] = useState('')
  const [sendValue, setSendValue] = useState('')
  const [valueUnit, setValueUnit] = useState('wei')

  const selector = getFunctionSelector(funcDef)
  const isView = isViewFunction(funcDef)

  const handleParamChange = (name, value) => {
    setParams(prev => ({ ...prev, [name]: value }))
  }

  const getArgs = () => {
    return funcDef.inputs.map((input, index) => {
      const key = input.name || `arg${index}`
      const value = params[key] || ''
      return parseInputValue(value, input.type, input.components)
    })
  }

  const handleCall = async () => {
    if (!wallet.publicClient) {
      setError('Please connect to a network first')
      return
    }

    if (!contractAddress) {
      setError('Please enter a contract address')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setTxHash(null)

    try {
      const args = getArgs()
      const data = encodeCallData(funcDef, args)

      const valueInWei = toWei(sendValue, valueUnit)

      const returnData = await wallet.publicClient.call({
        to: contractAddress,
        data,
        value: valueInWei
      })

      if (returnData.data) {
        // First try custom return type if specified
        if (customReturnType.trim()) {
          try {
            const { decoded, parsedTypes } = decodeWithCustomType(returnData.data, customReturnType)
            setResult({
              raw: returnData.data,
              decoded,
              outputs: parsedTypes,
              customDecode: true
            })
            return
          } catch (decodeErr) {
            console.warn('Custom decode failed:', decodeErr)
            // Fall through to default decoding
          }
        }

        // Try to decode based on outputs from ABI
        if (funcDef.outputs && funcDef.outputs.length > 0) {
          const decoded = decodeReturnData(funcDef, returnData.data)
          setResult({
            raw: returnData.data,
            decoded,
            outputs: funcDef.outputs
          })
        } else {
          setResult({ raw: returnData.data })
        }
      } else {
        setResult({ raw: '0x' })
      }
    } catch (err) {
      setError(err.message || 'Call failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!wallet.walletClient) {
      setError('Please connect a wallet (MetaMask) to send transactions')
      return
    }

    if (!contractAddress) {
      setError('Please enter a contract address')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setTxHash(null)

    try {
      const args = getArgs()
      const data = encodeCallData(funcDef, args)

      const valueInWei = toWei(sendValue, valueUnit)

      const hash = await wallet.walletClient.sendTransaction({
        to: contractAddress,
        data,
        value: valueInWei,
        account: wallet.account
      })

      setTxHash(hash)

      // Wait for receipt
      const receipt = await wallet.publicClient.waitForTransactionReceipt({ hash })
      setResult({
        raw: `Transaction ${receipt.status === 'success' ? 'succeeded' : 'failed'}`,
        receipt
      })
    } catch (err) {
      setError(err.message || 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <ChevronIcon expanded={expanded} />
          <span className="font-semibold font-mono">{funcDef.name}</span>
          <span className="text-xs font-mono bg-[var(--bg)] px-2 py-0.5 rounded text-muted">
            {selector}
          </span>
          {isView && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
              view
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="p-1 hover:bg-[var(--border)] rounded transition-colors"
          title="Remove function"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="border-t border-[var(--border)] p-4 flex flex-col gap-4">
          {/* Inputs */}
          {funcDef.inputs.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-muted">Parameters</span>
              {funcDef.inputs.map((input, index) => (
                <ParameterInput
                  key={input.name || index}
                  input={input}
                  index={index}
                  value={params[input.name || `arg${index}`] || ''}
                  onChange={(value) => handleParamChange(input.name || `arg${index}`, value)}
                />
              ))}
            </div>
          )}

          {/* Value Input */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted">Value (ETH to send)</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={sendValue}
                onChange={(e) => setSendValue(e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
              />
              <select
                value={valueUnit}
                onChange={(e) => setValueUnit(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm bg-[var(--card)] border border-[var(--border)] cursor-pointer"
              >
                <option value="wei">wei</option>
                <option value="gwei">gwei</option>
                <option value="eth">ETH</option>
              </select>
            </div>
          </div>

          {/* Return Type Override */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowReturnType(!showReturnType)}
              className="flex items-center gap-2 text-sm text-muted hover:text-[var(--text)] transition-colors self-start"
            >
              <SettingsIcon />
              <span>Custom Return Type</span>
              <ChevronIcon expanded={showReturnType} />
            </button>
            {showReturnType && (
              <div className="flex flex-col gap-2 p-3 bg-[var(--bg)] rounded-lg">
                <label className="text-xs text-muted">
                  Specify return type for decoding (useful for manual signatures or struct returns)
                </label>
                <textarea
                  value={customReturnType}
                  onChange={(e) => setCustomReturnType(e.target.value)}
                  placeholder="Examples:
uint256
(address, uint256)
(uint256 id, string name, bool active)
uint256[]
(address owner, uint256 balance)[]"
                  className="px-3 py-2 rounded-lg font-mono text-sm h-24 resize-y"
                />
                <div className="text-xs text-muted space-y-1">
                  <div><span className="font-medium">Supported formats:</span></div>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    <li>Simple: <code className="bg-[var(--card)] px-1 rounded">uint256</code>, <code className="bg-[var(--card)] px-1 rounded">address</code>, <code className="bg-[var(--card)] px-1 rounded">bool</code></li>
                    <li>Arrays: <code className="bg-[var(--card)] px-1 rounded">uint256[]</code>, <code className="bg-[var(--card)] px-1 rounded">address[5]</code></li>
                    <li>Tuples: <code className="bg-[var(--card)] px-1 rounded">(uint256, address)</code></li>
                    <li>Named: <code className="bg-[var(--card)] px-1 rounded">(uint256 id, string name)</code></li>
                    <li>Struct arrays: <code className="bg-[var(--card)] px-1 rounded">(uint256 id, address owner)[]</code></li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCall}
              disabled={loading || !wallet.publicClient}
              className="btn btn-primary"
            >
              {loading ? 'Loading...' : 'Simulate (eth_call)'}
            </button>
            {!isView && (
              <button
                onClick={handleSend}
                disabled={loading || !wallet.walletClient}
                className="btn btn-success"
              >
                {loading ? 'Loading...' : 'Send Transaction'}
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-[var(--error)] text-sm">
              {error}
            </div>
          )}

          {/* Transaction Hash */}
          {txHash && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Tx Hash:</span>
              <span className="font-mono text-sm">{txHash}</span>
              <CopyButton value={txHash} />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Result</span>
                {result.customDecode && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                    custom decode
                  </span>
                )}
              </div>

              {/* Decoded result for typed outputs */}
              {result.decoded !== undefined && result.outputs && (
                <div className="flex flex-col gap-2">
                  <DecodedValue value={result.decoded} outputs={result.outputs} />
                </div>
              )}

              {/* Raw result */}
              <ResultDisplay
                value={result.raw}
                label="Raw"
                showFormatSelector={typeof result.raw === 'string' && result.raw.startsWith('0x')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
