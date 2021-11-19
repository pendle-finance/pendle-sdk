import { BigNumber as BN } from 'ethers';
import { TokenAmount } from '../entities/tokenAmount';

const axios = require('axios');

export type GasInfo = {
  gasPrice: TokenAmount;
  gasLimit: string;
  gasCost: TokenAmount;
};

const dummyGasPrice: BN = BN.from(100).mul(BN.from(10).pow(9)); // 100 Gwei

export const etherGasStationUrl: string =
  'https://ethgasstation.info/json/ethgasAPI.json';
export const avaxGasPriceURL: string =
  'https://api.debank.com/chain/gas_price_dict_v2?chain=avax';

export async function getGasPrice(chainId: number | undefined): Promise<BN> {
  if (chainId === undefined || chainId == 1) {
    const gasPrice: BN = await axios
      .get(etherGasStationUrl)
      .then((res: any) => res.data)
      .then((data: any) => BN.from(data.average).mul(BN.from(10).pow(8)));
    return gasPrice;
  } else if (chainId == 42) {
    return dummyGasPrice;
  } else if (chainId == 43114) {
    const gasPrice: BN = await axios
      .get(avaxGasPriceURL)
      .then((res: any) => res.data)
      .then((data: any) => BN.from(data.data.normal.price));
    return gasPrice;
  } else {
    throw Error('Unsupported network in getGasPrice');
  }
}
