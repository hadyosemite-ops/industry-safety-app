import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

export function TagInput({ value, onChange, placeholder, suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSugg, setShowSugg] = useState(false);

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
  );

  function addTag(tag: string) {
    const t = tag.trim();
    if (t && !value.includes(t)) {
      onChange([...value, t]);
    }
    setInput('');
    setShowSugg(false);
  }

  function removeTag(tag: string) {
    onChange(value.filter(v => v !== tag));
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div className="relative">
      <div className="min-h-[42px] w-full px-3 py-2 rounded-lg
                      focus-within:ring-2 focus-within:ring-[rgba(0,212,255,0.35)] focus-within:border-[#00d4ff]
                      flex flex-wrap gap-1.5 transition-all duration-150"
           style={{ background: 'var(--bg-input)', border: '1px solid var(--border-strong)' }}>
        {value.map(tag => (
          <span key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold
                       bg-[rgba(0,212,255,0.14)] text-[color:var(--badge-navy-text)] border border-[rgba(0,212,255,0.3)] rounded-md">
            {tag}
            <button type="button" onClick={() => removeTag(tag)}
              className="hover:opacity-70 transition-opacity">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSugg(true); }}
          onKeyDown={handleKey}
          onFocus={() => setShowSugg(true)}
          onBlur={() => setTimeout(() => setShowSugg(false), 150)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-faint)] bg-transparent outline-none"
        />
        {input.trim() && (
          <button type="button" onClick={() => addTag(input)}
            className="flex-shrink-0 text-[color:var(--badge-navy-text)] hover:text-[#00d4ff]">
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSugg && filtered.length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full card
                        shadow-card-hover max-h-40 overflow-y-auto">
          {filtered.map(s => (
            <button key={s} type="button"
              onMouseDown={() => addTag(s)}
              className="w-full px-3 py-2 text-sm text-left text-[color:var(--text-secondary)] hover:bg-[rgba(0,212,255,0.06)] first:rounded-t-lg last:rounded-b-lg">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
