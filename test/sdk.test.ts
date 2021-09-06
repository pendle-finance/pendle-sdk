import { Sdk, Market, Yt, StakingPool } from '../src';
// import { Market } from '../src/entities/market';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();
jest.setTimeout(30000);

const dummyUser = '0x82c9D29739333258f08cD3957d2a7ac7f4d53fAb'; // Mainnet test account

describe('Sdk', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: any;

  beforeAll(async () => {
    const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;

    // const providerUrl = `http://127.0.0.1:8545`;
    provider = new ethers.providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner();
  });

  it('fetchPendleMarketData', async () => {
    const sdk = new Sdk(provider);
    const market = await sdk.fetchPendleMarketData(
      '0x944d1727d0b656f497e74044ff589871c330334f'
    );
    console.log(JSON.stringify(market, null, '  '));
  });

  it('Market.methods.fetchInterests', async () => {

    const userInterests = await Market.methods(signer).fetchInterests(
      dummyUser
    );
    console.log(JSON.stringify(userInterests, null, '  '));
  });

  it('YT.methods.fetchInterests', async () => {
    const userInterests = await Yt.methods(signer).fetchInterests(
      dummyUser
    );
    console.log(JSON.stringify(userInterests, null, '  '));
  });

  it('StakingPool.methods.fetchInterestsAndRewards', async () => {
    const interestsAndRewards = await StakingPool.methods(
      signer
    ).fetchClaimableYields(
      dummyUser
    );
    console.log(JSON.stringify(interestsAndRewards, null, '  '));
  });

  it('StakingPool.methods.fetchAccruingRewards', async () => {
    const accruingRewards = await StakingPool.methods(
      signer
    ).fetchAccruingRewards(
      dummyUser
    );
    console.log(JSON.stringify(accruingRewards, null, '  '));
  });

  it('StakingPool.methods.fetchVestedRewards', async () => {
    const vestedRewards = await StakingPool.methods(signer).fetchVestedRewards(
      dummyUser
    );
    console.log(JSON.stringify(vestedRewards, null, '  '));
  });
});
