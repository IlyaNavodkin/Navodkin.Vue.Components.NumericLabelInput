import { escapeRegExp } from './escapeRegExp';

export interface GetSuffixOptions {
  decimalSeparator?: string;
  groupSeparator?: string;
}

export const getSuffix = (
  value: string,
  { groupSeparator = ',', decimalSeparator = '.' }: GetSuffixOptions
): string | undefined => {
  const suffixReg = new RegExp(
    `\\d([^${escapeRegExp(groupSeparator)}${escapeRegExp(decimalSeparator)}0-9]+)`
  );
  const suffixMatch = value.match(suffixReg);
  return suffixMatch ? suffixMatch[1] : undefined;
};
