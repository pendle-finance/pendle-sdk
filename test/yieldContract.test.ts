import { dummyTokenAmount, EXP_2022, EXP_2023, Token, TokenAmount, YieldContract, forgeIdsInBytes, contracts, dummyAddress, EXP_REDACTED } from '../src';
// import { Market } from '../src/entities/market';
import { ethers, BigNumber as BN, Contract, utils } from 'ethers';
import * as dotenv from 'dotenv';
import { NetworkInfo } from '../src/networks';
import { distributeConstantsByNetwork } from '../src/helpers';
dotenv.config();
jest.setTimeout(30000);

const chainId: number = 1;

// const dummyUser = '0x186e446fbd41dD51Ea2213dB2d3ae18B05A05ba8'; // local alice account

// const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);

// const DAIToken: Token = new Token(
//   '0x6b175474e89094c44da98b954eedeac495271d0f',
//   18,
// );
// const cDAIToken: Token = new Token(
//   chainId == 1 ? '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643' : '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad',
//   8
// )
// const OTcDAIToken: Token = new Token(
//   '0x3d4e7f52efafb9e0c70179b688fc3965a75bcfea',
//   8,
//   EXP_2022.toNumber()
// )
// const USDCToken: Token = new Token(
//   networkInfo.contractAddresses.tokens.USDC,
//   6
// );
// const OTaUSDCToken: Token = new Token(
//   '0x010a0288af52ed61e32674d82bbc7ddbfa9a1324',
//   6,
//   EXP_2022.toNumber()
// )
// const PENDLEETHSLPToken: Token = new Token(
//   '0x37922c69b08babcceae735a31235c81f1d1e8e43',
//   18
// )
// const OTPEToken: Token = new Token(
//   '0xbf682bd31a615123d28d611b38b0ae3d2b675c2c',
//   18,
//   EXP_2022.toNumber()
// )
// const ETHUSDCSLPToken: Token = new Token(
//   '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
//   18
// )
// const aUSDCToken: Token = new Token(
//   '0xbcca60bb61934080951369a648fb03df4f96263c',
//   6
// )
// const Tokens = { DAIToken, USDCToken, PENDLEETHSLPToken, ETHUSDCSLPToken, OTPEToken, OTaUSDCToken, OTcDAIToken, cDAIToken, aUSDCToken }

const USDCToken = new Token (
  '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
  6
)
const bUSDCToken = new Token(
  '0x76145e99d3f4165a313e8219141ae0d26900b710',
  6
)

const OTqiUSDCToken = new Token('0xfffe5fc3e511ce11df20684aec435a3e2b7d8136', 6)
const Tokens = {USDCToken, bUSDCToken, OTqiUSDCToken}

describe("Yiled Contract", () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: any;
  let yContract: YieldContract;

  beforeAll(async () => {
    const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}` 
                      : chainId == 42 ? `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`
                      : `https://api.avax.network/ext/bc/C/rpc`;

    // const providerUrl = `http://127.0.0.1:8545`;
    provider = new ethers.providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner();
    yContract = new YieldContract(
      utils.parseBytes32String(forgeIdsInBytes.REDACTED),
      new Token(
        "0xCC94Faf235cC5D3Bf4bEd3a30db5984306c86aBC", 9
      ),
      EXP_REDACTED.toNumber(),
      chainId
    );
  });

  it.only('yieldContract.mintDetails', async () => {
    const response = await yContract.methods({signer, provider, chainId}).mintDetails(new TokenAmount(
      new Token(
        "0x4B16d95dDF1AE4Fe8227ed7B7E80CF13275e61c9", 18
      ),
      BN.from(10).pow(18).toString()
    ));
    console.log(response);
  })

  // it('yieldContract.mint', async () => {
  //   const cDAIContract = new Contract(Tokens.cDAIToken.address, contracts.IERC20.abi, provider);
  //   await cDAIContract.connect(signer).approve(networkInfo.contractAddresses.misc.PendleRouter, BN.from(10).pow(40));
  //   const response = await yContract.methods({signer, provider, chainId}).mint(new TokenAmount(
  //     Tokens.cDAIToken,
  //     BN.from(10).pow(12).toString()
  //   ));
  //   console.log(response);
  // })

  it('yieldContract.redeemDetails', async () => {
    const response = await yContract.methods({signer, provider, chainId}).redeemDetails(new TokenAmount(
      Tokens.OTqiUSDCToken,
      BN.from(10).pow(8).toString()
    ), dummyAddress);
    console.log(response);
  })

  // it.skip('yieldContract.redeem', async () => {
  //   const response = await yContract.methods({signer, provider, chainId}).redeem(dummyTokenAmount);
  //   console.log(response);
  // })
})
