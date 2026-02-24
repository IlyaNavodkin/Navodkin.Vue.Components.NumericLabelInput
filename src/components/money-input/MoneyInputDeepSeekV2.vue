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
const lastInputValue = ref<string>("");

// Форматирование числа с разделителями разрядов
const formatNumber = (num: number | null, symbol: string): string => {
  if (num === null || isNaN(num)) return "";
  const parts = num.toFixed(props.decimalPlaces).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const formatted =
    props.decimalPlaces > 0 ? `${integerPart}.${parts[1]}` : integerPart;
  return `${formatted} ${symbol}`;
};

// Функция для добавления пробелов-разделителей в целую часть
const addThousandSeparators = (str: string): string => {
  // Разделяем на целую и дробную части
  const parts = str.split(".");
  // Добавляем пробелы только в целую часть
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".");
};

// Функция для удаления пробелов из строки
const removeSpaces = (str: string): string => {
  return str.replace(/\s/g, "");
};

const displayValue = computed(() => {
  if (isFocused.value && props.inputString) {
    // В фокусе показываем число с пробелами-разделителями
    return addThousandSeparators(props.inputString);
  }
  return formatNumber(props.value, props.currencySymbol);
});

const parseInputString = (str: string): number | null => {
  // Убираем пробелы перед парсингом
  let cleaned = removeSpaces(str);
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
  let s = str;

  // Сохраняем минус если нужно
  const hasMinus = s.startsWith("-") && props.canBeNegative;
  if (hasMinus) s = s.slice(1);

  if (props.decimalPlaces === 0) {
    // Для целых чисел убираем все точки и запятые
    s = s.replace(/[.,]/g, "");
    s = s.replace(/[^\d]/g, "");
  } else {
    // Для чисел с дробной частью
    // Убираем все пробелы для обработки
    s = removeSpaces(s);

    // Проверяем наличие точки
    const hasDot = s.includes(".");

    if (hasDot) {
      const parts = s.split(".");
      // Оставляем только цифры в целой части
      parts[0] = parts[0].replace(/\D/g, "");
      // В дробной части оставляем только цифры и ограничиваем количество
      if (parts.length > 1) {
        parts[1] = parts[1].replace(/\D/g, "").slice(0, props.decimalPlaces);
        s = parts[0] + "." + parts[1];
      } else {
        s = parts[0] + ".";
      }
    } else {
      // Если точки нет, просто оставляем цифры
      s = s.replace(/\D/g, "");
    }
  }

  // Возвращаем с пробелами и минусом если нужно
  const withSeparators = addThousandSeparators(s);
  return (hasMinus ? "-" : "") + withSeparators;
}

function onInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const rawValue = input.value;
  const oldLength = lastInputValue.value.length;
  const newLength = rawValue.length;
  const isDeleting = newLength < oldLength;

  // Сохраняем позицию курсора до изменений
  const selectionStart = input.selectionStart;

  // Фильтруем значение
  const filtered = filterForDecimalPlaces(rawValue);

  if (filtered !== rawValue) {
    input.value = filtered;
  }

  // Для парсинга убираем пробелы
  const valueForParse = removeSpaces(filtered);

  // Обновляем lastInputValue для следующего сравнения
  lastInputValue.value = filtered;

  // Парсим и эмитим события
  const parsedNumber = parseInputString(valueForParse);

  let newInputString = valueForParse;
  if (parsedNumber !== null) {
    newInputString = parsedNumber.toString();
  }

  emit("update:inputString", newInputString);
  emit("update:value", parsedNumber);

  // Восстанавливаем позицию курсора
  nextTick(() => {
    if (inputRef.value && selectionStart !== null) {
      // Корректируем позицию курсора с учетом изменений в форматировании
      let newPosition = selectionStart;

      // Если мы удаляли символ, позиция курсора должна уменьшиться
      if (isDeleting && selectionStart > 0) {
        newPosition = selectionStart - 1;
      }

      // Проверяем, не выходит ли позиция за пределы
      newPosition = Math.min(newPosition, inputRef.value.value.length);

      // Убеждаемся, что позиция не отрицательная
      newPosition = Math.max(0, newPosition);

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
    lastInputValue.value = filtered;
    const valueForParse = removeSpaces(filtered);
    const parsed = parseInputString(valueForParse);
    emit("update:inputString", valueForParse);
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

  // При фокусе показываем значение с пробелами
  if (inputRef.value && props.inputString) {
    const withSeparators = addThousandSeparators(props.inputString);
    inputRef.value.value = withSeparators;
    lastInputValue.value = withSeparators;

    // Устанавливаем курсор в конец
    const length = withSeparators.length;
    inputRef.value.setSelectionRange(length, length);
  }

  emit("focus", e);
}

function onKeyDown(e: KeyboardEvent) {
  const input = e.target as HTMLInputElement;

  if (e.key === "." || e.key === ",") {
    if (props.decimalPlaces === 0) {
      e.preventDefault();
      return;
    }

    // Проверяем, есть ли уже точка в значении (без учета пробелов)
    const valueWithoutSpaces = removeSpaces(input.value);
    if (valueWithoutSpaces.includes(".")) {
      e.preventDefault();
    }
    return;
  }

  if (e.key === "-" && !props.canBeNegative) {
    e.preventDefault();
    return;
  }

  // Особая обработка Backspace для сохранения точки
  if (e.key === "Backspace") {
    const cursorPos = input.selectionStart;
    const value = input.value;

    // Проверяем, не удаляем ли мы точку
    if (cursorPos !== null && cursorPos > 0) {
      const charBeforeCursor = value[cursorPos - 1];

      // Если перед курсором точка, не даем её удалить
      if (charBeforeCursor === ".") {
        e.preventDefault();
        // Перемещаем курсор перед точкой
        input.setSelectionRange(cursorPos - 1, cursorPos - 1);
        return;
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
    if (isFocused.value && inputRef.value) {
      // Обновляем отображение с пробелами
      const withSeparators = addThousandSeparators(newString);
      if (inputRef.value.value !== withSeparators) {
        inputRef.value.value = withSeparators;
        lastInputValue.value = withSeparators;
      }
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
  font-family: monospace;

  &:hover {
    border-color: #667085;
  }

  &:focus {
    border-color: #2e90fa;
    box-shadow: 0 0 0 4px rgba(46, 144, 250, 0.1);
  }
}
</style>
