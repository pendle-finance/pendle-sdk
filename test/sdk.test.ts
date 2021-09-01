import { Sdk, Market } from '../src';
// import { Market } from '../src/entities/market';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();
jest.setTimeout(30000);

describe('Sdk', () => {
  it('fetchPendleMarketData', async () => {
    const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;
    // TODO
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);

    const sdk = new Sdk(provider);

    const market = await sdk.fetchPendleMarketData(
      '0x944d1727d0b656f497e74044ff589871c330334f'
    );
    console.log(JSON.stringify(market, null, '  '));
  });

  it('fetchDummyBalance', async () => {
    const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);

    const signer = provider.getSigner("0xaaa3b992d4aef1de4c281e4df67bfc753d9e4bd7");
    // const market = new Market("0x8315BcBC2c5C1Ef09B71731ab3827b0808A2D6bD", [
    //   new Token("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", 18),
    //   new Token("0xcDb5b940E95C8632dEcDc806B90dD3fC44E699fE", 18)
    // ])
    const userInterests = await Market.contract(signer).fetchInterests(["0x8315BcBC2c5C1Ef09B71731ab3827b0808A2D6bD"], "0xf8f26686f1275e5aa23a82c29079c68d3de4d3b4");
    console.log(JSON.stringify(userInterests, null, '  '));
  });
});
