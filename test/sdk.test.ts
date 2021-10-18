import { Yt, Ot, StakingPool, PendleMarket, dummyAddress, Sdk, TokenAmount, ETHToken, Token } from '../src';
// import { Market } from '../src/entities/market';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { distributeConstantsByNetwork } from '../src/helpers';
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

  it.only('claim yields', async() => {
    const sdk = new Sdk(signer);
    const res = await sdk.claimYields({
      yts: [],
      ots: [],
      lps: [],
      interestStakingPools: [],
      rewardStakingPools: [StakingPool.find('0x2c09fd74e80ce12bebbc8f56fab8633ea41c2bcc', '0xb124c4e18a282143d362a066736fd60d22393ef4', 1),StakingPool.find('0x5b1c59eb6872f88a92469751a034b9b5ada9a73f', '0x944d1727d0b656f497e74044ff589871c330334f', 1)]
    });
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

  it('YT.methods.fetchInterests', async () => {
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

  it('Sdk.fetchValuations', async() => {
    const sdk = new Sdk(signer, 1);
    const valuations = await sdk.fetchValuations([new TokenAmount(
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
    )]);
    console.log(JSON.stringify(valuations, null, '  '));
  })

  it('TokenAmounts.balancesOf', async() => {
    const networkInfo = distributeConstantsByNetwork(1);
    const balances = await TokenAmount.methods(signer, 1).balancesOf({user: dummyAddress, tokens:[
      new Token(
        networkInfo.contractAddresses.tokens.USDC,
        6
      ),
      new Token(
        '0xbcca60bb61934080951369a648fb03df4f96263c',
        6
      )
    ]});
    console.log(JSON.stringify(balances, null,  '  '));
  })
});
