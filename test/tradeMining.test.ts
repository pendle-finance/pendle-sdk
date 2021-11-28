import { ethers } from 'ethers';
import { TradeMining } from '../src/operations/tradeMining';
import * as dotenv from 'dotenv';
dotenv.config();
jest.setTimeout(30000);

const chainId = 43114;

describe('Trade Mining', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: any;
  let tradeMining: TradeMining;
  beforeAll(async () => {
    const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;

    // const providerUrl = `http://127.0.0.1:8545`;
    provider = new ethers.providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner();
    tradeMining = new TradeMining();
  });
  it.only('getTopTraders', async () => {
    var data = await tradeMining
      .methods(signer, 43114)
      .getTopTraders({ phase: 1, house: 'Pendle', numberOfTraders: 50 });
    console.log(data.length)

    data = await tradeMining
      .methods(signer, 43114)
      .getTopTraders({ phase: 1, house: 'BenQi', numberOfTraders: 50 });

    console.log(data.length)
    data = await tradeMining
      .methods(signer, 43114)
      .getTopTraders({ phase: 1, house: 'TraderJoe', numberOfTraders: 50 });
    console.log(data.length);
  });

  it('getUserRank', async () => {
    const data = await tradeMining.methods(signer, 43114).getUserRank({
      phase: 1,
      house: 'BenQi',
      walletAddress: '0xf8865de3BEe5c84649b14F077B36A8f90eE90FeC',
    });
    console.log('getUserRank', data);
  });

  it('getUserRank wrong address', async () => {
    const data = await tradeMining.methods(signer, 43114).getUserRank({
      phase: 1,
      house: 'BenQi',
      walletAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    });

    console.log('getUserRank wrong address', data);
  });

  it('getTotalTradedVolume', async () => {
    const data = await tradeMining.methods(signer, 43114).getTotalTradedVolume({
      phase: 1,
      house: 'BenQi',
    });
    console.log('getTotalTradedVolume', data);
  });

  it('getTotalTradedVolume wrong phase/house', async () => {
    const data = await tradeMining.methods(signer, 43114).getTotalTradedVolume({
      phase: 3,
      house: 'Non-existent',
    });
    console.log('getTotalTradedVolume wrong phase/house', data);
  });
});
