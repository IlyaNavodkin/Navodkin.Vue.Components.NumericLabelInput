<template>
  <input
    ref="inputRef"
    :value="displayValue"
    type="text"
    :inputmode="props.decimalPlaces === 0 ? 'numeric' : 'decimal'"
    @input="onInput"
    @blur="onBlur"
    @focus="onFocus"
    @keydown="onKeyDown"
    @paste="onPaste"
    class="money-input"
    :class="{ 'money-input--focused': isFocused }"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { MoneyInputProps, MoneyInputEmits } from "../../types/moneyInput";

const props = withDefaults(defineProps<MoneyInputProps>(), {
  currencySymbol: "$",
  decimalPlaces: 2,
  canBeNegative: false,
  max: undefined,
  min: undefined,
});

const emit = defineEmits<MoneyInputEmits>();

const isFocused = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const cursorPosition = ref<number | null>(null);

const formatNumber = (num: number | null, symbol: string): string => {
  if (num === null || isNaN(num)) return "";
  const parts = num.toFixed(props.decimalPlaces).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const formatted =
    props.decimalPlaces > 0 ? `${integerPart}.${parts[1]}` : integerPart;
  return `${formatted} ${symbol}`;
};

const displayValue = computed(() => {
  if (isFocused.value) return props.inputString;
  return formatNumber(props.value, props.currencySymbol);
});

const parseInputString = (str: string): number | null => {
  let cleaned = str.replace(/[^\d.,-]/g, "");
  cleaned = cleaned.replace(/,/g, ".");
  const minusCount = (cleaned.match(/-/g) || []).length;
  const hasMinus = minusCount > 0;
  cleaned = cleaned.replace(/-/g, "");
  if (hasMinus && props.canBeNegative) cleaned = "-" + cleaned;
  const numberRegex = props.canBeNegative
    ? /-?\d+(?:\.\d*)?|\.\d+/
    : /\d+(?:\.\d*)?|\.\d+/;
  const matches = cleaned.match(numberRegex);
  if (!matches) return null;
  const lastMatch = matches[matches.length - 1];
  let num = parseFloat(lastMatch);
  if (isNaN(num)) return null;
  if (props.decimalPlaces === 0) {
    num = Math.round(num);
  } else {
    const factor = Math.pow(10, props.decimalPlaces);
    num = Math.round(num * factor) / factor;
  }
  if (!props.canBeNegative && num < 0) num = Math.abs(num);
  if (props.min !== undefined && num < props.min) num = props.min;
  if (props.max !== undefined && num > props.max) num = props.max;
  return num;
};

function filterForDecimalPlaces(str: string): string {
  let s = str.replace(/[^\d.,-]/g, "");
  if (props.decimalPlaces === 0) {
    s = s.replace(/[.,]/g, "");
    return s;
  }
  // decimalPlaces > 0: не больше n знаков после запятой
  const hasMinus = s.startsWith("-") && props.canBeNegative;
  if (hasMinus) s = s.slice(1);
  s = s.replace(",", ".");
  const idx = s.indexOf(".");
  if (idx !== -1) {
    const before = s.slice(0, idx).replace(/\D/g, "");
    const after = s
      .slice(idx + 1)
      .replace(/\D/g, "")
      .slice(0, props.decimalPlaces);
    s = before + "." + after;
  } else {
    s = s.replace(/[.,]/g, "");
  }
  return (hasMinus ? "-" : "") + s;
}

function onInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const rawValue = input.value;
  cursorPosition.value = input.selectionStart;
  const filtered = filterForDecimalPlaces(rawValue);
  if (filtered !== rawValue) {
    input.value = filtered;
  }
  const parsedNumber = parseInputString(filtered);
  let newInputString = filtered;
  if (parsedNumber !== null) {
    newInputString = parsedNumber.toString();
  }
  emit("update:inputString", newInputString);
  emit("update:value", parsedNumber);
  nextTick(() => {
    if (inputRef.value && cursorPosition.value !== null) {
      const newPosition = Math.min(
        cursorPosition.value,
        inputRef.value.value.length
      );
      inputRef.value.setSelectionRange(newPosition, newPosition);
    }
  });
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault();
  const text = e.clipboardData?.getData("text") ?? "";
  const filtered = filterForDecimalPlaces(text);
  if (inputRef.value) {
    inputRef.value.value = filtered;
    const parsed = parseInputString(filtered);
    emit("update:inputString", filtered);
    emit("update:value", parsed);
  }
}

function onBlur(e: FocusEvent) {
  isFocused.value = false;
  if (props.value !== null) {
    emit("update:inputString", props.value.toFixed(props.decimalPlaces));
  } else {
    emit("update:inputString", "");
  }
  emit("blur", e);
}

function onFocus(e: FocusEvent) {
  isFocused.value = true;
  emit("focus", e);
}

function onKeyDown(e: KeyboardEvent) {
  const input = e.target as HTMLInputElement;
  if (e.key === "." || e.key === ",") {
    if (props.decimalPlaces === 0) {
      e.preventDefault();
      return;
    }
    if (input.value.includes(".") || input.value.includes(",")) {
      e.preventDefault();
    }
    return;
  }
  if (e.key === "-" && !props.canBeNegative) {
    e.preventDefault();
    return;
  }
  // не даём вводить цифру, если уже набрано decimalPlaces знаков после запятой (если не заменяем выделение)
  if (e.key >= "0" && e.key <= "9" && props.decimalPlaces > 0) {
    const dotIdx = input.value.indexOf(".");
    if (dotIdx !== -1) {
      const afterDot = input.value.slice(dotIdx + 1).replace(/\D/g, "");
      const cursor = input.selectionStart ?? 0;
      const selEnd = input.selectionEnd ?? cursor;
      const isReplacing = cursor !== selEnd;
      if (
        !isReplacing &&
        cursor > dotIdx &&
        afterDot.length >= props.decimalPlaces
      ) {
        e.preventDefault();
      }
    }
  }
}

watch(
  () => props.value,
  (newValue) => {
    if (!isFocused.value) {
      if (newValue !== null) {
        emit("update:inputString", newValue.toFixed(props.decimalPlaces));
      } else {
        emit("update:inputString", "");
      }
    }
  }
);

watch(
  () => props.inputString,
  (newString) => {
    if (isFocused.value) {
      const parsed = parseInputString(newString);
      emit("update:value", parsed);
    }
  }
);
</script>

<style scoped lang="scss">
.money-input {
  width: 100%;
  max-width: 280px;
  padding: 8px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.5;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;

  &:hover {
    border-color: #667085;
  }

  &:focus {
    border-color: #2e90fa;
    box-shadow: 0 0 0 4px rgba(46, 144, 250, 0.1);
  }
}
</style>
