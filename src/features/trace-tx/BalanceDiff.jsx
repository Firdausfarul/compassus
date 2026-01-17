import { shortenAddress, formatEther } from '../../utils/formatters'
import { CopyButton } from '../../components/CopyButton'

export function BalanceDiff({ diffs }) {
  if (!diffs || Object.keys(diffs).length === 0) {
    return (
      <div className="text-muted text-sm">
        No balance changes detected.
      </div>
    )
  }

  const entries = Object.entries(diffs)

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium">Balance Changes</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 px-3 text-muted font-medium">Address</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Before</th>
              <th className="text-right py-2 px-3 text-muted font-medium">After</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([address, { before, after }]) => {
              const beforeBig = BigInt(before)
              const afterBig = BigInt(after)
              const change = afterBig - beforeBig
              const isPositive = change > 0

              return (
                <tr key={address} className="border-b border-[var(--border)] hover:bg-[var(--bg)]">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{shortenAddress(address, 6)}</span>
                      <CopyButton value={address} />
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-muted">
                    {formatEther(beforeBig)} ETH
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {formatEther(afterBig)} ETH
                  </td>
                  <td className={`py-2 px-3 text-right font-mono ${
                    isPositive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isPositive ? '+' : ''}{formatEther(change)} ETH
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
