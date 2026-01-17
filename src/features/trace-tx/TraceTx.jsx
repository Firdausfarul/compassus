import { useState } from 'react'
import { ConnectWallet } from '../../components/ConnectWallet'
import { TraceTree } from './TraceTree'
import { BalanceDiff } from './BalanceDiff'
import { StorageDiff } from './StorageDiff'

export function TraceTx({ wallet }) {
  const [txHash, setTxHash] = useState('')
  const [trace, setTrace] = useState(null)
  const [balanceDiff, setBalanceDiff] = useState(null)
  const [storageDiff, setStorageDiff] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('trace')

  const tabs = [
    { id: 'trace', label: 'Call Trace' },
    { id: 'balance', label: 'Balance Diff' },
    { id: 'storage', label: 'Storage Diff' }
  ]

  const [traceMethod, setTraceMethod] = useState(null)

  // Try Parity trace_replayTransaction
  const tryParityTrace = async () => {
    const result = await wallet.publicClient.request({
      method: 'trace_replayTransaction',
      params: [txHash, ['trace', 'stateDiff']]
    })
    return result
  }

  // Try Geth debug_traceTransaction
  const tryGethTrace = async () => {
    const callTrace = await wallet.publicClient.request({
      method: 'debug_traceTransaction',
      params: [txHash, { tracer: 'callTracer' }]
    })

    let prestateTrace = null
    try {
      prestateTrace = await wallet.publicClient.request({
        method: 'debug_traceTransaction',
        params: [txHash, { tracer: 'prestateTracer', tracerConfig: { diffMode: true } }]
      })
    } catch (e) {
      console.warn('prestateTracer not available')
    }

    return { callTrace, prestateTrace }
  }

  // Convert Parity trace format to our internal format
  const parseParityTrace = (parityResult) => {
    const { trace: traceArr, stateDiff } = parityResult

    // Convert flat trace array to nested call tree
    const buildCallTree = (traces) => {
      if (!traces || traces.length === 0) return null

      const root = traces[0]
      const toCallNode = (t) => ({
        type: t.action?.callType?.toUpperCase() || t.type?.toUpperCase() || 'CALL',
        from: t.action?.from,
        to: t.action?.to || t.result?.address,
        value: t.action?.value || '0x0',
        gas: t.action?.gas,
        gasUsed: t.result?.gasUsed,
        input: t.action?.input || '0x',
        output: t.result?.output || '0x',
        error: t.error,
        calls: []
      })

      // Build tree from flat trace using traceAddress
      const nodes = new Map()
      const rootNode = toCallNode(root)
      nodes.set('', rootNode)

      for (let i = 1; i < traces.length; i++) {
        const t = traces[i]
        const node = toCallNode(t)
        const addr = t.traceAddress || []
        const parentAddr = addr.slice(0, -1).join(',')
        const parent = nodes.get(parentAddr) || rootNode
        parent.calls = parent.calls || []
        parent.calls.push(node)
        nodes.set(addr.join(','), node)
      }

      return rootNode
    }

    // Parse stateDiff
    const balances = {}
    const storage = {}

    if (stateDiff) {
      for (const [addr, diff] of Object.entries(stateDiff)) {
        // Balance diff
        if (diff.balance) {
          const bal = diff.balance
          if (bal['*']) {
            balances[addr] = { before: bal['*'].from, after: bal['*'].to }
          } else if (bal['+']) {
            balances[addr] = { before: '0x0', after: bal['+'] }
          } else if (bal['-']) {
            balances[addr] = { before: bal['-'], after: '0x0' }
          }
        }

        // Storage diff
        if (diff.storage && Object.keys(diff.storage).length > 0) {
          storage[addr] = {}
          for (const [slot, slotDiff] of Object.entries(diff.storage)) {
            if (slotDiff['*']) {
              storage[addr][slot] = { before: slotDiff['*'].from, after: slotDiff['*'].to }
            } else if (slotDiff['+']) {
              storage[addr][slot] = { before: '0x0', after: slotDiff['+'] }
            } else if (slotDiff['-']) {
              storage[addr][slot] = { before: slotDiff['-'], after: '0x0' }
            }
          }
        }
      }
    }

    return {
      trace: buildCallTree(traceArr),
      balanceDiff: Object.keys(balances).length > 0 ? balances : null,
      storageDiff: Object.keys(storage).length > 0 ? storage : null
    }
  }

  // Parse Geth prestate trace to get diffs
  const parseGethPrestate = (prestateTrace) => {
    if (!prestateTrace) return { balanceDiff: null, storageDiff: null }

    const balances = {}
    const storage = {}

    const pre = prestateTrace.pre || {}
    const post = prestateTrace.post || {}

    const allAddresses = new Set([...Object.keys(pre), ...Object.keys(post)])

    for (const addr of allAddresses) {
      const preState = pre[addr] || {}
      const postState = post[addr] || {}

      // Balance diff
      const preBal = preState.balance || '0x0'
      const postBal = postState.balance || '0x0'
      if (preBal !== postBal) {
        balances[addr] = { before: preBal, after: postBal }
      }

      // Storage diff
      const preStorage = preState.storage || {}
      const postStorage = postState.storage || {}
      const allSlots = new Set([...Object.keys(preStorage), ...Object.keys(postStorage)])

      if (allSlots.size > 0) {
        storage[addr] = {}
        for (const slot of allSlots) {
          const preVal = preStorage[slot] || '0x0'
          const postVal = postStorage[slot] || '0x0'
          if (preVal !== postVal) {
            storage[addr][slot] = { before: preVal, after: postVal }
          }
        }
        if (Object.keys(storage[addr]).length === 0) {
          delete storage[addr]
        }
      }
    }

    return {
      balanceDiff: Object.keys(balances).length > 0 ? balances : null,
      storageDiff: Object.keys(storage).length > 0 ? storage : null
    }
  }

  const handleTrace = async () => {
    if (!wallet.publicClient) {
      setError('Please connect to a network first')
      return
    }

    if (!txHash.trim()) {
      setError('Please enter a transaction hash')
      return
    }

    if (!txHash.startsWith('0x') || txHash.length !== 66) {
      setError('Invalid transaction hash format')
      return
    }

    setLoading(true)
    setError(null)
    setTrace(null)
    setBalanceDiff(null)
    setStorageDiff(null)
    setTraceMethod(null)

    // Try Parity trace first (Erigon, Nethermind, Besu)
    try {
      const parityResult = await tryParityTrace()
      // Validate the response has expected structure
      if (parityResult && (parityResult.trace || parityResult.stateDiff)) {
        const parsed = parseParityTrace(parityResult)
        if (parsed.trace) {
          setTrace(parsed.trace)
          setBalanceDiff(parsed.balanceDiff)
          setStorageDiff(parsed.storageDiff)
          setTraceMethod('parity')
          setLoading(false)
          return
        }
      }
      throw new Error('Invalid Parity trace response')
    } catch (parityErr) {
      console.warn('Parity trace_replayTransaction not available:', parityErr.message)
    }

    // Fall back to Geth debug_traceTransaction
    try {
      const gethResult = await tryGethTrace()
      setTrace(gethResult.callTrace)
      setTraceMethod('geth')

      const diffs = parseGethPrestate(gethResult.prestateTrace)
      setBalanceDiff(diffs.balanceDiff)
      setStorageDiff(diffs.storageDiff)
    } catch (gethErr) {
      if (gethErr.message?.includes('method not found') || gethErr.code === -32601) {
        setError(
          'Transaction tracing is not available on this RPC endpoint.\n\n' +
          'Supported methods:\n' +
          '- trace_replayTransaction (Erigon, Nethermind, Besu, Foundry/Anvil)\n' +
          '- debug_traceTransaction (Geth, Alchemy, Infura paid plans)\n\n' +
          'For local testing, run Anvil: anvil'
        )
      } else {
        setError(gethErr.message || 'Failed to trace transaction')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Connection */}
      <ConnectWallet wallet={wallet} />

      {/* Transaction Hash Input */}
      <div className="card rounded-lg p-4">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-muted">Transaction Hash</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
              placeholder="0x..."
              className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
            />
            <button
              onClick={handleTrace}
              disabled={loading || !wallet.publicClient}
              className="btn btn-primary"
            >
              {loading ? 'Tracing...' : 'Trace Transaction'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card rounded-lg p-4 bg-red-500/10 border-red-500/30 text-[var(--error)]">
          {error}
        </div>
      )}

      {/* Results */}
      {trace && (
        <div className="card rounded-lg overflow-hidden">
          {/* Method indicator */}
          {traceMethod && (
            <div className="px-4 py-2 bg-[var(--bg)] border-b border-[var(--border)] text-xs text-muted">
              Traced via: <span className="font-mono font-medium">{traceMethod === 'parity' ? 'trace_replayTransaction' : 'debug_traceTransaction'}</span>
              <span className="ml-2 opacity-75">
                ({traceMethod === 'parity' ? 'Erigon/Nethermind/Besu/Anvil' : 'Geth/Alchemy/Infura'})
              </span>
            </div>
          )}
          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                disabled={
                  (tab.id === 'balance' && !balanceDiff) ||
                  (tab.id === 'storage' && !storageDiff)
                }
              >
                {tab.label}
                {tab.id === 'balance' && !balanceDiff && (
                  <span className="text-xs ml-1 opacity-50">(N/A)</span>
                )}
                {tab.id === 'storage' && !storageDiff && (
                  <span className="text-xs ml-1 opacity-50">(N/A)</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'trace' && <TraceTree trace={trace} />}
            {activeTab === 'balance' && (
              balanceDiff ? (
                <BalanceDiff diffs={balanceDiff} />
              ) : (
                <div className="text-muted text-sm">
                  Balance diff data is not available. The RPC node may not support prestateTracer with diffMode.
                </div>
              )
            )}
            {activeTab === 'storage' && (
              storageDiff ? (
                <StorageDiff diffs={storageDiff} />
              ) : (
                <div className="text-muted text-sm">
                  Storage diff data is not available. The RPC node may not support prestateTracer with diffMode.
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="card rounded-lg p-4 text-sm text-muted">
        <h3 className="font-medium mb-2">About Transaction Tracing</h3>
        <div className="space-y-3 text-xs">
          <div>
            <div className="font-medium mb-1">Parity Traces (trace_replayTransaction):</div>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Supported by: Erigon, Nethermind, Besu</li>
              <li>Returns call tree + stateDiff (balance & storage changes)</li>
              <li>Requires archive node for stateDiff</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">Geth Traces (debug_traceTransaction):</div>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Supported by: Geth, Anvil/Foundry, Alchemy (paid), Infura (paid)</li>
              <li>Not supported by: Hardhat, Ganache</li>
            </ul>
          </div>
          <div className="pt-1 border-t border-[var(--border)]">
            For local testing, run Anvil: <code className="bg-[var(--bg)] px-1 rounded">anvil</code>
          </div>
        </div>
      </div>
    </div>
  )
}
