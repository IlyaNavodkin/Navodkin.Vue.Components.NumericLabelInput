export interface MoneyInputProps {
  value: number | null
  inputString: string
  currencySymbol: string
  decimalPlaces: number
  canBeNegative: boolean
  max?: number
  min?: number
  step?: number
}

export interface MoneyInputEmits {
  (e: 'update:value', value: number | null): void
  (e: 'update:inputString', value: string): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
}
