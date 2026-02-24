import { markRaw } from 'vue'
import {
  MoneyInputAssistantA,
  MoneyInputAssistantB,
  MoneyInputChatGpt,
  MoneyInputDeepSeek,
  MoneyInputDeepSeekV2,
  MoneyInputGrok,
  MoneyInputPerplexity,
  MoneyInputVueCurrency,
} from '../components/money-input'

export const agents = [
  {
    id: 'assistant-a',
    name: 'Assistant A',
    path: '/assistant-a',
    desc: 'Рекомендации: internalValue, clamp только на blur',
    component: markRaw(MoneyInputAssistantA),
  },
  {
    id: 'assistant-b',
    name: 'Assistant B',
    path: '/assistant-b',
    desc: 'escapeRegExp, clamp на blur, filterInput',
    component: markRaw(MoneyInputAssistantB),
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    path: '/chatgpt',
    desc: 'displayValue, валюта справа, validateNumber',
    component: markRaw(MoneyInputChatGpt),
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    path: '/deepseek',
    desc: 'inputmode=numeric, onKeyDown, clamp при вводе',
    component: markRaw(MoneyInputDeepSeek),
  },
  {
    id: 'deepseek-v2',
    name: 'DeepSeek V2',
    path: '/deepseek-v2',
    desc: 'Всегда форматированное значение, сохранение точки при удалении',
    component: markRaw(MoneyInputDeepSeekV2),
  },
  {
    id: 'grok',
    name: 'Grok',
    path: '/grok',
    desc: 'localInput, select() на focus, parseAndValidate',
    component: markRaw(MoneyInputGrok),
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    path: '/perplexity',
    desc: 'displayValue + rawInputValue, clamp при вводе',
    component: markRaw(MoneyInputPerplexity),
  },
  {
    id: 'vue-currency',
    name: 'Vue Currency',
    path: '/vue-currency',
    desc: 'Идея Vue-Currency-Input: формат с пробелом тысяч, суффикс валюты, distraction-free при фокусе',
    component: markRaw(MoneyInputVueCurrency),
  },
] as const

export type AgentId = (typeof agents)[number]['id']

export function getAgentById(id: string) {
  return agents.find((a) => a.id === id) ?? agents[0]
}
