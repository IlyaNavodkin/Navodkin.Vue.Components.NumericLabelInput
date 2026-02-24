<template>
  <div class="money-input">
    <input
      ref="inputRef"
      :value="displayValue"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @paste="onPaste"
      inputmode="decimal"
      autocomplete="off"
    />
    <span v-if="!isFocused && props.currencySymbol" class="currency">
      {{ props.currencySymbol }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { MoneyInputProps, MoneyInputEmits } from '../../types/moneyInput'

const props = withDefaults(defineProps<MoneyInputProps>(), {
  currencySymbol: '$',
  decimalPlaces: 2,
  canBeNegative: false,
})

const emit = defineEmits<MoneyInputEmits>()

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)

function normalizeDecimalSeparator(str: string) {
  return str.replace(',', '.')
}

function stripInvalidChars(str: string) {
  const allowed = props.canBeNegative ? /[^0-9.-]/g : /[^0-9.]/g
  return str.replace(allowed, '')
}

function extractLastValidNumber(text: string): string | null {
  const normalized = normalizeDecimalSeparator(text)
  const regex = props.canBeNegative ? /-?\d+(\.\d+)?/g : /\d+(\.\d+)?/g
  const matches = normalized.match(regex)
  if (!matches || matches.length === 0) return null
  return matches[matches.length - 1]
}

function enforceDecimalPlaces(str: string): string {
  if (props.decimalPlaces === 0) return str.split('.')[0]
  const [int, dec] = str.split('.')
  if (!dec) return int ?? ''
  return `${int}.${dec.slice(0, props.decimalPlaces)}`
}

function formatThousands(numStr: string) {
  const [int, dec] = numStr.split('.')
  const formattedInt = (int ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return dec !== undefined ? `${formattedInt}.${dec}` : formattedInt
}

function validateNumber(num: number): number | null {
  if (!props.canBeNegative && num < 0) num = Math.abs(num)
  if (props.min !== undefined && num < props.min) return null
  if (props.max !== undefined && num > props.max) return null
  return num
}

const displayValue = computed(() => {
  if (isFocused.value) return props.inputString
  if (props.value === null) return ''
  const fixed =
    props.decimalPlaces > 0
      ? props.value.toFixed(props.decimalPlaces)
      : Math.trunc(props.value).toString()
  return formatThousands(fixed)
})

function updateFromString(raw: string) {
  const cleaned = stripInvalidChars(normalizeDecimalSeparator(raw))
  const enforced = enforceDecimalPlaces(cleaned)
  emit('update:inputString', enforced)
  if (!enforced || enforced === '-' || enforced === '.') {
    emit('update:value', null)
    return
  }
  const parsed = Number(enforced)
  if (isNaN(parsed)) {
    emit('update:value', null)
    return
  }
  const validated = validateNumber(parsed)
  emit('update:value', validated)
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  const cursorPos = el.selectionStart ?? 0
  const raw = el.value
  updateFromString(raw)
  nextTick(() => {
    if (inputRef.value) inputRef.value.setSelectionRange(cursorPos, cursorPos)
  })
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text') ?? ''
  const extracted = extractLastValidNumber(text)
  if (!extracted) {
    emit('update:value', null)
    emit('update:inputString', '')
    return
  }
  const enforced = enforceDecimalPlaces(extracted)
  updateFromString(enforced)
}

function onFocus(e: FocusEvent) {
  isFocused.value = true
  emit('focus', e)
}

function onBlur(e: FocusEvent) {
  isFocused.value = false
  if (props.value !== null) {
    const fixed =
      props.decimalPlaces > 0
        ? props.value.toFixed(props.decimalPlaces)
        : Math.trunc(props.value).toString()
    emit('update:inputString', fixed)
  }
  emit('blur', e)
}

watch(() => props.value, (newVal) => {
  if (isFocused.value) return
  if (newVal === null) {
    emit('update:inputString', '')
    return
  }
  const fixed =
    props.decimalPlaces > 0
      ? newVal.toFixed(props.decimalPlaces)
      : Math.trunc(newVal).toString()
  emit('update:inputString', fixed)
})
</script>

<style scoped lang="scss">
.money-input {
  position: relative;
  display: inline-flex;
  align-items: center;

  input {
    padding-right: 1.5em;
    font-size: 14px;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .currency {
    position: absolute;
    right: 0.5em;
    pointer-events: none;
    color: #888;
    font-size: 14px;
  }
}
</style>
