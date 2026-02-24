<script setup lang="ts">
import { reactive } from "vue";
import MoneyInputAssistantB from "../components/money-input/MoneyInputAssistantB.vue";

const cases = [
  {
    id: "basic",
    title: "Базовый",
    description: "Валюта $, 2 знака, без минуса",
    props: { currencySymbol: "$", decimalPlaces: 2, canBeNegative: false },
    state: reactive({ value: null as number | null, inputString: "" }),
  },
  {
    id: "minmax",
    title: "Min / Max",
    description: "Диапазон 0 — 10 000",
    props: {
      currencySymbol: "$",
      decimalPlaces: 2,
      canBeNegative: false,
      min: 0,
      max: 10_000,
    },
    state: reactive({ value: null as number | null, inputString: "" }),
  },
  {
    id: "negative",
    title: "Отрицательные",
    description: "canBeNegative = true",
    props: { currencySymbol: "$", decimalPlaces: 2, canBeNegative: true },
    state: reactive({ value: null as number | null, inputString: "" }),
  },
  {
    id: "integer",
    title: "Только целые",
    description: "decimalPlaces = 0",
    props: { currencySymbol: "$", decimalPlaces: 0, canBeNegative: false },
    state: reactive({ value: null as number | null, inputString: "" }),
  },
  {
    id: "currency-rub",
    title: "Валюта ₽",
    description: "Рубли",
    props: { currencySymbol: "м2.", decimalPlaces: 2, canBeNegative: false },
    state: reactive({ value: null as number | null, inputString: "" }),
  },
  {
    id: "paste-test",
    title: "Вставка",
    description: 'Вставьте текст вида "abc 123.45 def"',
    props: { currencySymbol: "$", decimalPlaces: 2, canBeNegative: false },
    state: reactive({ value: null as number | null, inputString: "" }),
  },
];
</script>

<template>
  <div class="page">
    <header class="header">
      <h1 class="title">Assistant B</h1>
      <p class="desc">escapeRegExp, clamp на blur, filterInput</p>
    </header>
    <section class="stories">
      <article v-for="c in cases" :key="c.id" class="story">
        <h3 class="story-title">{{ c.title }}</h3>
        <p class="story-desc">{{ c.description }}</p>
        <div class="story-demo">
          <MoneyInputAssistantB
            v-bind="c.props"
            :value="c.state.value"
            :input-string="c.state.inputString"
            @update:value="c.state.value = $event"
            @update:inputString="c.state.inputString = $event"
          />
        </div>
        <div v-if="c.state.value !== null" class="story-value">
          value: {{ c.state.value }}
        </div>
      </article>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.page {
  padding: 2rem 3rem;
  min-height: 100vh;
  background: #1a1b1e;
  color: #e4e4e7;
}

.header {
  margin-bottom: 2rem;
}

.title {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.desc {
  margin: 0;
  font-size: 0.9rem;
  color: #90909a;
}

.stories {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.story {
  padding: 1.25rem;
  background: #252527;
  border: 1px solid #2d2d30;
  border-radius: 8px;
}

.story-title {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.story-desc {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: #90909a;
}

.story-demo {
  margin-bottom: 0.5rem;
}

.story-value {
  font-size: 0.8rem;
  color: #6d6d75;
}
</style>
