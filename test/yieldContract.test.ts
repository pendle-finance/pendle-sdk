import { dummyTokenAmount, EXP_2022, Token, TokenAmount, YieldContract } from '../src';
// import { Market } from '../src/entities/market';
import { ethers, BigNumber as BN } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();
jest.setTimeout(30000);

const dummyUser = '0x186e446fbd41dd51ea2213db2d3ae18b05a05ba8'; // local alice account
const DAIToken: Token = new Token(
  '0x6b175474e89094c44da98b954eedeac495271d0f',
  8,
);
const USDCToken: Token = new Token(
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  6
)
const PENDLEETHSLPToken: Token = new Token(
  '0x37922c69b08babcceae735a31235c81f1d1e8e43',
  18
)
const ETHUSDCSLPToken: Token = new Token(
  '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
  18
)
const Tokens = { DAIToken, USDCToken, PENDLEETHSLPToken, ETHUSDCSLPToken }


describe("Yiled Contract", () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: any;
  let yContract: YieldContract;

  beforeAll(async () => {
    const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;

    // const providerUrl = `http://127.0.0.1:8545`;
    provider = new ethers.providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner();
    yContract = new YieldContract(
      'SushiswapComplex',
      Tokens.ETHUSDCSLPToken,
      EXP_2022.toNumber()
    );
  });

  it.only('yieldContract.mintDetails', async () => {
    const response = await yContract.methods(signer).mintDetails(new TokenAmount(
      Tokens.ETHUSDCSLPToken,
      BN.from(10).pow(15).toString()
    ));
    console.log(response);
  })

  it('yieldContract.mint', async () => {
    const response = await yContract.methods(signer).mint(dummyTokenAmount);
    console.log(response);
  })

  it('yieldContract.redeemDetails', async () => {
    const response = await yContract.methods(signer).redeemDetails(dummyTokenAmount, dummyUser);
    console.log(response);
  })

  it('yieldContract.redeem', async () => {
    const response = await yContract.methods(signer).redeem(dummyTokenAmount);
    console.log(response);
  })
})
