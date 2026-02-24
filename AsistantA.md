**Отличная работа!** Компонент в целом очень хороший, продуманный и близок к production-ready. Но есть несколько **критических и важных** моментов, которые нужно поправить.

---

### Критические баги

#### 1. Ошибка в `parseInputToNumber` (самая важная!)

```ts
const regex = allowNegative 
  ? /^-?\d+(\.\d{0,99})?$/ 
  : /^\d+(\.\d{0,99})?$/;   // ← было неправильно

if (!regex.test(clean)) return null;
```

Текущий код с `.source` — **сломан**.

#### 2. В `handleBlur` неправильно эмитится value

```ts
const num = parseInputToNumber(...);
const formatted = formatNumberOrEmpty(clamp(num, ...), ...);

input.value = formatted;
emit('update:inputString', formatted);
emit('update:value', num); // ← здесь должен быть clamped!
```

Должно быть:
```ts
const clamped = clamp(num, props.min, props.max, props.canBeNegative);
emit('update:value', clamped);
```

---

### Важные улучшения

#### 3. Упрощение архитектуры (рекомендую)

Текущая связка `displayValue` + `rawInputValue` + два computed + watch'и — слишком сложная и хрупкая.

**Лучший паттерн** для таких компонентов:

```vue
<template>
  <input
    ref="inputRef"
    :value="internalValue"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
    @paste="handlePaste"
  />
</template>
```

И внутри:

```ts
const internalValue = ref('');

watch(() => props.value, (newVal) => {
  if (!isFocused.value) {
    internalValue.value = newVal === null 
      ? '' 
      : formatNumber(newVal, props.decimalPlaces);
  }
}, { immediate: true });

watch(() => props.inputString, (newVal) => {
  if (!isFocused.value) internalValue.value = newVal;
});
```

Это намного чище и меньше мест для race condition.

---

### Другие замечания и улучшения

#### 4. Форматирование на `input` (UX)
Сейчас ты форматируешь только на `blur`. Это правильно.

Но можно улучшить поведение при вводе:
- При вводе после точки автоматически добавлять нули до `decimalPlaces` — не нужно.
- А вот **удалять ведущие нули** (кроме "0.") — желательно.

#### 5. `filterInput` можно улучшить

```ts
// Можно чуть оптимизировать и сделать надёжнее
function filterInput(input: string, decimals: number, allowNegative: boolean): string {
  let result = '';
  let hasDecimal = false;
  let decimalCount = 0;
  let hasMinus = false;

  for (const char of input) {
    if (char === '-' && allowNegative && !hasMinus && result === '') {
      result += '-';
      hasMinus = true;
      continue;
    }
    if (char === '.' && !hasDecimal) {
      result += '.';
      hasDecimal = true;
      continue;
    }
    if (/\d/.test(char)) {
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

  // Убираем ведущие нули (кроме 0.xxx)
  return result.replace(/^0+(?=\d)/, '') || (result.startsWith('.') ? '0' + result : result);
}
```

#### 6. `extractLastValidNumber` — улучшить regex

```ts
const regex = allowNegative 
  ? /-?\d*\.?\d+/g 
  : /\d*\.?\d+/g;
```

И лучше брать **самое длинное** совпадение, а не последнее.

---

### Итоговая рекомендация

Я бы сделал рефакторинг в следующем порядке:

1. Починить критические баги (1 и 2)
2. Перейти на один `internalValue` вместо двух computed
3. Улучшить `filterInput`
4. Добавить опциональный проп `showCurrencySymbol` (иногда хочется без него при фокусе)

---

Хочешь, я прямо сейчас выдам **исправленную и улучшенную версию** компонента с учётом всех замечаний (более чистую архитектуру)?

Могу сделать в двух вариантах:
- **A.** Минимальные правки (только баги + улучшения)
- **B.** Полный рефакторинг с более элегантной архитектурой

Какой предпочитаешь?