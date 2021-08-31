import { BigNumber as BN } from 'ethers';

export const decimalFactor = (decimal: number): string => {
  return BN.from(10)
    .pow(decimal)
    .toString();
};
