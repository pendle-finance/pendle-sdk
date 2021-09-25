import { Yt, StakingPool, PendleMarket, dummyAddress } from '../src';
// import { Market } from '../src/entities/market';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();
jest.setTimeout(3000000);

const dummyUser = '0x82c9D29739333258f08cD3957d2a7ac7f4d53fAb'; // Mainnet test account

describe('Sdk', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: any;
  let chainId: number;

  beforeAll(async () => {
    // const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;
    const providerUrl = `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`
    chainId = 42;

    // const providerUrl = `http://127.0.0.1:8545`;
    provider = new ethers.providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner();

  });

  it('fetchPendleMarketData', async () => {

    const market = await PendleMarket.find(
      '0x16d7dd5673ed2f1adaaa0feabba2271585e498cc', chainId
    );
    console.log(JSON.stringify(market, null, '  '));
  });

  it('Market.methods.fetchInterests', async () => {
    const userInterests = await PendleMarket.methods(signer, chainId).fetchInterests(
      dummyUser
    );
    console.log(JSON.stringify(userInterests, null, '  '));
  });

  it('YT.methods.fetchInterests', async () => {
    const userInterests = await Yt.methods(signer, chainId).fetchInterests(
      dummyUser
    );
    console.log(JSON.stringify(userInterests, null, '  '));
  });

  it('YT.find', async () => {
    const xyt: Yt = Yt.find('0xffaf22db1ff7e4983b57ca9632f796f68ededef9', chainId);
    console.log(JSON.stringify(xyt, null, '  '))
  })

  it('StakingPool.methods.fetchInterestsAndRewards', async () => {
    const interestsAndRewards = await StakingPool.methods(signer, chainId).fetchClaimableYields(
      dummyUser
    );
    console.log(JSON.stringify(interestsAndRewards, null, '  '));
  });

  it('StakingPool.methods.fetchAccruingRewards', async () => {
    const accruingRewards = await StakingPool.methods(signer, chainId).fetchAccruingRewards(
      dummyAddress
    );
    console.log(JSON.stringify(accruingRewards, null, '  '));
  });

  it.only('StakingPool.methods.fetchVestedRewards', async () => {
    const vestedRewards = await StakingPool.methods(signer, chainId).fetchVestedRewards(
      dummyUser
    );
    console.log(JSON.stringify(vestedRewards, null, '  '));
  });
});
