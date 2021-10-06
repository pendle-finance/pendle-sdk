import { Yt, StakingPool, PendleMarket, dummyAddress, contracts, Sdk } from '../src';
// import { Market } from '../src/entities/market';
import { ethers, Contract } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();
jest.setTimeout(30000);

const dummyUser = '0x186e446fbd41dD51Ea2213dB2d3ae18B05A05ba8'; // Mainnet test account

describe('Sdk', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: any;

  beforeAll(async () => {
    const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;

    // const providerUrl = `http://127.0.0.1:8545`;
    provider = new ethers.providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner();
  });

  it('claim yields', async() => {
    const sdk = new Sdk(signer);
    const res = await sdk.estimateGasForClaimYields([],[],[],[],[]);
    console.log(res);
  })

  it('fetchPendleMarketData', async () => {
    const market = PendleMarket.find(
      '0x944d1727d0b656f497e74044ff589871c330334f'
    );
    console.log(JSON.stringify(market, null, '  '));
  });

  it('Market.methods.fetchInterests', async () => {
    const userInterests = await PendleMarket.methods(signer, 1).fetchInterests(
      dummyUser
    );
    console.log(JSON.stringify(userInterests, null, '  '));
  });

  it.only('YT.methods.fetchInterests', async () => {
    const userInterests = await Yt.methods(signer, 1).fetchInterests(
      dummyUser
    );
    console.log(JSON.stringify(userInterests, null, '  '));
  });

  it('YT.find', async() => {
    const xyt: Yt = Yt.find('0xffaf22db1ff7e4983b57ca9632f796f68ededef9');
    console.log(JSON.stringify(xyt, null, '  '))
  })

  it('StakingPool.methods.fetchInterestsAndRewards', async () => {
    const lmV1Contract = new Contract("0x5b1c59eb6872f88a92469751a034b9b5ada9a73f", contracts.PendleLiquidityMiningBase.abi, provider);
    const d = await lmV1Contract.readUserSpecificExpiryData(1672272000, "0x7e733777a04b9fadf5ecd8e2bad303cabbd65cd6", {blockTag: 12648940});
    console.log(JSON.stringify(d, null, '  '));
    // const interestsAndRewards = await StakingPool.methods(
    //   signer
    // ).fetchClaimableYields(
    //   "0xa2188a2d67fb39e386def087f43b9407aabe5c0e"
    // );
    // console.log(JSON.stringify(interestsAndRewards, null, '  '));
  });

  it('StakingPool.methods.fetchAccruingRewards', async () => {
    const accruingRewards = await StakingPool.methods(
      signer
    ).fetchAccruingRewards(
      dummyAddress
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
