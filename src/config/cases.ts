export interface CaseProps {
  currencySymbol: string
  decimalPlaces: number
  canBeNegative: boolean
  min?: number
  max?: number
}

export interface CaseConfig {
  id: string
  title: string
  description: string
  props: CaseProps
}

export interface CaseState {
  value: number | null
  inputString: string
}

export const casesConfig: CaseConfig[] = [
  {
    id: 'basic',
    title: 'Базовый',
    description: 'Валюта $, 2 знака, без минуса',
    props: { currencySymbol: '$', decimalPlaces: 2, canBeNegative: false },
  },
  {
    id: 'minmax',
    title: 'Min / Max',
    description: 'Диапазон 0 — 10 000',
    props: {
      currencySymbol: '$',
      decimalPlaces: 2,
      canBeNegative: false,
      min: 0,
      max: 10_000,
    },
  },
  {
    id: 'negative',
    title: 'Отрицательные',
    description: 'canBeNegative = true',
    props: { currencySymbol: '$', decimalPlaces: 2, canBeNegative: true },
  },
  {
    id: 'integer',
    title: 'Только целые',
    description: 'decimalPlaces = 0',
    props: { currencySymbol: '$', decimalPlaces: 0, canBeNegative: false },
  },
  {
    id: 'currency-rub',
    title: 'Валюта ₽',
    description: 'Рубли',
    props: { currencySymbol: '₽', decimalPlaces: 2, canBeNegative: false },
  },
  {
    id: 'paste-test',
    title: 'Вставка',
    description: 'Вставьте текст вида "abc 123.45 def"',
    props: { currencySymbol: '$', decimalPlaces: 2, canBeNegative: false },
  },
]
