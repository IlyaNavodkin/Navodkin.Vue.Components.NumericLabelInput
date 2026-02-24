<template>
  <input
    ref="inputRef"
    :value="isFocused ? rawInputValue : displayValue"
    type="text"
    inputmode="decimal"
    class="money-input"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
    @paste="handlePaste"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { MoneyInputProps, MoneyInputEmits } from '../../types/moneyInput'

const props = withDefaults(defineProps<MoneyInputProps>(), {
  currencySymbol: '$',
  decimalPlaces: 2,
  canBeNegative: false,
})

const emit = defineEmits<MoneyInputEmits>()

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) return ''
  return formatNumber(props.value, props.decimalPlaces)
})

const rawInputValue = computed(() => props.inputString)

function formatNumber(num: number, decimals: number): string {
  const parts = num.toFixed(decimals).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${parts.join('.')} ${props.currencySymbol}`
}

function formatNumberOrEmpty(num: number | null, decimals: number): string {
  return num === null ? '' : formatNumber(num, decimals)
}

function parseInputToNumber(input: string): number | null {
  const clean = input.replace(/\s/g, '').replace(props.currencySymbol, '')
  if (!clean) return null
  const regex = props.canBeNegative
    ? /^-?\d+(\.\d{0,99})?$/
    : /^\d+(\.\d{0,99})?$/
  if (!regex.test(clean)) return null
  const num = parseFloat(clean)
  if (isNaN(num)) return null
  return parseFloat(num.toFixed(props.decimalPlaces))
}

function clamp(
  num: number | null,
  _min?: number,
  _max?: number,
  allowNegative?: boolean
): number | null {
  if (num === null) return null
  if (allowNegative === false && num < 0) return 0
  if (props.min !== undefined && num < props.min) return props.min
  if (props.max !== undefined && num > props.max) return props.max
  return num
}

function filterInput(input: string): string {
  let result = ''
  let decimalCount = 0
  let hasDecimal = false
  let hasMinus = false
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (char === '-' && !hasMinus && i === 0 && props.canBeNegative) {
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
  return result
}

function extractLastValidNumber(text: string): string | null {
  const regex = props.canBeNegative ? /-?\d+(\.\d+)?/g : /\d+(\.\d+)?/g
  const matches = text.match(regex)
  if (!matches || matches.length === 0) return null
  const last = matches[matches.length - 1]
  const num = parseFloat(last)
  if (isNaN(num)) return null
  return num.toFixed(props.decimalPlaces)
}

const handleInput = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const newVal = target.value
  const cursor = target.selectionStart || 0
  const filtered = filterInput(newVal)
  if (filtered !== newVal) {
    target.value = filtered
    const diff = newVal.length - filtered.length
    await nextTick()
    target.setSelectionRange(
      Math.max(0, cursor - diff),
      Math.max(0, cursor - diff)
    )
    emit('update:inputString', filtered)
    const num = parseInputToNumber(filtered)
    emit('update:value', clamp(num, props.min, props.max, props.canBeNegative))
    return
  }
  emit('update:inputString', filtered)
  const num = parseInputToNumber(filtered)
  emit('update:value', clamp(num, props.min, props.max, props.canBeNegative))
}

function handleFocus(e: FocusEvent) {
  isFocused.value = true
  emit('focus', e)
}

const handleBlur = async (e: FocusEvent) => {
  isFocused.value = false
  emit('blur', e)
  const input = inputRef.value
  if (input) {
    const num = parseInputToNumber(input.value)
    const clamped = clamp(num, props.min, props.max, props.canBeNegative)
    const formatted = formatNumberOrEmpty(clamped, props.decimalPlaces)
    input.value = formatted
    emit('update:inputString', formatted)
    emit('update:value', clamped)
  }
}

const handlePaste = async (e: ClipboardEvent) => {
  e.preventDefault()
  const pasted = e.clipboardData?.getData('text') || ''
  const extracted = extractLastValidNumber(pasted)
  const input = inputRef.value
  if (input && extracted !== null) {
    input.value = extracted
    emit('update:inputString', extracted)
    const num = parseInputToNumber(extracted)
    emit('update:value', clamp(num, props.min, props.max, props.canBeNegative))
  } else {
    emit('update:value', null)
    emit('update:inputString', '')
  }
  await nextTick()
}

watch(() => props.value, (newVal) => {
  if (!isFocused.value) {
    emit(
      'update:inputString',
      newVal === null ? '' : formatNumber(newVal, props.decimalPlaces)
    )
  }
})

watch(() => props.inputString, () => {})
</script>

<style scoped lang="scss">
.money-input {
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
