import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/assistant-a' },
    {
      path: '/assistant-a',
      name: 'AssistantA',
      component: () => import('../views/AgentPageView.vue'),
      meta: { agentId: 'assistant-a' },
    },
    {
      path: '/assistant-b',
      name: 'AssistantB',
      component: () => import('../views/AssistantBPage.vue'),
    },
    {
      path: '/chatgpt',
      name: 'ChatGPT',
      component: () => import('../views/AgentPageView.vue'),
      meta: { agentId: 'chatgpt' },
    },
    {
      path: '/deepseek',
      name: 'DeepSeek',
      component: () => import('../views/AgentPageView.vue'),
      meta: { agentId: 'deepseek' },
    },
    {
      path: '/deepseek-v2',
      name: 'DeepSeekV2',
      component: () => import('../views/AgentPageView.vue'),
      meta: { agentId: 'deepseek-v2' },
    },
    {
      path: '/grok',
      name: 'Grok',
      component: () => import('../views/AgentPageView.vue'),
      meta: { agentId: 'grok' },
    },
    {
      path: '/perplexity',
      name: 'Perplexity',
      component: () => import('../views/AgentPageView.vue'),
      meta: { agentId: 'perplexity' },
    },
    {
      path: '/vue-currency',
      name: 'VueCurrency',
      component: () => import('../views/AgentPageView.vue'),
      meta: { agentId: 'vue-currency' },
    },
    {
      path: '/react-example',
      name: 'ReactExample',
      component: () => import('../views/MoneyInputReactExample.vue'),
    },
    {
      path: '/svelte-currency',
      name: 'SvelteCurrency',
      component: () => import('../views/MoneyInputSvelteCurrencyExample.vue'),
    },
  ],
})

export default router
