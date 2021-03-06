import { Yt, Ot, StakingPool, PendleMarket, dummyAddress, Sdk, TokenAmount, ETHToken, Token, contracts, avalancheContracts } from '../src';
// import { Market } from '../src/entities/market';
import { Contract, ethers, providers } from 'ethers';
import * as dotenv from 'dotenv';
import { distributeConstantsByNetwork, binarySearchGas } from '../src/helpers';
import { getDecimals } from '../src/networks/helpers/getDecimals';

var chainId = 43114;

dotenv.config();
jest.setTimeout(300000);

const dummyUser = '0x82c9D29739333258f08cD3957d2a7ac7f4d53fAb'; // Mainnet test account

describe('Sdk', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: any;

  beforeAll(async () => {
    const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}` : `https://api.avax.network/ext/bc/C/rpc`;

    // const providerUrl = `http://127.0.0.1:8545`;
    provider = new ethers.providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner('0x82c9D29739333258f08cD3957d2a7ac7f4d53fAb');
  });

  it.skip('claim yields', async () => {
    const sdk = new Sdk({signer, provider, chainId});
    console.log("estimate")
    const res = await sdk.claimYields({
      yts: [],
      ots: [],
      lps: [],
      interestStakingPools: [],
      rewardStakingPools: [StakingPool.find("0x5b1c59eb6872f88a92469751a034b9b5ada9a73f", "0xb26c86330fc7f97533051f2f8cd0a90c2e82b5ee", chainId)]
    });
    console.log(res);
  })

  it('Market.methods.fetchInterests', async () => {
    const userInterests = await PendleMarket.methods({signer, provider, chainId}).fetchInterests(
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    );
    console.log(JSON.stringify(userInterests, null, '  '));
  });

  it('YT.methods.fetchInterests', async () => {
    const userInterests = await Yt.methods({signer, provider, chainId}).fetchInterests(
      '0xf8865de3BEe5c84649b14F077B36A8f90eE90FeC'
    );
    console.log(JSON.stringify(userInterests, null, '  '));
  });

  it('OT.methods.fetchRewards', async () => {
    const userRewards = await Ot.methods({signer, provider, chainId}).fetchRewards(
      '0xf8865de3BEe5c84649b14F077B36A8f90eE90FeC'
    );
    console.log(JSON.stringify(userRewards, null, '  '));
  })

  it.skip('YT.find', async () => {
    const xyt: Yt = Yt.find('0xffaf22db1ff7e4983b57ca9632f796f68ededef9');
    console.log(JSON.stringify(xyt, null, '  '))
  })

  it.only('StakingPool.methods.fetchInterestsAndRewards', async () => {
    const interestsAndRewards = await StakingPool.methods({signer, provider, chainId}).fetchClaimableYields(
      "0x2C4E1E7251470D5731Dc7c6290bEFbAcf91c1F80"
    );
    console.log(JSON.stringify(interestsAndRewards, null, '  '));
  });

  it('StakingPool.methods.fetchAccruingRewards', async () => {
    const accruingRewards = await StakingPool.methods({signer, provider, chainId}).fetchAccruingRewards(
      '0x186e446fbd41dD51Ea2213dB2d3ae18B05A05ba8'
      // dummyUser
    );
    console.log(JSON.stringify(accruingRewards, null, '  '));
  });

  it('StakingPool.methods.fetchVestedRewards', async () => {
    const vestedRewards = await StakingPool.methods({signer, provider, chainId}).fetchVestedRewards(
      dummyUser
    );
    console.log(JSON.stringify(vestedRewards, null, '  '));
  });

  it.skip('Sdk.fetchValuations', async () => {
    const sdk = new Sdk({signer, provider, chainId});
    const valuations = await sdk.fetchValuations([
    new TokenAmount(
      ETHToken,
      "100000000000000000"
    ),
    new TokenAmount(
      new Token(
        '0x37922c69b08babcceae735a31235c81f1d1e8e43',
        18
      ),
      "1000000000000000000"
    ),
    new TokenAmount(
      new Token(
        '0x49c8ac20de6409c7e0b8f9867cffd1481d8206c6',
        18
      ),
      "1000000000000000000"
    ),
    new TokenAmount(
      new Token(
        '0xbf682bd31a615123d28d611b38b0ae3d2b675c2c',
        18
      ),
      "1000000000000000000"
    )], chainId);
    console.log(JSON.stringify(valuations, null, '  '));
  })

  it('TokenAmounts.balancesOf', async () => {
    const networkInfo = distributeConstantsByNetwork(chainId);
    const balances = await TokenAmount.methods({signer, provider, chainId}).balancesOf({
      user: "0xed2a7edd7413021d440b09d654f3b87712abab66", tokens: [
        new Token(
          networkInfo.contractAddresses.tokens.USDC,
          6
        ),
        new Token(
          '0xd586e7f844cea2f87f50152665bcbc2c279d8d70',
          18
        ),
        new Token(
          '0x63a72806098bd3d9520cc43356dd78afe5d386d9',
          18
        ),
        new Token(
          '0xc7198437980c041c805a1edcba50c1ce5db95118',
          6
        )
      ]
    });
    console.log(JSON.stringify(balances, null, '  '));
  })

});
