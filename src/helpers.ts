import { BigNumber as BN } from 'ethers';

export const decimalFactor = (decimal: number): string => {
  return BN.from(10)
    .pow(decimal)
    .toString();
};

export const getGlobalEpochId = (): number => {
  return (currentTime - launchTime) / 7 days + 1
};
