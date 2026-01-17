import { useState } from 'react'
import { ConnectWallet } from '../../components/ConnectWallet'
import { AddressInput } from '../../components/AddressInput'
import { SlotInput } from './SlotInput'
import { ArrayHelper } from './ArrayHelper'
import { MappingHelper } from './MappingHelper'

export function StorageInspect({ wallet }) {
  const [contractAddress, setContractAddress] = useState('')
  const [activeHelper, setActiveHelper] = useState('slot') // 'slot', 'array', 'mapping'

  const helpers = [
    { id: 'slot', label: 'Direct Slot', icon: '#' },
    { id: 'array', label: 'Array Helper', icon: '[]' },
    { id: 'mapping', label: 'Mapping Helper', icon: '{}' }
  ]

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

      {/* Helper Selection */}
      <div className="card rounded-lg p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted">Storage Query Type:</span>
            <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
              {helpers.map(helper => (
                <button
                  key={helper.id}
                  onClick={() => setActiveHelper(helper.id)}
                  className={`px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                    activeHelper === helper.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--card)] hover:bg-[var(--bg)]'
                  }`}
                >
                  <span className="font-mono text-xs opacity-75">{helper.icon}</span>
                  {helper.label}
                </button>
              ))}
            </div>
          </div>

          {/* Helper Components */}
          {activeHelper === 'slot' && (
            <SlotInput
              contractAddress={contractAddress}
              wallet={wallet}
            />
          )}

          {activeHelper === 'array' && (
            <ArrayHelper
              contractAddress={contractAddress}
              wallet={wallet}
            />
          )}

          {activeHelper === 'mapping' && (
            <MappingHelper
              contractAddress={contractAddress}
              wallet={wallet}
            />
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="card rounded-lg p-4 text-sm text-muted">
        <h3 className="font-medium mb-2">Storage Layout Info</h3>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Each storage slot is 32 bytes (256 bits)</li>
          <li>Simple variables are stored sequentially starting at slot 0</li>
          <li>Dynamic arrays: length at slot N, data starts at keccak256(N)</li>
          <li>Mappings: value for key K at slot keccak256(K || N)</li>
          <li>Nested mappings: keccak256(K2 || keccak256(K1 || N))</li>
        </ul>
      </div>
    </div>
  )
}
