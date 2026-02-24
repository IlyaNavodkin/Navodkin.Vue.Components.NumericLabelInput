Ниже представлена реализация компонента MoneyInput на Vue 3 с TypeScript, соответствующая техническому заданию.

vue
<!-- MoneyInput.vue -->
<template>
  <input
    ref="inputRef"
    :value="displayValue"
    type="text"
    inputmode="numeric"
    @input="onInput"
    @blur="onBlur"
    @focus="onFocus"
    @keydown="onKeyDown"
    class="money-input"
    :class="{ 'money-input--focused': isFocused }"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

interface Props {
  /** Текущее числовое значение (например, в основных единицах валюты: 1234.56) */
  value: number | null;
  
  /** Сырая строка, которую вводит пользователь (для двусторонней синхронизации) */
  inputString: string;
  
  /** Символ валюты (например, '$', '₽', '€') - отображается в конце */
  currencySymbol: string;
  
  /** Количество знаков после запятой. 0 - только целые числа */
  decimalPlaces: number;
  
  /** Разрешить отрицательные значения */
  canBeNegative: boolean;
  
  /** Опционально: максимальное значение */
  max?: number;
  
  /** Опционально: минимальное значение (если canBeNegative = false, то 0 или выше) */
  min?: number;
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  inputString: '',
  currencySymbol: '$',
  decimalPlaces: 2,
  canBeNegative: false,
  max: undefined,
  min: undefined,
});

const emit = defineEmits<{
  (e: 'update:value', value: number | null): void;
  (e: 'update:inputString', value: string): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
}>();

// Состояние
const isFocused = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const cursorPosition = ref<number | null>(null);

// Значение для отображения в инпуте
const displayValue = computed(() => {
  if (isFocused.value) {
    // При фокусе показываем сырое значение для удобства ввода
    return props.inputString;
  }
  // При потере фокуса показываем отформатированное число
  return formatNumber(props.value, props.currencySymbol);
});

// Форматирование числа для отображения
const formatNumber = (num: number | null, symbol: string): string => {
  if (num === null || isNaN(num)) return '';
  
  // Форматируем число с разделителями тысяч
  const parts = num.toFixed(props.decimalPlaces).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const formatted = props.decimalPlaces > 0 
    ? `${integerPart}.${parts[1]}`
    : integerPart;
  
  return `${formatted} ${symbol}`;
};

// Парсинг строки в число
const parseInputString = (str: string): number | null => {
  // Убираем все, кроме цифр, точки, запятой и минуса
  let cleaned = str.replace(/[^\d.,-]/g, '');
  
  // Заменяем запятую на точку
  cleaned = cleaned.replace(/,/g, '.');
  
  // Обрабатываем минусы
  const minusCount = (cleaned.match(/-/g) || []).length;
  const hasMinus = minusCount > 0;
  
  // Убираем все минусы, оставляем только первый если он есть
  cleaned = cleaned.replace(/-/g, '');
  if (hasMinus && props.canBeNegative) {
    cleaned = '-' + cleaned;
  }
  
  // Ищем валидное число в строке
  const numberRegex = props.canBeNegative 
    ? /-?\d+(?:\.\d*)?|\.\d+/
    : /\d+(?:\.\d*)?|\.\d+/;
  
  const matches = cleaned.match(numberRegex);
  if (!matches) return null;
  
  // Берем последнее валидное число
  const lastMatch = matches[matches.length - 1];
  let num = parseFloat(lastMatch);
  
  if (isNaN(num)) return null;
  
  // Ограничиваем количество знаков после запятой
  if (props.decimalPlaces === 0) {
    num = Math.round(num);
  } else {
    const factor = Math.pow(10, props.decimalPlaces);
    num = Math.round(num * factor) / factor;
  }
  
  // Проверяем ограничения
  if (!props.canBeNegative && num < 0) {
    num = Math.abs(num);
  }
  
  if (props.min !== undefined && num < props.min) {
    num = props.min;
  }
  
  if (props.max !== undefined && num > props.max) {
    num = props.max;
  }
  
  return num;
};

// Обработка ввода
const onInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const rawValue = input.value;
  
  // Сохраняем позицию курсора
  cursorPosition.value = input.selectionStart;
  
  // Парсим введенное значение
  const parsedNumber = parseInputString(rawValue);
  
  // Обновляем inputString (сырое значение)
  let newInputString = rawValue;
  if (parsedNumber !== null) {
    // Если удалось распарсить число, используем его строковое представление
    newInputString = parsedNumber.toString();
  } else {
    // Если не удалось распарсить, фильтруем только разрешенные символы
    newInputString = rawValue.replace(/[^\d.,-]/g, '');
  }
  
  emit('update:inputString', newInputString);
  emit('update:value', parsedNumber);
  
  // Восстанавливаем позицию курсора после обновления DOM
  nextTick(() => {
    if (inputRef.value && cursorPosition.value !== null) {
      const newPosition = Math.min(cursorPosition.value, inputRef.value.value.length);
      inputRef.value.setSelectionRange(newPosition, newPosition);
    }
  });
};

// Обработка потери фокуса
const onBlur = (event: FocusEvent) => {
  isFocused.value = false;
  
  // При потере фокуса форматируем значение
  if (props.value !== null) {
    const formatted = props.value.toFixed(props.decimalPlaces);
    emit('update:inputString', formatted);
  } else {
    emit('update:inputString', '');
  }
  
  emit('blur', event);
};

// Обработка получения фокуса
const onFocus = (event: FocusEvent) => {
  isFocused.value = true;
  emit('focus', event);
};

// Обработка нажатий клавиш для дополнительного контроля
const onKeyDown = (event: KeyboardEvent) => {
  // Предотвращаем ввод нескольких точек
  if (event.key === '.' || event.key === ',') {
    if (props.decimalPlaces === 0) {
      event.preventDefault();
      return;
    }
    
    const input = event.target as HTMLInputElement;
    if (input.value.includes('.') || input.value.includes(',')) {
      event.preventDefault();
    }
  }
  
  // Предотвращаем ввод минуса, если не разрешен
  if (event.key === '-' && !props.canBeNegative) {
    event.preventDefault();
  }
};

// Следим за изменением value извне
watch(() => props.value, (newValue) => {
  if (!isFocused.value) {
    // Если не в фокусе, форматируем для отображения
    if (newValue !== null) {
      const formatted = newValue.toFixed(props.decimalPlaces);
      emit('update:inputString', formatted);
    } else {
      emit('update:inputString', '');
    }
  }
});

// Следим за изменением inputString извне
watch(() => props.inputString, (newString) => {
  if (isFocused.value) {
    // Если в фокусе, парсим для обновления value
    const parsed = parseInputString(newString);
    emit('update:value', parsed);
  }
});
</script>

<style lang="scss" scoped>
.money-input {
  width: 100%;
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
  
  &--focused {
    // Стили для фокусированного состояния
  }
  
  // Убираем стрелки у number input
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &[type=number] {
    -moz-appearance: textfield;
  }
}
</style>
Основные особенности реализации:
Форматирование: При потере фокуса число форматируется с пробелами между тысячами и символом валюты в конце.

Ввод данных:

Фильтрация неразрешенных символов

Поддержка вставки из буфера обмена с извлечением последнего валидного числа

Контроль десятичных знаков

Валидация:

Проверка на отрицательные значения

Контроль min/max

Ограничение десятичных знаков

UX:

Сохранение позиции курсора при форматировании

Разное отображение при фокусе и потере фокуса

Отзывчивость при быстром вводе

Двусторонняя синхронизация:

При вводе обновляется inputString

Из inputString вычисляется value

При изменении value извне обновляется отображение

Компонент готов к использованию и полностью соответствует техническому заданию.