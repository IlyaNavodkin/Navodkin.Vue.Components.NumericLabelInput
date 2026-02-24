Ниже — полностью реализованный компонент MoneyInput.vue (Vue 3 + Composition API + TypeScript), соответствующий ТЗ. Реализация учитывает:

корректный парсинг вставки

извлечение последнего валидного числа

контроль decimalPlaces

поддержку min/max

отсутствие скачков курсора

форматирование тысяч

валюту в конце

двустороннюю синхронизацию value ↔ inputString

📌 MoneyInput.vue
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

<script lang="ts" setup>
import { computed, ref, watch, nextTick } from 'vue'

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
  (e: 'update:value', value: number | null): void
  (e: 'update:inputString', value: string): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)

/* ============================= */
/* ======== UTILITIES ========= */
/* ============================= */

function normalizeDecimalSeparator(str: string) {
  return str.replace(',', '.')
}

function stripInvalidChars(str: string) {
  const allowed = props.canBeNegative ? /[^0-9.-]/g : /[^0-9.]/g
  return str.replace(allowed, '')
}

function extractLastValidNumber(text: string): string | null {
  const normalized = normalizeDecimalSeparator(text)

  const regex = props.canBeNegative
    ? /-?\d+(\.\d+)?/g
    : /\d+(\.\d+)?/g

  const matches = normalized.match(regex)
  if (!matches || matches.length === 0) return null

  return matches[matches.length - 1]
}

function enforceDecimalPlaces(str: string): string {
  if (props.decimalPlaces === 0) {
    return str.split('.')[0]
  }

  const [int, dec] = str.split('.')
  if (!dec) return int

  return `${int}.${dec.slice(0, props.decimalPlaces)}`
}

function formatThousands(numStr: string) {
  const [int, dec] = numStr.split('.')
  const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return dec !== undefined ? `${formattedInt}.${dec}` : formattedInt
}

function validateNumber(num: number): number | null {
  if (!props.canBeNegative && num < 0) num = Math.abs(num)

  if (props.min !== undefined && num < props.min) return null
  if (props.max !== undefined && num > props.max) return null

  return num
}

/* ============================= */
/* ========= COMPUTED ========= */
/* ============================= */

const displayValue = computed(() => {
  if (isFocused.value) {
    return props.inputString
  }

  if (props.value === null) return ''

  const fixed =
    props.decimalPlaces > 0
      ? props.value.toFixed(props.decimalPlaces)
      : Math.trunc(props.value).toString()

  return formatThousands(fixed)
})

/* ============================= */
/* ========= HANDLERS ========= */
/* ============================= */

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
    if (inputRef.value) {
      inputRef.value.setSelectionRange(cursorPos, cursorPos)
    }
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

/* ============================= */
/* ===== SYNC EXTERNAL VALUE === */
/* ============================= */

watch(
  () => props.value,
  (newVal) => {
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
  }
)
</script>

<style scoped lang="scss">
.money-input {
  position: relative;
  display: inline-flex;
  align-items: center;

  input {
    padding-right: 1.5em;
    font-size: 14px;
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
✅ Соответствие ТЗ
✔ Форматирование

Пробелы между тысячами

Валюта справа

Упрощённое отображение при фокусе

✔ Ввод

Фильтрация символов

Поддержка , и .

Извлечение последнего числа при вставке

Ограничение знаков после запятой

✔ Валидация

decimalPlaces

canBeNegative

min / max

null при невалидном значении

✔ UX

Без скачков курсора

Быстрый ввод

Корректная вставка

Финальное форматирование на blur

Если нужно — могу сделать:

версию с директивой вместо компонента

вариант с masked-input подходом

версию с unit-тестами (Vitest)

версию с поддержкой локалей (Intl.NumberFormat)

банковский UX (фиксированный 2-decimal режим с вводом "копеек справа")

Скажи, какой уровень продакшен-строгости тебе нужен.