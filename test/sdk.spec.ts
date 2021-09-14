import { Yt, StakingPool, PendleMarket, dummyAddress } from '../src';
// import { Market } from '../src/entities/market';
// import { assert, expect } from 'chai';
const { waffle } = require('hardhat');

const { provider } = waffle;
import { evm_revert, evm_snapshot } from './helpers/Evm';

const dummyUser = '0x82c9D29739333258f08cD3957d2a7ac7f4d53fAb'; // Mainnet test account

describe('Sdk', () => {
  // let provider: ethers.providers.JsonRpcProvider;
  let signer: any;
  let globalSnapshotId: string, snapshotId: string;

  before(async () => {
    // const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;

    // const providerUrl = `http://127.0.0.1:8545`;
    // provider = new ethers.providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner();
    globalSnapshotId = await evm_snapshot();
    snapshotId = await evm_snapshot();
  });

  after(async () => {
    await evm_revert(globalSnapshotId);
  });

  beforeEach(async () => {
    await evm_revert(snapshotId);
    snapshotId = await evm_snapshot();
  });

  it('PendleMarket.find', async () => {
    const market = await PendleMarket.find(
      '0x944d1727d0b656f497e74044ff589871c330334f'
    );
    console.log(JSON.stringify(market, null, '  '));
  });

  it('Market.methods.fetchInterests', async () => {
    const userInterests = await PendleMarket.methods(signer).fetchInterests(
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

  it('YT.find', async() => {
    const xyt: Yt = Yt.find('0xffaf22db1ff7e4983b57ca9632f796f68ededef9');
    console.log(JSON.stringify(xyt, null, '  '))
  })

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
