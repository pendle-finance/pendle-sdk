import { RedeemProxy } from '../src/entities/redeemProxy';
import { Token } from '../src/entities/token';
import { ethers } from 'ethers';
import { LMINFO, NetworkInfo } from '../src/networks';
import { distributeConstantsByNetwork } from '../src/helpers';
import { dummyAddress, StakingPool } from '../src';
import * as dotenv from 'dotenv';
dotenv.config();

var chainId = 43114;
jest.setTimeout(30000);

describe('Redeem Proxy', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: ethers.providers.JsonRpcSigner;
  let networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);

  beforeAll(async () => {
    const providerUrl =
      chainId == 1
        ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`
        : chainId == 42
        ? `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`
        : `https://api.avax.network/ext/bc/C/rpc`;
    // const providerUrl = `http://127.0.0.1:8545`;
    provider = new ethers.providers.JsonRpcProvider(providerUrl);

    signer = provider.getSigner("0xe1d900c75fd48913c1d092fa0e4c3d7430de7f1b");
    console.log(await signer.getAddress())
  });

  it('redeemLmV2Interests', async () => {
    const lmAddresses: string[] = networkInfo.contractAddresses.stakingPools
      .filter((s: LMINFO) => StakingPool.isLmV2ByType(s.contractType))
      .map((s: LMINFO) => s.address);
    const res = await RedeemProxy.methods({
      signer,
      provider,
      chainId,
    }).callStatic.redeemLmV2Interests(lmAddresses, dummyAddress);
    console.log(JSON.stringify(res, null, '  '));
  });

  it('redeemTokenDist', async () => {
    const res = await RedeemProxy.methods({
      signer,
      provider,
      chainId,
    }).callStatic.redeemTokenDist(
      [
        '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
        '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5',
      ],
      '0x0D207520DF136bFc84c7a2932383362b8ae4fC61'
    );
    console.log(JSON.stringify(res, null, '  '));
  });

  it.only('binary search gas', async () => {
    const YTStakingPool = StakingPool.find(
      '0x9ada5ce16cdbd76afdd28b891cd0a1a9f659dad6',
      '0x11b9346eefa301e278f246d857c0a6edfbf97fb4',
      chainId
    );
    const OTStakingPool = StakingPool.find(
      '0x2aa0bec34deeb6987c118ce353d14eea6def24ce',
      '0x588dc0dd7c8be073e9da79307e023f1f756f06c6',
      chainId
    );
    const res = await RedeemProxy.methods({
      signer,
      provider,
      chainId,
    }).estimateGasForClaimYields({
      yts: [],
      ots: [],
      lps: [],
      rewardStakingPools: [StakingPool.find("0x2aa0bec34deeb6987c118ce353d14eea6def24ce", "0x588dc0dd7c8be073e9da79307e023f1f756f06c6", chainId)],
      interestStakingPools: [],
      tokensToDistribute: [],
    });
    console.log(res);
  });

  it('construct args for redeem', async () => {
    const YTStakingPool = StakingPool.find(
      '0x9ada5ce16cdbd76afdd28b891cd0a1a9f659dad6',
      '0x11b9346eefa301e278f246d857c0a6edfbf97fb4',
      chainId
    );
    const OTStakingPool = StakingPool.find(
      '0x2aa0bec34deeb6987c118ce353d14eea6def24ce',
      '0x588dc0dd7c8be073e9da79307e023f1f756f06c6',
      chainId
    );
    console.log(
      await RedeemProxy.methods({ signer, provider, chainId }).claimYields({
        yts: [],
        ots: [new Token("0x7d1e8650abd5f8363d63dc7ab838cec8c726dd38", 18)],
        lps: [],
        rewardStakingPools: [],
        interestStakingPools: [
            StakingPool.find('0x204e698a71bb1973823517c74be041a985eaa46e', '0xd5736ba0be93c99a10e2264e8e4ebd54633306f8', chainId)
        ],
        tokensToDistribute: [],
      })
    );
  });
});
