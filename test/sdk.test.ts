import { Yt, Ot, StakingPool, PendleMarket, dummyAddress, contracts, Sdk } from '../src';
// import { Market } from '../src/entities/market';
import { ethers, Contract } from 'ethers';
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

  it.skip('claim yields', async() => {
    const sdk = new Sdk(signer);
    const res = await sdk.estimateGasForClaimYields([],[],[],[],[]);
    console.log(res);
  })

  it.skip('fetchPendleMarketData', async () => {
    const market = PendleMarket.find(
      '0x944d1727d0b656f497e74044ff589871c330334f'
    );
    console.log(JSON.stringify(market, null, '  '));
  });

  it.skip('Market.methods.fetchInterests', async () => {
    const userInterests = await PendleMarket.methods(signer, 1).fetchInterests(
      dummyUser
    );
    console.log(JSON.stringify(userInterests, null, '  '));
  });

  it.only('YT.methods.fetchInterests', async () => {
    const userInterests = await Yt.methods(signer, 1).fetchInterests(
      '0xea5ed53ec1244a1baf72086c6f5726b1dd913fdc'
    );
    console.log(JSON.stringify(userInterests, null, '  '));
  });

  it('OT.methods.fetchRewards', async() => {
    const userRewards = await Ot.methods(signer, 1).fetchRewards(
      '0xea5ed53ec1244a1baf72086c6f5726b1dd913fdc'
    );
    console.log(JSON.stringify(userRewards, null, '  '));
  })

  it.skip('YT.find', async() => {
    const xyt: Yt = Yt.find('0xffaf22db1ff7e4983b57ca9632f796f68ededef9');
    console.log(JSON.stringify(xyt, null, '  '))
  })

  it('StakingPool.methods.fetchInterestsAndRewards', async () => {
    const interestsAndRewards = await StakingPool.methods(
      signer
    ).fetchClaimableYields(
      dummyAddress
    );
    console.log(JSON.stringify(interestsAndRewards, null, '  '));
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
