import { BigNumber as BN, utils } from 'ethers';

export type CurrencyAmount = {
  currency: string,
  amount: string
}

export const dummyAddress: string = "0xDEADbeEfEEeEEEeEEEeEEeeeeeEeEEeeeeEEEEeE";

export const dummyCurrencyAmount: CurrencyAmount = {
  currency: "USD",
  amount: "10000"
}

export const forgeIds = {
  COMPOUND: utils.formatBytes32String('CompoundV2'),
  COMPOUND_UPGRADED: utils.formatBytes32String('CompoundV2Upgraded'),
  AAVE: utils.formatBytes32String('AaveV2'),
  SUSHISWAP_SIMPLE: utils.formatBytes32String('SushiswapSimple'),
  SUSHISWAP_COMPLEX: utils.formatBytes32String('SushiswapComplex'),
};

export const marketFactoryIds = {
  COMPOUND: utils.formatBytes32String('Compound'),
  AAVE: utils.formatBytes32String('Aave'),
  GENERIC: utils.formatBytes32String('Generic'),
};

export const RONE = BN.from(2).pow(40);
export const ZERO = BN.from(0);
export const INF = BN.from(2)
  .pow(256)
  .sub(1);
export const EXP_2022 = BN.from("1672272000");
export const EXP_2021 = BN.from("1640822400");
export const LMStartTime = BN.from("1623888000");
export const LMEpochDuration = BN.from("604800");
export const VestingEpoches = 5;

export const decimalsRecords: Record<string, Record<string, number>> = {
  mainnet: {
    "0x808507121b80c02388fad14726482e061b8da827": 18, // PENDLE
    "0xbcca60bb61934080951369a648fb03df4f96263c": 6, // aUSDC
    "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643": 8, // cDAI
    "0x397ff1542f962076d0bfe58ea045ffa2d347aca0": 18, // SLP
    "0x37922c69b08babcceae735a31235c81f1d1e8e43": 18, // SLP
    "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2": 18, // SUSHI
    "0x685d32f394a5f03e78a1a0f6a91b4e2bf6f52cfe": 18,
    "0x79c05da47dc20ff9376b2f7dbf8ae0c994c3a0d0": 18,
    "0x9e382e5f78b06631e4109b5d48151f2b3f326df0": 18,
    "0x8315bcbc2c5c1ef09b71731ab3827b0808a2d6bd": 18,
    "0x944d1727d0b656f497e74044ff589871c330334f": 18,
    "0xb26c86330fc7f97533051f2f8cd0a90c2e82b5ee": 18,
    "0xb124c4e18a282143d362a066736fd60d22393ef4": 18,
    "0x72972b21ce425cfd67935e07c68e84300ce3f40f": 18,
    "0x8b758d7fd0fc58fca8caa5e53af2c7da5f5f8de1": 18,
    "0x0d8a21f2ea15269b7470c347083ee1f85e6a723b": 18,
    "0x2c80d72af9ab0bb9d98f607c817c6f512dd647e6": 18,
    "0x4556c4488cc16d5e9552cc1a99a529c1392e4fe9": 18,
    "0xffaf22db1ff7e4983b57ca9632f796f68ededef9": 6,
    "0xcdb5b940e95c8632decdc806b90dd3fc44e699fe": 6,
    "0x31654eb46a3a450265c6dfc4fc4fbbfe371e26fe": 8,
    "0xb7defe73528942793649c0a950ec528f66159047": 8,
    "0x311fcb5db45a3a5876975f8108237f20525fa7e0": 18,
    "0x49c8ac20de6409c7e0b8f9867cffd1481d8206c6": 18
  }
};
