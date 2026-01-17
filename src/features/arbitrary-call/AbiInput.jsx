import { useState } from 'react'
import { parseAbiJson } from '../../utils/abi'

export function AbiInput({ onParsed }) {
  const [abiText, setAbiText] = useState('')
  const [error, setError] = useState(null)

  const handleParse = () => {
    if (!abiText.trim()) {
      setError('Please enter an ABI')
      return
    }

    const { functions, error: parseError } = parseAbiJson(abiText)

    if (parseError) {
      setError(parseError)
      return
    }

    if (!functions || functions.length === 0) {
      setError('No functions found in ABI')
      return
    }

    setError(null)
    onParsed(functions)
    setAbiText('')
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setAbiText(text)
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Paste ABI JSON</label>
        <button
          onClick={handlePaste}
          className="btn btn-secondary text-xs py-1"
        >
          Paste from Clipboard
        </button>
      </div>
      <textarea
        value={abiText}
        onChange={(e) => {
          setAbiText(e.target.value)
          setError(null)
        }}
        placeholder='[{"type":"function","name":"balanceOf","inputs":[...],"outputs":[...]}]'
        className="w-full h-32 px-3 py-2 rounded-lg font-mono text-sm resize-y"
      />
      {error && (
        <div className="text-[var(--error)] text-sm">{error}</div>
      )}
      <button
        onClick={handleParse}
        disabled={!abiText.trim()}
        className="btn btn-primary self-start"
      >
        Parse & Add Functions
      </button>
    </div>
  )
}
