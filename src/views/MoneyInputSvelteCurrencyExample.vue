<script setup lang="ts">
import { ref, reactive } from "vue";
import { MoneyInputSvelteCurrency } from "../components/money-input";
import type { CurrencyInputValues } from "../components/money-input/types";

interface CaseState {
  value: string;
  values: CurrencyInputValues | null;
}

const createCaseState = (): CaseState => reactive({ value: "", values: null });

const cases = ref([
  {
    id: "basic",
    title: "Базовый",
    description: "Валюта $, 2 знака, разделители групп",
    props: {
      suffix: " $",
      decimalScale: 2,
      allowNegativeValue: false,
    },
    state: createCaseState(),
  },
  {
    id: "euro",
    title: "Евро (€)",
    description: "Валюта €, 2 знака, суффикс EUR",
    props: {
      suffix: " EUR",
      decimalScale: 2,
      allowNegativeValue: false,
    },
    state: createCaseState(),
  },
  {
    id: "negative",
    title: "Отрицательные значения",
    description: "allowNegativeValue = true",
    props: {
      suffix: " $",
      decimalScale: 2,
      allowNegativeValue: true,
    },
    state: createCaseState(),
  },
  {
    id: "minmax",
    title: "Min / Max",
    description: "Диапазон 0 — 10 000",
    props: {
      suffix: " $",
      decimalScale: 2,
      allowNegativeValue: false,
      min: 0,
      max: 10000,
    },
    state: createCaseState(),
  },
  {
    id: "no-decimals",
    title: "Без десятичных",
    description: "allowDecimals = false",
    props: {
      suffix: "$ ",
      allowDecimals: false,
      allowNegativeValue: false,
    },
    state: createCaseState(),
  },
  {
    id: "step",
    title: "Step (стрелки)",
    description: "step = 0.01, стрелки вверх/вниз",
    props: {
      suffix: "$ ",
      decimalScale: 2,
      step: 0.01,
      allowNegativeValue: false,
    },
    state: createCaseState(),
  },
  {
    id: "fixed-decimals",
    title: "Фиксированные десятичные",
    description: "fixedDecimalLength = 2 (всегда 2 знака)",
    props: {
      suffix: "$ ",
      fixedDecimalLength: 2,
      decimalScale: 2,
    },
    state: createCaseState(),
  },
]);

function handleInputValue(
  c: (typeof cases.value)[0],
  values: CurrencyInputValues
) {
  c.state.values = values;
}
</script>

<template>
  <div class="page">
    <header class="header">
      <h1 class="title">MoneyInputSvelteCurrency</h1>
      <p class="desc">
        Порт Svelte Currency Input — prefix/suffix, decimals, разделители групп,
        step. Фиксированные разделители: десятичная точка (.), разделитель групп
        (,).
      </p>
    </header>
    <section class="stories">
      <article v-for="c in cases" :key="c.id" class="story">
        <h3 class="story-title">{{ c.title }}</h3>
        <p class="story-desc">{{ c.description }}</p>
        <div class="story-demo">
          <MoneyInputSvelteCurrency
            v-bind="c.props"
            :value="c.state.value"
            @update:modelValue="c.state.value = $event"
            @inputvalue="handleInputValue(c, $event)"
          />
        </div>
        <div v-if="c.state.values" class="story-value">
          <div>float: {{ c.state.values.float }}</div>
          <div>formatted: {{ c.state.values.formatted }}</div>
          <div>value: {{ c.state.values.value }}</div>
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
