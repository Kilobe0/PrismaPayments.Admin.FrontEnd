<script lang="ts">
  import { Search } from 'lucide-svelte';

  interface Props {
    value?: string;
    placeholder?: string;
    debounceMs?: number;
    onSearch: (value: string) => void;
  }

  let {
    value = '',
    placeholder = 'Buscar...',
    debounceMs = 300,
    onSearch
  }: Props = $props();

  let inputValue = $state(value);
  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleInput(e: Event) {
    inputValue = (e.target as HTMLInputElement).value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onSearch(inputValue);
    }, debounceMs);
  }
</script>

<div style="position: relative; display: inline-flex; align-items: center;">
  <span
    style="
      position: absolute;
      left: 12px;
      display: flex;
      align-items: center;
      color: var(--color-foreground-secondary, #9090A8);
      pointer-events: none;
    "
  >
    <Search size={16} strokeWidth={1.5} />
  </span>

  <input
    type="text"
    value={inputValue}
    {placeholder}
    oninput={handleInput}
    style="
      background: var(--color-surface-overlay, #1A1A28);
      border: 1px solid var(--color-border, rgba(255,255,255,0.08));
      border-radius: var(--radius-md, 12px);
      padding: 10px 16px 10px 36px;
      color: var(--color-foreground, #F6F6FF);
      font-size: 0.875rem;
      outline: none;
      min-width: 220px;
      min-height: 44px;
      transition: border-color 0.15s, box-shadow 0.15s;
    "
    onfocus={(e) => {
      e.currentTarget.style.borderColor = 'var(--color-border-hover, rgba(255,255,255,0.14))';
      e.currentTarget.style.boxShadow = '0 0 0 2px #FF00FF';
    }}
    onblur={(e) => {
      e.currentTarget.style.borderColor = 'var(--color-border, rgba(255,255,255,0.08))';
      e.currentTarget.style.boxShadow = 'none';
    }}
  />
</div>
