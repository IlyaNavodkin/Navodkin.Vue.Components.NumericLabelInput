<script setup lang="ts">
import { ref, reactive } from "vue";
import MoneyInputDeepSeek from "../components/money-input/MoneyInputDeepSeek.vue";

interface CaseState {
  value: number | null;
  inputString: string;
}

const createCaseState = (): CaseState =>
  reactive({ value: null, inputString: "" });

const cases = ref([
  {
    id: "basic",
    title: "Базовый",
    description: "Валюта $, 2 знака",
    props: {
      currencySymbol: "$",
      decimalPlaces: 2,
      canBeNegative: false,
    },
    state: createCaseState(),
  },
  {
    id: "meters",
    title: "Метры",
    description: "Метры",
    props: {
      currencySymbol: "м2",
      decimalPlaces: 6,
      canBeNegative: true,
    },
    state: createCaseState(),
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
      max: 10000,
    },
    state: createCaseState(),
  },
  {
    id: "negative",
    title: "Отрицательные значения",
    description: "canBeNegative = true",
    props: {
      currencySymbol: "$",
      decimalPlaces: 2,
      canBeNegative: true,
    },
    state: createCaseState(),
  },
  {
    id: "negative-minmax",
    title: "Отрицательные с диапазоном",
    description: "Диапазон -5 000 — 5 000",
    props: {
      currencySymbol: "$",
      decimalPlaces: 2,
      canBeNegative: true,
      min: -5000,
      max: 5000,
    },
    state: createCaseState(),
  },
  {
    id: "no-decimals",
    title: "Без десятичных",
    description: "decimalPlaces = 0",
    props: {
      currencySymbol: "$",
      decimalPlaces: 0,
      canBeNegative: false,
    },
    state: createCaseState(),
  },
  {
    id: "euro",
    title: "Евро (€)",
    description: "Валюта €, 2 знака",
    props: {
      currencySymbol: "€",
      decimalPlaces: 2,
      canBeNegative: false,
    },
    state: createCaseState(),
  },
]);

function handleUpdateValue(c: (typeof cases.value)[0], value: number | null) {
  c.state.value = value;
}

function handleUpdateInputString(c: (typeof cases.value)[0], value: string) {
  c.state.inputString = value;
}
</script>

<template>
  <div class="page">
    <header class="header">
      <h1 class="title">MoneyInputDeepSeek</h1>
      <p class="desc">
        DeepSeek реализация — inputmode, onKeyDown, clamp при вводе. Поддержка
        min/max.
      </p>
    </header>
    <section class="stories">
      <article v-for="c in cases" :key="c.id" class="story">
        <h3 class="story-title">{{ c.title }}</h3>
        <p class="story-desc">{{ c.description }}</p>
        <div class="story-demo">
          <MoneyInputDeepSeek
            v-bind="c.props"
            :value="c.state.value"
            :inputString="c.state.inputString"
            @update:value="handleUpdateValue(c, $event)"
            @update:inputString="handleUpdateInputString(c, $event)"
          />
        </div>
        <div class="story-value">
          <div>value: {{ c.state.value }}</div>
          <div>inputString: {{ c.state.inputString }}</div>
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
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>
