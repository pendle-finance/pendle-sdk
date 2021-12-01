import { BigNumber as BN } from 'ethers';

export function amountToWei(amount: BN, decimal: number) {
  return BN.from(10)
    .pow(decimal)
    .mul(amount);
}
