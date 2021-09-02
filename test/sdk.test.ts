import { Sdk, Market, Yt, StakingPool } from '../src';
// import { Market } from '../src/entities/market';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();
jest.setTimeout(30000);

// const dummyMarket = '0x8315BcBC2c5C1Ef09B71731ab3827b0808A2D6bD'; // YT-aUSDC-22 / USDC Market
// const dummyYt = '0xb7deFe73528942793649c0A950Ec528f66159047'; // YT-cDAI-22
const dummyUser = '0x82c9D29739333258f08cD3957d2a7ac7f4d53fAb'; // Mainnet test account
// const dummyLmV1Pool = '0x6f40A68E99645C60F14b497E75aE024777d61726'; // YT-aUSDC/USDC liq mining v1
// const dummyLmV2Pool = '0xFb0e378b3eD6D7F8b73230644D945E28fd7F7b03'; // OT-aUSDC-22/USDC liq mining v2

describe('Sdk', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: any;

  beforeAll(async () => {
    const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;
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
    ).fetchInterestsAndRewards(
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

  it.only('StakingPool.methods.fetchVestedRewards', async () => {
    const vestedRewards = await StakingPool.methods(signer).fetchVestedRewards(
      dummyUser
    );
    console.log(JSON.stringify(vestedRewards, null, '  '));
  });
});
