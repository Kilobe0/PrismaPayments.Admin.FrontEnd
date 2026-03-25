<script lang="ts">
  import { Check } from 'lucide-svelte';

  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    options: Option[];
    value?: string;
    placeholder?: string;
    onChange: (value: string) => void;
  }

  let {
    options,
    value = '',
    placeholder = 'Filtrar...',
    onChange
  }: Props = $props();

  let isOpen = $state(false);
  let selectedOption = $derived(options.find(o => o.value === value));

  function selectOption(option: Option) {
    onChange(option.value);
    isOpen = false;
  }

  function clearSelection() {
    onChange('');
    isOpen = false;
  }
</script>

<div style="position: relative; display: inline-block;">
  <!-- Trigger -->
  <button
    type="button"
    onclick={() => (isOpen = !isOpen)}
    style="
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--color-surface-overlay, #1A1A28);
      border: 1px solid var(--color-border, rgba(255,255,255,0.08));
      border-radius: var(--radius-md, 12px);
      padding: 10px 16px;
      color: {value ? 'var(--color-foreground, #F6F6FF)' : 'var(--color-foreground-secondary, #9090A8)'};
      font-size: 0.875rem;
      cursor: pointer;
      min-height: 44px;
      min-width: 160px;
      text-align: left;
      transition: border-color 0.15s;
    "
  >
    {selectedOption?.label ?? placeholder}
    <span style="margin-left: auto; color: var(--color-foreground-secondary, #9090A8);">▾</span>
  </button>

  <!-- Dropdown -->
  {#if isOpen}
    <div
      style="
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        min-width: 100%;
        background: var(--color-surface-overlay, #1A1A28);
        border: 1px solid var(--color-border, rgba(255,255,255,0.08));
        border-radius: var(--radius-md, 12px);
        box-shadow: var(--shadow-lg, 0 16px 48px rgba(0,0,0,0.60));
        z-index: 50;
        overflow: hidden;
      "
    >
      <!-- Clear option -->
      {#if value}
        <button
          type="button"
          onclick={clearSelection}
          style="
            display: flex;
            align-items: center;
            width: 100%;
            padding: 10px 16px;
            font-size: 0.875rem;
            color: var(--color-foreground-secondary, #9090A8);
            background: transparent;
            border: none;
            cursor: pointer;
            text-align: left;
            border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
            transition: background 0.15s;
            min-height: 44px;
          "
          onmouseenter={(e) => (e.currentTarget.style.background = 'var(--color-surface-elevated, #141420)')}
          onmouseleave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Todos
        </button>
      {/if}

      {#each options as option}
        <button
          type="button"
          onclick={() => selectOption(option)}
          style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 10px 16px;
            font-size: 0.875rem;
            color: var(--color-foreground, #F6F6FF);
            background: transparent;
            border: none;
            cursor: pointer;
            text-align: left;
            transition: background 0.15s;
            min-height: 44px;
          "
          onmouseenter={(e) => (e.currentTarget.style.background = 'var(--color-surface-elevated, #141420)')}
          onmouseleave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {option.label}
          {#if option.value === value}
            <Check size={16} strokeWidth={1.5} style="color: var(--color-info, #01FAFB);" />
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Close on outside click -->
{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    style="position: fixed; inset: 0; z-index: 49;"
    onclick={() => (isOpen = false)}
  ></div>
{/if}
