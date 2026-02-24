<script setup lang="ts">
import { RouterView } from 'vue-router'
import { agents } from './config/agents'
</script>

<template>
  <div class="app">
    <aside class="sidebar">
      <h2 class="sidebar-title">Реализации</h2>
      <nav class="nav">
        <RouterLink
          v-for="agent in agents"
          :key="agent.id"
          :to="agent.path"
          class="nav-link"
          active-class="active"
        >
          {{ agent.name }}
        </RouterLink>
      </nav>
    </aside>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.app {
  display: flex;
  min-height: 100vh;
  background: #1a1b1e;
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

.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-link {
  margin: 0 0.5rem;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.9rem;
  color: #c4c4c8;
  text-decoration: none;
  border-radius: 6px;
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
  overflow: auto;
}
</style>
