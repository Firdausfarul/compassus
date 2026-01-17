import { useState } from 'react'
import { CopyButton } from './CopyButton'

export function ConnectWallet({ wallet }) {
  const [rpcInput, setRpcInput] = useState('')
  const [showRpcInput, setShowRpcInput] = useState(false)

  const {
    account,
    chainName,
    chainId,
    rpcUrl,
    isConnecting,
    error,
    isConnected,
    connectionType,
    connectMetaMask,
    connectRpc,
    disconnect
  } = wallet

  const handleRpcConnect = async () => {
    if (rpcInput.trim()) {
      await connectRpc(rpcInput.trim())
    }
  }

  if (isConnected) {
    return (
      <div className="card rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--success)]"></div>
              <span className="font-medium">Connected</span>
            </div>
            <div className="text-muted text-sm">
              {chainName && <span className="font-mono">{chainName}</span>}
              {chainId && <span className="ml-2 opacity-60">(ID: {chainId})</span>}
            </div>
            {account && (
              <div className="flex items-center gap-1 font-mono text-sm bg-[var(--bg)] px-2 py-1 rounded">
                <span className="break-all">{account}</span>
                <CopyButton value={account} />
              </div>
            )}
            {connectionType === 'rpc' && (
              <div className="text-muted text-sm truncate max-w-xs" title={rpcUrl}>
                {rpcUrl}
              </div>
            )}
          </div>
          <button onClick={disconnect} className="btn btn-secondary text-sm">
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card rounded-lg p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={connectMetaMask}
            disabled={isConnecting}
            className="btn btn-primary"
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>

          <span className="text-muted">or</span>

          {!showRpcInput ? (
            <button
              onClick={() => setShowRpcInput(true)}
              className="btn btn-secondary"
            >
              Use RPC URL
            </button>
          ) : (
            <div className="flex flex-1 gap-2 min-w-[300px]">
              <input
                type="text"
                value={rpcInput}
                onChange={(e) => setRpcInput(e.target.value)}
                placeholder="https://mainnet.infura.io/v3/..."
                className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleRpcConnect()}
              />
              <button
                onClick={handleRpcConnect}
                disabled={isConnecting || !rpcInput.trim()}
                className="btn btn-primary"
              >
                Connect
              </button>
              <button
                onClick={() => setShowRpcInput(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="text-[var(--error)] text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
