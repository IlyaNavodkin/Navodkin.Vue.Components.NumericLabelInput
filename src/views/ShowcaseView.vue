<script setup lang="ts">
import { ref, computed, markRaw, reactive } from "vue";
import {
  MoneyInputAssistantA,
  MoneyInputAssistantB,
  MoneyInputChatGpt,
  MoneyInputDeepSeek,
  MoneyInputGrok,
  MoneyInputPerplexity,
  MoneyInputReactWrapper,
  MoneyInputVueCurrency,
} from "../components/money-input";

const agents = [
  {
    id: "assistant-a",
    name: "Assistant A",
    component: markRaw(MoneyInputAssistantA),
    desc: "Рекомендации: internalValue, clamp только на blur",
  },
  {
    id: "assistant-b",
    name: "Assistant B",
    component: markRaw(MoneyInputAssistantB),
    desc: "escapeRegExp, clamp на blur, filterInput",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    component: markRaw(MoneyInputChatGpt),
    desc: "displayValue, валюта справа, validateNumber",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    component: markRaw(MoneyInputDeepSeek),
    desc: "inputmode=numeric, onKeyDown, clamp при вводе",
  },
  {
    id: "grok",
    name: "Grok",
    component: markRaw(MoneyInputGrok),
    desc: "localInput, select() на focus, parseAndValidate",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    component: markRaw(MoneyInputPerplexity),
    desc: "displayValue + rawInputValue, clamp при вводе",
  },
  {
    id: "react",
    name: "MoneyInputReact",
    component: markRaw(MoneyInputReactWrapper),
    desc: "Порт React CurrencyInput — prefix, decimals, разделители групп",
  },
  {
    id: "vue-currency",
    name: "Vue Currency",
    component: markRaw(MoneyInputVueCurrency),
    desc: "Идея Vue-Currency-Input: формат с пробелом тысяч, суффикс валюты, distraction-free при фокусе",
  },
] as const;

const selectedAgentId = ref<string>(agents[0].id);
const selectedAgent = computed(
  () => agents.find((a) => a.id === selectedAgentId.value) ?? agents[0]
);

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
    description: "Валюта $, 2 знака, без минуса",
    props: { currencySymbol: "$", decimalPlaces: 2, canBeNegative: false },
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
      max: 10_000,
    },
    state: createCaseState(),
  },
  {
    id: "negative",
    title: "Отрицательные",
    description: "canBeNegative = true",
    props: { currencySymbol: "$", decimalPlaces: 2, canBeNegative: true },
    state: createCaseState(),
  },
  {
    id: "integer",
    title: "Только целые",
    description: "decimalPlaces = 0",
    props: { currencySymbol: "$", decimalPlaces: 0, canBeNegative: false },
    state: createCaseState(),
  },
  {
    id: "currency-rub",
    title: "Валюта ₽",
    description: "Рубли",
    props: { currencySymbol: "₽", decimalPlaces: 2, canBeNegative: false },
    state: createCaseState(),
  },
  {
    id: "paste-test",
    title: "Вставка",
    description: 'Вставьте текст вида "abc 123.45 def"',
    props: { currencySymbol: "$", decimalPlaces: 2, canBeNegative: false },
    state: createCaseState(),
  },
]);
</script>

<template>
  <div class="showcase">
    <aside class="sidebar">
      <h2 class="sidebar-title">Агенты</h2>
      <nav class="agent-list">
        <button
          v-for="agent in agents"
          :key="agent.id"
          type="button"
          class="agent-btn"
          :class="{ active: selectedAgentId === agent.id }"
          @click="selectedAgentId = agent.id"
        >
          {{ agent.name }}
        </button>
      </nav>
    </aside>
    <main class="main">
      <header class="header">
        <h1 class="title">{{ selectedAgent.name }}</h1>
        <p class="desc">{{ selectedAgent.desc }}</p>
      </header>
      <section class="stories">
        <article v-for="c in cases" :key="c.id" class="story">
          <h3 class="story-title">{{ c.title }}</h3>
          <p class="story-desc">{{ c.description }}</p>
          <div class="story-demo">
            <component
              :is="selectedAgent.component"
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
    </main>
  </div>
</template>

<style lang="scss" scoped>
.showcase {
  display: flex;
  min-height: 100vh;
  background: #1a1b1e;
  color: #e4e4e7;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  padding: 1.5rem 0;
  border-right: 1px solid #2d2d30;
  background: #252527;
}

.sidebar-title {
  margin: 0 1rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #90909a;
}

.agent-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.agent-btn {
  margin: 0 0.5rem;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.9rem;
  color: #c4c4c8;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #2d2d30;
    color: #fff;
  }

  &.active {
    background: #094771;
    color: #fff;
  }
}

.main {
  flex: 1;
  padding: 2rem 3rem;
  overflow: auto;
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
