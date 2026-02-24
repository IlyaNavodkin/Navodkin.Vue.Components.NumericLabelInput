Ваш компонент реализован на очень хорошем уровне: разделение логики отображения (focus/blur), обработка вставки и сохранение позиции курсора — это признаки качественного UX.

Однако в коде есть несколько критических моментов и потенциальных багов, которые стоит исправить для повышения надежности.

### Что стоит улучшить:

1.  **Ошибка в `parseInputToNumber` (Regex):**
    В строке `const clean = input.replace(/[ \s${props.currencySymbol}]/g, '');` есть проблема. Если `currencySymbol` — это `$`, то в регулярке это будет трактоваться как "конец строки" или просто символ внутри набора. Если же символ состоит из нескольких букв (например, `руб.`), то `[]` будет удалять каждую букву по отдельности везде в строке.
    *Решение:* Использовать `replace(props.currencySymbol, '')`.

2.  **Экранирование спецсимволов:**
    Если `currencySymbol` содержит `$`, `*` или другие спецсимволы регулярных выражений, `new RegExp` может упасть.

3.  **Логика `clamp` при наборе:**
    Вы вызываете `clamp` внутри `handleInput`. Это может мешать пользователю. Например, если `min: 100`, а пользователь хочет ввести `105`, то при вводе первой единицы `clamp` превратит её в `100`, что заблокирует нормальный ввод.
    *Решение:* `clamp` лучше применять только на `blur` или при вставке (paste). Во время ввода достаточно только фильтрации символов.

4.  **Баг в объявлении Regex:**
    `const regex = allowNegative ? /^-?\d+(\.\d{0,99})?$/ : /^\d+(\.\d{0,99})?$/.source;` — здесь `.source` применен только к одной ветке тернарного оператора, что создаст несоответствие типов.

### Оптимизированный код (исправленные моменты):

```typescript
// ... (props/emits без изменений)

// Утилита для безопасного создания RegExp из строки
const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function parseInputToNumber(input: string, decimals: number, allowNegative: boolean): number | null {
  // 1. Удаляем пробелы и конкретный символ валюты
  let clean = input.replace(/\s/g, '');
  if (props.currencySymbol) {
    clean = clean.replace(props.currencySymbol, '');
  }
  
  if (!clean || clean === '-') return null;

  // 2. Проверка валидности числа (учитываем точку)
  const escapedSymbol = escapeRegExp(props.currencySymbol);
  const regexStr = allowNegative ? `^-?\\d*(\\.\\d{0,${decimals}})?$` : `^\\d*(\\.\\d{0,${decimals}})?$`;
  const regex = new RegExp(regexStr);
  
  if (!regex.test(clean)) return null;

  const num = parseFloat(clean);
  return isNaN(num) ? null : parseFloat(num.toFixed(decimals));
}

const handleInput = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const originalValue = target.value;
  const cursor = target.selectionStart || 0;

  // Фильтруем только недопустимые символы, но НЕ ограничиваем min/max здесь
  const filtered = filterInput(originalValue, props.decimalPlaces, props.canBeNegative);
  
  if (filtered !== originalValue) {
    target.value = filtered;
    const diff = originalValue.length - filtered.length;
    await nextTick();
    target.setSelectionRange(Math.max(0, cursor - diff), Math.max(0, cursor - diff));
  }

  emit('update:inputString', filtered);
  const num = parseInputToNumber(filtered, props.decimalPlaces, props.canBeNegative);
  // Эмитим число без clamping, чтобы не "прыгали" цифры при вводе
  emit('update:value', num); 
};

const handleBlur = async (event: FocusEvent) => {
  isFocused.value = false;
  
  const input = inputRef.value;
  if (input) {
    const num = parseInputToNumber(input.value, props.decimalPlaces, props.canBeNegative);
    // Применяем clamp ТОЛЬКО на выходе (blur)
    const clamped = clamp(num, props.min, props.max, props.canBeNegative);
    const formatted = formatNumberOrEmpty(clamped, props.decimalPlaces);
    
    input.value = formatted;
    emit('update:inputString', formatted);
    emit('update:value', clamped);
  }
  emit('blur', event);
};

// Исправленный filterInput: позволяем вводить точку и минус без мгновенного удаления
function filterInput(input: string, decimals: number, allowNegative: boolean): string {
  let result = '';
  let hasDecimal = false;
  let hasMinus = false;
  let decimalCount = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    
    if (char === '-' && allowNegative && i === 0 && !hasMinus) {
      result += char;
      hasMinus = true;
    } else if (char === '.' && decimals > 0 && !hasDecimal) {
      result += char;
      hasDecimal = true;
    } else if (/\d/.test(char)) {
      if (hasDecimal) {
        if (decimalCount < decimals) {
          result += char;
          decimalCount++;
        }
      } else {
        result += char;
      }
    }
  }
  return result;
}
```

### Рекомендации по UX:
1.  **Inputmode:** Вы используется `inputmode="decimal"`. Это отлично для мобильных устройств (вызывает клавиатуру с точкой).
2.  **Zero-handling:** Подумайте, нужно ли превращать пустую строку в `0` или оставлять `null`. В финансовых системах `null` часто предпочтительнее для обязательных полей. У вас сейчас `null`, что корректно.
3.  **Курсор при форматировании:** Поскольку вы меняете значение на `blur`, проблем с "прыгающим" курсором не будет. Если захотите форматировать прямо *во время ввода*, придется вычислять количество добавленных пробелов-разделителей и смещать курсор на их количество. Текущий подход (raw при фокусе) гораздо проще в поддержке.

Этот вариант компонента будет работать стабильнее в пограничных случаях (ввод спецсимволов, работа с отрицательными числами и соблюдение границ min/max).