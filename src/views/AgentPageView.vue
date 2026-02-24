<script setup lang="ts">
import { computed, reactive } from "vue";
import { useRoute } from "vue-router";
import { getAgentById } from "../config/agents";
import { casesConfig } from "../config/cases";

const route = useRoute();
const agentId = computed(() => (route.meta.agentId as string) ?? "assistant-a");
const agent = computed(() => getAgentById(agentId.value));

const cases = computed(() => {
  void agentId.value; // пересоздаём кейсы при смене страницы
  return casesConfig.map((c) => ({
    ...c,
    state: reactive<{ value: number | null; inputString: string }>({
      value: null,
      inputString: "",
    }),
  }));
});
</script>

<template>
  <div class="page">
    <header class="header">
      <h1 class="title">{{ agent.name }}</h1>
      <p class="desc">{{ agent.desc }}</p>
    </header>
    <section class="stories">
      <article v-for="c in cases" :key="c.id" class="story">
        <h3 class="story-title">{{ c.title }}</h3>
        <p class="story-desc">{{ c.description }}</p>
        <div class="story-demo">
          <component
            :is="agent.component"
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
