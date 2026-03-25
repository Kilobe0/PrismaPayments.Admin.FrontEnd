<script lang="ts">
  import { Calendar } from 'lucide-svelte';

  interface DateRange {
    from: string;
    to: string;
  }

  interface Props {
    value?: DateRange;
    onChange: (range: DateRange) => void;
  }

  let {
    value = { from: '', to: '' },
    onChange
  }: Props = $props();

  let from = $state(value.from);
  let to = $state(value.to);

  function handleFromChange(e: Event) {
    from = (e.target as HTMLInputElement).value;
    onChange({ from, to });
  }

  function handleToChange(e: Event) {
    to = (e.target as HTMLInputElement).value;
    onChange({ from, to });
  }

  const inputStyle = `
    background: var(--color-surface-overlay, #1A1A28);
    border: 1px solid var(--color-border, rgba(255,255,255,0.08));
    border-radius: var(--radius-md, 12px);
    padding: 10px 16px 10px 36px;
    color: var(--color-foreground, #F6F6FF);
    font-size: 0.875rem;
    outline: none;
    min-height: 44px;
    transition: border-color 0.15s, box-shadow 0.15s;
  `;
</script>

<div style="display: flex; align-items: center; gap: 8px;">
  <!-- From -->
  <div style="position: relative; display: inline-flex; align-items: center;">
    <span
      style="
        position: absolute; left: 10px;
        display: flex; align-items: center;
        color: var(--color-foreground-secondary, #9090A8);
        pointer-events: none;
      "
    >
      <Calendar size={14} strokeWidth={1.5} />
    </span>
    <input
      type="date"
      value={from}
      onchange={handleFromChange}
      style={inputStyle}
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

  <span style="font-size: 0.875rem; color: var(--color-foreground-secondary, #9090A8);">até</span>

  <!-- To -->
  <div style="position: relative; display: inline-flex; align-items: center;">
    <span
      style="
        position: absolute; left: 10px;
        display: flex; align-items: center;
        color: var(--color-foreground-secondary, #9090A8);
        pointer-events: none;
      "
    >
      <Calendar size={14} strokeWidth={1.5} />
    </span>
    <input
      type="date"
      value={to}
      onchange={handleToChange}
      style={inputStyle}
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
</div>
