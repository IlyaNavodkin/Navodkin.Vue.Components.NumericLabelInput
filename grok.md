<template>
  <input
    ref="inputRef"
    type="text"
    @input="handleInput"
    @paste="handlePaste"
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'

interface Props {
  value: number | null
  inputString: string
  currencySymbol: string
  decimalPlaces: number
  canBeNegative: boolean
  max?: number
  min?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:value': [number | null]
  'update:inputString': [string]
  blur: [FocusEvent]
  focus: [FocusEvent]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const localInput = ref(props.inputString)
const isFocused = ref(false)

const displayedValue = computed(() => {
  if (isFocused.value) {
    return localInput.value
  } else {
    const num = parseAndValidate(localInput.value)
    if (num === null) return ''
    return formatWithThousands(num)
  }
})

watch(displayedValue, (val) => {
  if (inputRef.value) {
    inputRef.value.value = val
  }
})

onMounted(() => {
  if (inputRef.value) {
    inputRef.value.value = displayedValue.value
  }
})

watch(() => props.value, (newVal) => {
  const currentNum = parseAndValidate(localInput.value)
  if (newVal !== currentNum) {
    if (newVal === null) {
      localInput.value = ''
    } else {
      localInput.value = newVal.toFixed(props.decimalPlaces)
    }
    emit('update:inputString', localInput.value)
  }
})

watch(() => props.inputString, (newVal) => {
  if (newVal !== localInput.value) {
    localInput.value = newVal
    const num = parseAndValidate(newVal)
    emit('update:value', num)
  }
})

function handleFocus(e: FocusEvent) {
  isFocused.value = true
  emit('focus', e)
  nextTick(() => {
    inputRef.value?.select()
  })
}

function handleBlur(e: FocusEvent) {
  const num = parseAndValidate(localInput.value)
  if (num === null) {
    localInput.value = ''
  } else {
    localInput.value = num.toFixed(props.decimalPlaces)
  }
  emit('update:inputString', localInput.value)
  emit('update:value', num)
  isFocused.value = false
  emit('blur', e)
}

function handleInput(e: InputEvent) {
  const target = e.target as HTMLInputElement
  const cursor = target.selectionStart || 0
  const newValue = target.value
  const filtered = filterInput(newValue)
  target.value = filtered
  localInput.value = filtered
  emit('update:inputString', filtered)
  const num = parseAndValidate(filtered)
  emit('update:value', num)
  const removed = newValue.length - filtered.length
  target.selectionStart = cursor - removed
  target.selectionEnd = cursor - removed
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const pasteText = e.clipboardData?.getData('Text') || ''
  const target = inputRef.value!
  const cursor = target.selectionStart || 0
  const selectionEnd = target.selectionEnd || cursor
  const left = localInput.value.substring(0, cursor)
  const right = localInput.value.substring(selectionEnd)
  const extracted = extractLastValidNumber(pasteText)
  const newRaw = left + extracted + right
  const filtered = filterInput(newRaw)
  target.value = filtered
  localInput.value = filtered
  emit('update:inputString', filtered)
  const num = parseAndValidate(filtered)
  emit('update:value', num)
  target.selectionStart = cursor + extracted.length
  target.selectionEnd = cursor + extracted.length
}

function filterInput(input: string) {
  let result = ''
  let hasNegative = false
  let hasDecimal = false
  let decimalCount = 0
  for (const char of input) {
    if (char >= '0' && char <= '9') {
      if (hasDecimal) {
        if (decimalCount < props.decimalPlaces) {
          result += char
          decimalCount++
        }
      } else {
        result += char
      }
    } else if (char === '-' && !hasNegative && result === '' && props.canBeNegative) {
      result += char
      hasNegative = true
    } else if ((char === '.' || char === ',') && !hasDecimal && props.decimalPlaces > 0) {
      result += '.'
      hasDecimal = true
    }
    // ignore others, including spaces
  }
  return result
}

function extractLastValidNumber(str: string) {
  const pattern = /(-?\d+([.,]\d*)?)/g
  const matches = str.match(pattern) || []
  if (matches.length === 0) return ''
  let last = matches[matches.length - 1]
  if (!props.canBeNegative && last.startsWith('-')) {
    last = last.slice(1)
  }
  last = last.replace(',', '.')
  const parts = last.split('.')
  if (parts.length > 1) {
    parts[1] = parts[1].substring(0, props.decimalPlaces)
    last = parts.join('.')
    if (parts[1] === '') last = last.slice(0, -1)
  }
  return last
}

function parseAndValidate(raw: string) {
  let cleaned = raw.replace(/\s/g, '').replace(',', '.')
  if (cleaned === '') return null
  let num = parseFloat(cleaned)
  if (isNaN(num)) return null
  const pow = Math.pow(10, props.decimalPlaces)
  num = Math.trunc(num * pow) / pow
  if (!props.canBeNegative && num < 0) {
    num = Math.abs(num)
  }
  if (props.min !== undefined && num < props.min) return null
  if (props.max !== undefined && num > props.max) return null
  return num
}

function formatWithThousands(num: number) {
  let str = num.toFixed(props.decimalPlaces)
  const parts = str.split('.')
  let integer = parts[0]
  const sign = integer.startsWith('-') ? '-' : ''
  integer = integer.replace('-', '')
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  let formatted = sign + formattedInteger
  if (props.decimalPlaces > 0 && parts[1]) {
    formatted += '.' + parts[1]
  }
  return formatted + ' ' + props.currencySymbol
}
</script>

<style scoped lang="scss">
input {
  text-align: right;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  width: 200px; /* adjustable */
}
</style>