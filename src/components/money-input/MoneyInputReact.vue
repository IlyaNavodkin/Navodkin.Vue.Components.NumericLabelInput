<template>
  <input
    ref="inputRef"
    type="text"
    :inputmode="inputMode"
    :id="id"
    :name="name"
    :class="className"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="renderValue"
    @input="handleOnInput"
    @blur="handleOnBlur"
    @focus="handleOnFocus"
    @keydown="handleOnKeyDown"
    @keyup="handleOnKeyUp"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import {
  isNumber,
  cleanValue,
  fixedDecimalValue,
  formatValue,
  getLocaleConfig,
  padTrimValue,
  repositionCursor,
  type CurrencyInputOnChangeValues,
  type IntlConfig,
} from "../../utils/currencyInputUtils";

export interface CurrencyInputProps {
  allowDecimals?: boolean;
  allowNegativeValue?: boolean;
  id?: string;
  maxLength?: number;
  className?: string;
  customInput?: any;
  decimalsLimit?: number;
  defaultValue?: number | string;
  disabled?: boolean;
  fixedDecimalLength?: number;
  onValueChange?: (
    value: string | undefined,
    name?: string | undefined,
    values?: CurrencyInputOnChangeValues
  ) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  decimalSeparator?: string;
  groupSeparator?: string;
  disableGroupSeparators?: boolean;
  intlConfig?: IntlConfig;
  transformRawValue?: (rawValue: string) => string;
  formatValueOnBlur?: boolean;
  value?: string | number;
  name?: string;
  onChange?: (event: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  decimalScale?: number;
}

const props = withDefaults(defineProps<CurrencyInputProps>(), {
  allowDecimals: true,
  allowNegativeValue: true,
  disabled: false,
  disableGroupSeparators: false,
  formatValueOnBlur: true,
  decimalsLimit: 2,
  decimalScale: undefined,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number | undefined): void;
  (e: "change", event: Event): void;
  (e: "focus", event: FocusEvent): void;
  (e: "blur", event: FocusEvent): void;
  (e: "keydown", event: KeyboardEvent): void;
  (e: "keyup", event: KeyboardEvent): void;
}>();

// Validation
if (props.decimalSeparator && isNumber(props.decimalSeparator)) {
  throw new Error("decimalSeparator cannot be a number");
}

if (props.groupSeparator && isNumber(props.groupSeparator)) {
  throw new Error("groupSeparator cannot be a number");
}

if (
  props.decimalSeparator &&
  props.groupSeparator &&
  props.decimalSeparator === props.groupSeparator &&
  !props.disableGroupSeparators
) {
  throw new Error("decimalSeparator cannot be the same as groupSeparator");
}

// Locale config
const localeConfig = computed(() => getLocaleConfig(props.intlConfig));
const decimalSeparator = computed(
  () => props.decimalSeparator || localeConfig.value.decimalSeparator || "."
);
const groupSeparator = computed(
  () => props.groupSeparator || localeConfig.value.groupSeparator || ","
);

const formatValueOptions = computed(() => ({
  decimalSeparator: decimalSeparator.value,
  groupSeparator: groupSeparator.value,
  disableGroupSeparators: props.disableGroupSeparators,
  intlConfig: props.intlConfig,
  prefix: props.prefix || localeConfig.value.prefix,
  suffix: props.suffix,
}));

const cleanValueOptions = computed(() => ({
  decimalSeparator: decimalSeparator.value,
  groupSeparator: groupSeparator.value,
  allowDecimals: props.allowDecimals,
  decimalsLimit: props.decimalsLimit || props.fixedDecimalLength || 2,
  allowNegativeValue: props.allowNegativeValue,
  prefix: props.prefix || localeConfig.value.prefix,
  transformRawValue: props.transformRawValue,
}));

// State
const dirty = ref(false);
const cursor = ref(0);
const changeCount = ref(0);
const lastKeyStroke = ref<string | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

// Initial value
const initialValue = computed(() => {
  if (props.defaultValue != null) {
    return formatValue({
      ...formatValueOptions.value,
      decimalScale: props.decimalScale,
      value: String(props.defaultValue),
    });
  }
  if (props.value != null) {
    return formatValue({
      ...formatValueOptions.value,
      decimalScale: props.decimalScale,
      value: String(props.value),
    });
  }
  return "";
});

const stateValue = ref<string>(initialValue.value);

const inputMode = computed(() => {
  return props.allowDecimals ? "decimal" : "numeric";
});

// Watch for external value changes
watch(
  () => props.value,
  (newValue) => {
    if (newValue == null && props.defaultValue == null) {
      stateValue.value = "";
    }
  }
);

// Process change in value
const processChange = (value: string, selectionStart?: number | null): void => {
  dirty.value = true;

  const { modifiedValue, cursorPosition } = repositionCursor({
    selectionStart,
    value,
    lastKeyStroke: lastKeyStroke.value,
    stateValue: stateValue.value,
    groupSeparator: groupSeparator.value,
  });

  const stringValue = cleanValue({
    value: modifiedValue,
    ...cleanValueOptions.value,
  });

  if (
    props.maxLength &&
    stringValue.replace(/-/g, "").length > props.maxLength
  ) {
    return;
  }

  if (
    stringValue === "" ||
    stringValue === "-" ||
    stringValue === decimalSeparator.value
  ) {
    props.onValueChange?.(undefined, props.name, {
      float: null,
      formatted: "",
      value: "",
    });
    stateValue.value = stringValue;
    // Always sets cursor after '-' or decimalSeparator input
    cursor.value = 1;
    return;
  }

  const stringValueWithoutSeparator = decimalSeparator.value
    ? stringValue.replace(decimalSeparator.value, ".")
    : stringValue;

  const numberValue = parseFloat(stringValueWithoutSeparator);

  const formattedValue = formatValue({
    value: stringValue,
    ...formatValueOptions.value,
  });

  if (cursorPosition != null) {
    // Prevent cursor jumping
    let newCursor = cursorPosition + (formattedValue.length - value.length);
    newCursor =
      newCursor <= 0 ? (props.prefix ? props.prefix.length : 0) : newCursor;

    cursor.value = newCursor;
    changeCount.value = changeCount.value + 1;
  }

  stateValue.value = formattedValue;

  if (props.onValueChange) {
    const values: CurrencyInputOnChangeValues = {
      float: isNaN(numberValue) ? null : numberValue,
      formatted: formattedValue,
      value: stringValue,
    };
    props.onValueChange(stringValue, props.name, values);
  }
};

/**
 * Handle input event
 */
const handleOnInput = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const { value, selectionStart } = target;

  processChange(value, selectionStart);

  emit("change", event);
};

/**
 * Handle focus event
 */
const handleOnFocus = (event: FocusEvent): void => {
  props.onFocus?.(event);
  emit("focus", event);
};

/**
 * Handle blur event
 */
const handleOnBlur = (event: FocusEvent): void => {
  const target = event.target as HTMLInputElement;
  const { value } = target;

  const valueOnly = cleanValue({ value, ...cleanValueOptions.value });

  if (valueOnly === "-" || valueOnly === decimalSeparator.value || !valueOnly) {
    stateValue.value = "";
    props.onBlur?.(event);
    emit("blur", event);
    return;
  }

  const fixedDecimals = fixedDecimalValue(
    valueOnly,
    decimalSeparator.value,
    props.fixedDecimalLength
  );

  const newValue = padTrimValue(
    fixedDecimals,
    decimalSeparator.value,
    props.decimalScale !== undefined
      ? props.decimalScale
      : props.fixedDecimalLength
  );

  const stringValueWithoutSeparator = decimalSeparator.value
    ? newValue.replace(decimalSeparator.value, ".")
    : newValue;

  const numberValue = parseFloat(stringValueWithoutSeparator);

  const formattedValue = formatValue({
    ...formatValueOptions.value,
    value: newValue,
  });

  if (props.onValueChange && props.formatValueOnBlur) {
    props.onValueChange(newValue, props.name, {
      float: isNaN(numberValue) ? null : numberValue,
      formatted: formattedValue,
      value: newValue,
    });
  }

  stateValue.value = formattedValue;

  props.onBlur?.(event);
  emit("blur", event);
};

/**
 * Handle key down event
 */
const handleOnKeyDown = (event: KeyboardEvent): void => {
  const { key } = event;

  lastKeyStroke.value = key;

  if (props.step && (key === "ArrowUp" || key === "ArrowDown")) {
    event.preventDefault();
    cursor.value = stateValue.value.length;

    const stringValue = props.value != null ? String(props.value) : undefined;
    const stringValueWithoutSeparator =
      decimalSeparator.value && stringValue
        ? stringValue.replace(decimalSeparator.value, ".")
        : stringValue;

    const currentValue =
      parseFloat(
        stringValueWithoutSeparator != null
          ? stringValueWithoutSeparator
          : cleanValue({ value: stateValue.value, ...cleanValueOptions.value })
      ) || 0;

    const newValue =
      key === "ArrowUp" ? currentValue + props.step : currentValue - props.step;

    if (
      (props.min !== undefined && newValue < Number(props.min)) ||
      (!props.allowNegativeValue && newValue < 0)
    ) {
      return;
    }

    if (props.max !== undefined && newValue > Number(props.max)) {
      return;
    }

    const fixedLength = String(props.step).includes(".")
      ? Number(String(props.step).split(".")[1].length)
      : undefined;

    processChange(
      String(fixedLength ? newValue.toFixed(fixedLength) : newValue).replace(
        ".",
        decimalSeparator.value
      )
    );
  }

  props.onKeyDown?.(event);
  emit("keydown", event);
};

/**
 * Handle key up event
 */
const handleOnKeyUp = (event: KeyboardEvent): void => {
  const { key, currentTarget } = event as KeyboardEvent & {
    currentTarget: HTMLInputElement;
  };
  const selectionStart = currentTarget?.selectionStart;

  if (key !== "ArrowUp" && key !== "ArrowDown" && stateValue.value !== "-") {
    const suffix = stateValue.value.match(/[^0-9.,\s-]+$/)?.[0];

    if (
      suffix &&
      selectionStart &&
      selectionStart > stateValue.value.length - suffix.length
    ) {
      if (inputRef.value) {
        const newCursor = stateValue.value.length - suffix.length;
        inputRef.value.setSelectionRange(newCursor, newCursor);
      }
    }
  }

  props.onKeyUp?.(event);
  emit("keyup", event);
};

// Watch for cursor repositioning
watch([stateValue, cursor, changeCount], async () => {
  await nextTick();
  if (
    dirty.value &&
    stateValue.value !== "-" &&
    inputRef.value &&
    document.activeElement === inputRef.value
  ) {
    inputRef.value.setSelectionRange(cursor.value, cursor.value);
  }
});

// Render value
const renderValue = computed(() => {
  if (
    props.value != null &&
    stateValue.value !== "-" &&
    (!decimalSeparator.value || stateValue.value !== decimalSeparator.value)
  ) {
    return formatValue({
      ...formatValueOptions.value,
      decimalScale: dirty.value ? undefined : props.decimalScale,
      value: String(props.value),
    });
  }

  return stateValue.value;
});
</script>

<style scoped>
.money-input-react {
  /* Basic styling */
}
</style>
