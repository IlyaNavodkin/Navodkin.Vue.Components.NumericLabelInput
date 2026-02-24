<template>
  <div class="wrapper">
    <div class="debug">
      <span class="debug-label">inputString:</span> {{ props.inputString === '' ? '""' : props.inputString }}
      <span class="debug-sep">|</span>
      <span class="debug-label">value:</span> {{ props.value }}
    </div>
    <input
      ref="inputRef"
      :value="internalValue"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @paste="handlePaste"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { MoneyInputProps, MoneyInputEmits } from '../../types/moneyInput'

const props = withDefaults(defineProps<MoneyInputProps>(), {
  currencySymbol: '$',
  decimalPlaces: 2,
  canBeNegative: false,
})

const emit = defineEmits<MoneyInputEmits>()

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)
const internalValue = ref('')

function parseInputToNumber(input: string): number | null {
  let clean = input.replace(/\s/g, '')
  if (props.currencySymbol) clean = clean.replace(props.currencySymbol, '')
  if (!clean || clean === '-') return null
  const regexStr = props.canBeNegative
    ? `^-?\\d*(\\.\\d{0,${props.decimalPlaces}})?$`
    : `^\\d*(\\.\\d{0,${props.decimalPlaces}})?$`
  if (!new RegExp(regexStr).test(clean)) return null
  const num = parseFloat(clean)
  return isNaN(num) ? null : parseFloat(num.toFixed(props.decimalPlaces))
}

function clamp(num: number | null): number | null {
  if (num === null) return null
  if (!props.canBeNegative && num < 0) return 0
  if (props.min !== undefined && num < props.min) return props.min
  if (props.max !== undefined && num > props.max) return props.max
  return num
}

function formatNumberOrEmpty(num: number | null): string {
  if (num === null) return ''
  const fixed = props.decimalPlaces > 0 ? num.toFixed(props.decimalPlaces) : Math.trunc(num).toString()
  const [int, dec] = fixed.split('.')
  const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return dec !== undefined ? `${formattedInt}.${dec} ${props.currencySymbol}` : `${formattedInt} ${props.currencySymbol}`
}

function filterInput(input: string): string {
  let result = ''
  let hasDecimal = false
  let hasMinus = false
  let decimalCount = 0
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (char === '-' && props.canBeNegative && i === 0 && !hasMinus) {
      result += char
      hasMinus = true
    } else if (char === '.' && props.decimalPlaces > 0 && !hasDecimal) {
      result += char
      hasDecimal = true
    } else if (/\d/.test(char)) {
      if (hasDecimal) {
        if (decimalCount < props.decimalPlaces) {
          result += char
          decimalCount++
        }
      } else {
        result += char
      }
    }
  }
  return result
}

watch(() => props.value, (newVal) => {
  if (!isFocused.value) {
    internalValue.value = newVal === null ? '' : formatNumberOrEmpty(newVal)
  }
}, { immediate: true })

watch(() => props.inputString, (newVal) => {
  if (!isFocused.value) internalValue.value = newVal ?? ''
})

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  const originalValue = target.value
  const cursor = target.selectionStart ?? 0
  const filtered = filterInput(originalValue)
  if (filtered !== originalValue) {
    target.value = filtered
    const diff = originalValue.length - filtered.length
    nextTick(() => target.setSelectionRange(Math.max(0, cursor - diff), Math.max(0, cursor - diff)))
  }
  internalValue.value = filtered
  emit('update:inputString', filtered)
  const num = parseInputToNumber(filtered)
  emit('update:value', num)
}

function handleFocus(e: FocusEvent) {
  isFocused.value = true
  emit('focus', e)
}

function handleBlur(e: FocusEvent) {
  isFocused.value = false
  const input = inputRef.value
  if (input) {
    const num = parseInputToNumber(internalValue.value)
    const clamped = clamp(num)
    const formatted = formatNumberOrEmpty(clamped)
    internalValue.value = formatted
    input.value = formatted
    emit('update:inputString', formatted)
    emit('update:value', clamped)
  }
  emit('blur', e)
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text') ?? ''
  const filtered = filterInput(text)
  if (filtered && inputRef.value) {
    internalValue.value = filtered
    inputRef.value.value = filtered
    emit('update:inputString', filtered)
    const num = parseInputToNumber(filtered)
    emit('update:value', num)
  }
  nextTick()
}
</script>

<style scoped lang="scss">
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.debug {
  font-size: 0.8rem;
  font-family: ui-monospace, monospace;
  color: #90909a;
  .debug-label {
    color: #6d6d75;
  }
  .debug-sep {
    margin: 0 0.5rem;
    color: #4d4d52;
  }
}

input {
  padding: 8px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: #2e90fa;
    box-shadow: 0 0 0 4px rgba(46, 144, 250, 0.1);
  }
}
</style>
