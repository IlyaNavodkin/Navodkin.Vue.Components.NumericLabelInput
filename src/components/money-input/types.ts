import type { IntlConfig as BaseIntlConfig } from "./utils/getLocaleConfig";

export type { IntlConfig as BaseIntlConfig } from "./utils/getLocaleConfig";
export type { CleanValueOptions } from "./utils/cleanValue";
export type { FormatValueOptions } from "./utils/formatValue";

export type IntlConfig = BaseIntlConfig;

export interface CurrencyInputValues {
  float: number | null;
  formatted: string;
  value: string;
}

export interface CurrencyInputProps {
  value?: string;
  intlConfig?: IntlConfig;
  prefix?: string;
  suffix?: string;
  decimalSeparator?: string;
  groupSeparator?: string;
  allowDecimals?: boolean;
  decimalsLimit?: number;
  decimalScale?: number;
  fixedDecimalLength?: number;
  allowNegativeValue?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  step?: number;
  disableGroupSeparators?: boolean;
  disableAbbreviations?: boolean;
  formatValueOnBlur?: boolean;
  transformRawValue?: (rawValue: string) => string;
}

export interface CurrencyInputEmits {
  (e: "update:value", values: CurrencyInputValues): void;
  (e: "update:modelValue", value: string): void;
  (e: "inputvalue", values: CurrencyInputValues): void;
  (e: "changevalue", values: CurrencyInputValues): void;
  (e: "blur", event: FocusEvent): void;
  (e: "focus", event: FocusEvent): void;
  (e: "input", event: Event): void;
}

export interface MoneyInputSvelteCurrencyProps {
  class?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  autocomplete?: string;
  autofocus?: boolean;
  value?: string;
  intlConfig?: IntlConfig;
  prefix?: string;
  suffix?: string;
  decimalSeparator?: string;
  groupSeparator?: string;
  allowDecimals?: boolean;
  decimalsLimit?: number;
  decimalScale?: number;
  fixedDecimalLength?: number;
  allowNegativeValue?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  step?: number;
  disableGroupSeparators?: boolean;
  disableAbbreviations?: boolean;
  formatValueOnBlur?: boolean;
  transformRawValue?: (rawValue: string) => string;
}

export type MoneyInputSvelteCurrencyEmits = CurrencyInputEmits;
