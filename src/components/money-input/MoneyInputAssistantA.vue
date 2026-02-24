<template>
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

watch(() => props.value, (newVal) => {
  if (!isFocused.value) {
    internalValue.value = newVal === null ? '' : formatNumber(newVal, props.decimalPlaces)
  }
}, { immediate: true })

watch(() => props.inputString, (newVal) => {
  if (!isFocused.value) internalValue.value = newVal ?? ''
})

function formatNumber(num: number, decimals: number): string {
  const parts = num.toFixed(decimals).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${parts.join('.')} ${props.currencySymbol}`
}

function formatNumberOrEmpty(num: number | null, decimals: number): string {
  return num === null ? '' : formatNumber(num, decimals)
}

function parseInputToNumber(input: string): number | null {
  const clean = input.replace(/\s/g, '')
  const withoutSymbol = props.currencySymbol ? clean.replace(props.currencySymbol, '') : clean
  const trimmed = withoutSymbol.trim()
  if (!trimmed || trimmed === '-') return null
  const regex = props.canBeNegative ? /^-?\d+(\.\d{0,99})?$/ : /^\d+(\.\d{0,99})?$/
  if (!regex.test(trimmed)) return null
  const num = parseFloat(trimmed)
  return isNaN(num) ? null : parseFloat(num.toFixed(props.decimalPlaces))
}

function clamp(num: number | null): number | null {
  if (num === null) return null
  if (!props.canBeNegative && num < 0) return 0
  if (props.min !== undefined && num < props.min) return props.min
  if (props.max !== undefined && num > props.max) return props.max
  return num
}

function filterInput(input: string): string {
  let result = ''
  let hasDecimal = false
  let decimalCount = 0
  let hasMinus = false
  for (const char of input) {
    if (char === '-' && props.canBeNegative && !hasMinus && result === '') {
      result += '-'
      hasMinus = true
      continue
    }
    if (char === '.' && !hasDecimal) {
      result += '.'
      hasDecimal = true
      continue
    }
    if (/\d/.test(char)) {
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
  return result.replace(/^0+(?=\d)/, '') || (result.startsWith('.') ? '0' + result : result)
}

function extractLastValidNumber(text: string): string | null {
  const regex = props.canBeNegative ? /-?\d*\.?\d+/g : /\d*\.?\d+/g
  const matches = text.match(regex)
  if (!matches || matches.length === 0) return null
  const longest = matches.reduce((a, b) => a.length >= b.length ? a : b)
  return longest
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  const filtered = filterInput(target.value)
  if (filtered !== target.value) {
    target.value = filtered
    const cursor = target.selectionStart ?? 0
    const diff = target.value.length - filtered.length
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
    const formatted = formatNumberOrEmpty(clamped, props.decimalPlaces)
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
  const extracted = extractLastValidNumber(text)
  if (extracted !== null && inputRef.value) {
    const filtered = filterInput(extracted)
    internalValue.value = filtered
    inputRef.value.value = filtered
    emit('update:inputString', filtered)
    const num = parseInputToNumber(filtered)
    emit('update:value', clamp(num))
  }
  nextTick()
}
</script>

<style scoped lang="scss">
input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: #007bff;
  }
}
</style>
