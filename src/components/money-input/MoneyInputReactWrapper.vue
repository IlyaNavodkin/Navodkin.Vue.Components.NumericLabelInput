<template>
  <MoneyInputReact
    :value="value ?? undefined"
    :prefix="currencySymbol"
    :decimals-limit="decimalPlaces"
    :allow-negative-value="canBeNegative"
    :min="min"
    :max="max"
    :allow-decimals="decimalPlaces > 0"
    :on-value-change="handleValueChange"
  />
</template>

<script setup lang="ts">
import MoneyInputReact from "./MoneyInputReact.vue";
import type { CurrencyInputOnChangeValues } from "../../utils/currencyInputUtils";

interface Props {
  value: number | null;
  inputString: string;
  currencySymbol: string;
  decimalPlaces: number;
  canBeNegative: boolean;
  min?: number;
  max?: number;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "update:value", value: number | null): void;
  (e: "update:inputString", value: string): void;
}>();

function handleValueChange(
  _value: string | undefined,
  _name?: string,
  values?: CurrencyInputOnChangeValues
) {
  if (values) {
    emit("update:value", values.float ?? null);
    emit("update:inputString", values.formatted ?? "");
  }
}
</script>
