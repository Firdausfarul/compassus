import { useState } from 'react'
import { ConnectWallet } from '../../components/ConnectWallet'
import { AddressInput } from '../../components/AddressInput'
import { AbiInput } from './AbiInput'
import { SignatureInput } from './SignatureInput'
import { FunctionBox } from './FunctionBox'

export function ArbitraryCall({ wallet }) {
  const [contractAddress, setContractAddress] = useState('')
  const [functions, setFunctions] = useState([])
  const [inputMode, setInputMode] = useState('abi') // 'abi' or 'signature'

  const handleAddFunction = (funcDef) => {
    // Check if function with same selector already exists
    const exists = functions.some(f =>
      f.name === funcDef.name &&
      f.inputs.length === funcDef.inputs.length &&
      f.inputs.every((input, i) => input.type === funcDef.inputs[i].type)
    )

    if (!exists) {
      setFunctions(prev => [...prev, { ...funcDef, id: Date.now() }])
    }
  }

  const handleRemoveFunction = (id) => {
    setFunctions(prev => prev.filter(f => f.id !== id))
  }

  const handleParsedAbi = (parsedFunctions) => {
    // Add all functions from ABI
    const withIds = parsedFunctions.map(f => ({ ...f, id: Date.now() + Math.random() }))
    setFunctions(prev => [...prev, ...withIds])
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Connection */}
      <ConnectWallet wallet={wallet} />

      {/* Contract Address */}
      <div className="card rounded-lg p-4">
        <AddressInput
          value={contractAddress}
          onChange={setContractAddress}
          label="Contract Address"
          placeholder="0x..."
        />
      </div>

      {/* Function Input */}
      <div className="card rounded-lg p-4">
        <div className="flex flex-col gap-4">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted">Add Function:</span>
            <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
              <button
                onClick={() => setInputMode('abi')}
                className={`px-4 py-2 text-sm transition-colors ${
                  inputMode === 'abi'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--card)] hover:bg-[var(--bg)]'
                }`}
              >
                From ABI
              </button>
              <button
                onClick={() => setInputMode('signature')}
                className={`px-4 py-2 text-sm transition-colors ${
                  inputMode === 'signature'
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--card)] hover:bg-[var(--bg)]'
                }`}
              >
                Manual Signature
              </button>
            </div>
          </div>

          {/* Input Component */}
          {inputMode === 'abi' ? (
            <AbiInput onParsed={handleParsedAbi} />
          ) : (
            <SignatureInput onAdd={handleAddFunction} />
          )}
        </div>
      </div>

      {/* Function List */}
      {functions.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Functions ({functions.length})</h2>
            {functions.length > 1 && (
              <button
                onClick={() => setFunctions([])}
                className="btn btn-secondary text-sm"
              >
                Clear All
              </button>
            )}
          </div>
          {functions.map(func => (
            <FunctionBox
              key={func.id}
              funcDef={func}
              contractAddress={contractAddress}
              wallet={wallet}
              onRemove={() => handleRemoveFunction(func.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {functions.length === 0 && (
        <div className="card rounded-lg p-8 text-center text-muted">
          <p>No functions added yet.</p>
          <p className="text-sm mt-2">
            Paste an ABI or enter a function signature to get started.
          </p>
        </div>
      )}
    </div>
  )
}
