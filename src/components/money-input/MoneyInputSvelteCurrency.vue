<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { IntlConfig } from './utils/getLocaleConfig';
import type { CleanValueOptions } from './utils/cleanValue';
import type { FormatValueOptions } from './utils/formatValue';
import type { CurrencyInputValues } from './types';
import {
  isNumber,
  cleanValue,
  fixedDecimalValue,
  formatValue,
  getLocaleConfig,
  padTrimValue,
  getSuffix,
  repositionCursor
} from './utils/index';

export interface MoneyInputSvelteCurrencyProps {
  value?: string;
  intlConfig?: IntlConfig;
  prefix?: string;
  suffix?: string;
  decimalSeparator?: string;
  groupSeparator?: string;
  allowDecimals?: boolean;
  decimalsLimit?: number;
  decimalScale?: number;
  fixedDecimalLength?: number;
  allowNegativeValue?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  step?: number;
  disableGroupSeparators?: boolean;
  disableAbbreviations?: boolean;
  formatValueOnBlur?: boolean;
  transformRawValue?: (rawValue: string) => string;
  // HTML input attributes
  class?: any;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  autocomplete?: string;
  autofocus?: boolean;
}

const props = withDefaults(defineProps<MoneyInputSvelteCurrencyProps>(), {
  value: '',
  allowDecimals: true,
  allowNegativeValue: true,
  disableGroupSeparators: false,
  disableAbbreviations: false,
  formatValueOnBlur: true
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:value': [values: CurrencyInputValues];
  'inputvalue': [values: CurrencyInputValues];
  'changevalue': [values: CurrencyInputValues];
  'blur': [event: FocusEvent];
  'focus': [event: FocusEvent];
  'input': [event: Event];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

// Validate separators
watch(
  () => [props.decimalSeparator, props.groupSeparator],
  () => {
    if (props.decimalSeparator && isNumber(props.decimalSeparator)) {
      throw new Error('decimalSeparator cannot be a number');
    }
    if (props.groupSeparator && isNumber(props.groupSeparator)) {
      throw new Error('groupSeparator cannot be a number');
    }
  },
  { immediate: true }
);

// Get locale config
const localeConfig = computed(() => getLocaleConfig(props.intlConfig));
const decimalSeparator = computed(() => props.decimalSeparator || localeConfig.value.decimalSeparator || '');
const groupSeparator = computed(() => props.groupSeparator || localeConfig.value.groupSeparator || '');
const prefix = computed(() => props.prefix ?? localeConfig.value.prefix);
const suffix = computed(() => props.suffix ?? '');

// Validate separator conflict
watch(
  () => [decimalSeparator.value, groupSeparator.value, props.disableGroupSeparators],
  () => {
    if (
      decimalSeparator.value &&
      groupSeparator.value &&
      decimalSeparator.value === groupSeparator.value &&
      props.disableGroupSeparators === false
    ) {
      throw new Error('decimalSeparator cannot be the same as groupSeparator');
    }
  },
  { immediate: true }
);

const formatValueOptions = computed<Partial<FormatValueOptions>>(() => ({
  decimalSeparator: decimalSeparator.value,
  groupSeparator: groupSeparator.value,
  disableGroupSeparators: props.disableGroupSeparators,
  intlConfig: props.intlConfig,
  prefix: prefix.value,
  suffix: suffix.value
}));

const cleanValueOptions = computed<Partial<CleanValueOptions>>(() => ({
  decimalSeparator: decimalSeparator.value,
  groupSeparator: groupSeparator.value,
  allowDecimals: props.allowDecimals,
  decimalsLimit: props.decimalsLimit ?? props.fixedDecimalLength ?? 2,
  allowNegativeValue: props.allowNegativeValue,
  disableAbbreviations: props.disableAbbreviations,
  prefix: prefix.value,
  transformRawValue: props.transformRawValue
}));

const stateValue = ref('');
const dirty = ref(false);
const cursor = ref(0);
const changeCount = ref(0);
const lastKeyStroke = ref<string | null>(null);

// Sync external value to internal state
watch(
  () => props.value,
  (newVal) => {
    if (stateValue.value === '-' || (decimalSeparator.value && stateValue.value === decimalSeparator.value)) {
      return;
    }
    if (newVal !== undefined && newVal !== null && newVal !== '') {
      const formatted = formatValue({
        ...formatValueOptions.value,
        decimalScale: dirty.value ? undefined : props.decimalScale,
        value: String(newVal)
      });
      if (!dirty.value) {
        stateValue.value = formatted;
      }
    } else if (!dirty.value) {
      stateValue.value = '';
    }
  },
  { immediate: true }
);

// Restore cursor position when dirty
watch(
  () => [dirty.value, inputRef.value],
  () => {
    if (dirty.value && stateValue.value !== '-' && inputRef.value && document.activeElement === inputRef.value) {
      inputRef.value.setSelectionRange(cursor.value, cursor.value);
    }
  }
);

function processChange(inputValue: string, selectionStart?: number | null): void {
  dirty.value = true;

  const { modifiedValue, cursorPosition } = repositionCursor({
    selectionStart,
    value: inputValue,
    lastKeyStroke: lastKeyStroke.value,
    stateValue: stateValue.value,
    groupSeparator: groupSeparator.value
  });

  const stringValue = cleanValue({ value: modifiedValue, ...cleanValueOptions.value } as CleanValueOptions);

  if (props.maxLength && stringValue.replace(/-/g, '').length > props.maxLength) {
    if (inputRef.value) {
      inputRef.value.value = stateValue.value;
      const cursorPos = Math.min(selectionStart ?? 0, stateValue.value.length);
      inputRef.value.setSelectionRange(cursorPos, cursorPos);
    }
    return;
  }

  if (stringValue === '' || stringValue === '-' || stringValue === decimalSeparator.value) {
    emit('update:modelValue', '');
    stateValue.value = stringValue;
    cursor.value = 1;

    if (inputRef.value) {
      inputRef.value.value = stringValue;
      inputRef.value.setSelectionRange(cursor.value, cursor.value);
    }

    const values: CurrencyInputValues = { float: null, formatted: '', value: '' };
    emit('inputvalue', values);
    emit('update:value', values);
    return;
  }

  const stringValueWithoutSeparator = decimalSeparator.value
    ? stringValue.replace(decimalSeparator.value, '.')
    : stringValue;

  const numberValue = parseFloat(stringValueWithoutSeparator);

  const formattedValue = formatValue({
    value: stringValue,
    ...formatValueOptions.value
  });

  let newCursor = cursorPosition ?? formattedValue.length;
  if (cursorPosition != null) {
    newCursor = cursorPosition + (formattedValue.length - inputValue.length);
    newCursor = newCursor <= 0 ? (prefix.value ? prefix.value.length : 0) : newCursor;
  }

  cursor.value = newCursor;
  changeCount.value = changeCount.value + 1;
  stateValue.value = formattedValue;

  if (inputRef.value) {
    inputRef.value.value = formattedValue;
    inputRef.value.setSelectionRange(cursor.value, cursor.value);
  }

  const values: CurrencyInputValues = {
    float: numberValue,
    formatted: formattedValue,
    value: stringValue
  };
  emit('inputvalue', values);
  emit('update:value', values);
}

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  const { value: inputValue, selectionStart } = target;

  emit('input', event);
  processChange(inputValue, selectionStart);
}

function handleBlur(event: FocusEvent): void {
  const target = event.target as HTMLInputElement;
  const { value: inputValue } = target;

  emit('blur', event);

  const valueOnly = cleanValue({ value: inputValue, ...cleanValueOptions.value } as CleanValueOptions);

  if (valueOnly === '-' || valueOnly === decimalSeparator.value || !valueOnly) {
    stateValue.value = '';
    emit('update:modelValue', '');
    dirty.value = false;
    return;
  }

  const fixedDecimals = fixedDecimalValue(valueOnly, decimalSeparator.value, props.fixedDecimalLength);

  let newValue = padTrimValue(
    fixedDecimals,
    decimalSeparator.value,
    props.decimalScale !== undefined ? props.decimalScale : props.fixedDecimalLength
  );

  const stringValueWithoutSeparator = decimalSeparator.value
    ? newValue.replace(decimalSeparator.value, '.')
    : newValue;

  const numberValue = parseFloat(stringValueWithoutSeparator);

  const formattedValue = formatValue({
    ...formatValueOptions.value,
    value: newValue
  });

  if (props.formatValueOnBlur) {
    stateValue.value = formattedValue;
    emit('update:modelValue', newValue);

    const values: CurrencyInputValues = {
      float: numberValue,
      formatted: formattedValue,
      value: newValue
    };
    emit('changevalue', values);
  }

  dirty.value = false;
}

function handleFocus(event: FocusEvent): void {
  emit('focus', event);
}

function handleKeyDown(event: KeyboardEvent): void {
  const { key } = event;

  lastKeyStroke.value = key;

  if (props.step && (key === 'ArrowUp' || key === 'ArrowDown')) {
    event.preventDefault();
    cursor.value = stateValue.value.length;

    const stringValueWithoutSeparator =
      decimalSeparator.value && props.value ? props.value.replace(decimalSeparator.value, '.') : props.value;

    const currentValue =
      parseFloat(
        stringValueWithoutSeparator != null && stringValueWithoutSeparator !== ''
          ? stringValueWithoutSeparator
          : cleanValue({ value: stateValue.value, ...cleanValueOptions.value } as CleanValueOptions)
      ) || 0;
    const newValue = key === 'ArrowUp' ? currentValue + props.step : currentValue - props.step;

    if ((props.min !== undefined && newValue < props.min) || (!props.allowNegativeValue && newValue < 0)) {
      return;
    }

    if (props.max !== undefined && newValue > props.max) {
      return;
    }

    const fixedLength = String(props.step).includes('.')
      ? Number(String(props.step).split('.')[1].length)
      : undefined;

    processChange(
      String(fixedLength ? newValue.toFixed(fixedLength) : newValue).replace(
        '.',
        decimalSeparator.value
      )
    );
  }
}

function handleKeyUp(event: KeyboardEvent): void {
  const { key } = event;
  const target = event.currentTarget as HTMLInputElement;
  const { selectionStart } = target;

  if (key !== 'ArrowUp' && key !== 'ArrowDown' && stateValue.value !== '-') {
    const suffixValue = getSuffix(stateValue.value, { groupSeparator: groupSeparator.value, decimalSeparator: decimalSeparator.value });

    if (
      suffixValue &&
      selectionStart &&
      selectionStart > stateValue.value.length - suffixValue.length
    ) {
      if (inputRef.value) {
        const newCursor = stateValue.value.length - suffixValue.length;
        inputRef.value.setSelectionRange(newCursor, newCursor);
      }
    }
  }
}

const displayValue = computed(() => {
  if (stateValue.value === '-' || stateValue.value === decimalSeparator.value) {
    return stateValue.value;
  }
  if (props.value !== undefined && props.value !== null && props.value !== '') {
    return formatValue({
      ...formatValueOptions.value,
      decimalScale: dirty.value ? undefined : props.decimalScale,
      value: String(props.value)
    });
  }
  return stateValue.value;
});

// Expose the input ref for external access
defineExpose({
  input: inputRef,
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select()
});
</script>

<template>
  <input
    ref="inputRef"
    type="text"
    inputmode="decimal"
    :value="displayValue"
    @input="handleInput"
    @blur="handleBlur"
    @focus="handleFocus"
    @keydown="handleKeyDown"
    @keyup="handleKeyUp"
    v-bind="$attrs"
  />
</template>
