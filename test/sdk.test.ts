import { Sdk } from '../src';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();
jest.setTimeout(30000);

describe('Sdk', () => {
  it('fetchPendleMarketData', async () => {
    const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;
    // TODO
    const provider = new ethers.providers.JsonRpcSigner(providerUrl,);

    const sdk = new Sdk(provider);

    const market = await sdk.fetchPendleMarketData(
      '0x944d1727d0b656f497e74044ff589871c330334f'
    );
    console.log(JSON.stringify(market, null, '  '));
  });
});
