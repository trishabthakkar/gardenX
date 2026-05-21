import { useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onClear: () => void
}

export default function SearchBar({ value, onChange, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onClear()
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClear])

  return (
    <div className="relative flex items-center">
      <svg
        className="absolute left-2.5 w-3 h-3 text-slate-500 pointer-events-none"
        width="12" height="12"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder="Search… (⌘K)"
        onChange={e => onChange(e.target.value)}
        className="
          w-56 pl-8 pr-7 py-1.5 text-xs rounded-md
          bg-[#121620] border border-slate-700/60 text-slate-300
          placeholder-slate-600 outline-none
          focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/40
          transition-colors
        "
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  )
}
