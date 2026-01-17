import { useState } from 'react'
import { shortenAddress, shortenHash } from '../../utils/formatters'
import { CopyButton } from '../../components/CopyButton'
import { ResultDisplay } from '../../components/ResultDisplay'

const ChevronIcon = ({ expanded }) => (
  <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

function ContractStorageDiff({ address, slots }) {
  const [expanded, setExpanded] = useState(true)
  const slotEntries = Object.entries(slots)

  return (
    <div className="card rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--bg)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronIcon expanded={expanded} />
        <span className="font-mono">{shortenAddress(address, 8)}</span>
        <CopyButton value={address} />
        <span className="text-xs text-muted">
          {slotEntries.length} slot{slotEntries.length !== 1 ? 's' : ''} changed
        </span>
      </div>

      {expanded && (
        <div className="border-t border-[var(--border)] p-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-2 text-muted font-medium text-xs">Slot</th>
                <th className="text-left py-2 px-2 text-muted font-medium text-xs">Before</th>
                <th className="text-left py-2 px-2 text-muted font-medium text-xs">After</th>
              </tr>
            </thead>
            <tbody>
              {slotEntries.map(([slot, { before, after }]) => (
                <tr key={slot} className="border-b border-[var(--border)] hover:bg-[var(--bg)]">
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">{shortenHash(slot, 8)}</span>
                      <CopyButton value={slot} />
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-muted break-all">
                        {before === '0x0' || before === '0x0000000000000000000000000000000000000000000000000000000000000000'
                          ? '(empty)'
                          : shortenHash(before, 8)}
                      </span>
                      {before !== '0x0' && <CopyButton value={before} />}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs break-all">
                        {after === '0x0' || after === '0x0000000000000000000000000000000000000000000000000000000000000000'
                          ? '(empty)'
                          : shortenHash(after, 8)}
                      </span>
                      {after !== '0x0' && <CopyButton value={after} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function StorageDiff({ diffs }) {
  if (!diffs || Object.keys(diffs).length === 0) {
    return (
      <div className="text-muted text-sm">
        No storage changes detected.
      </div>
    )
  }

  const entries = Object.entries(diffs)

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium">
        Storage Changes ({entries.length} contract{entries.length !== 1 ? 's' : ''})
      </h3>

      <div className="flex flex-col gap-3">
        {entries.map(([address, slots]) => (
          <ContractStorageDiff key={address} address={address} slots={slots} />
        ))}
      </div>
    </div>
  )
}
