import { OneClickWrapper, Token, EXP_2022, EXP_2021, YieldContract, forgeIdsInBytes, Action, TokenAmount } from "../src";
import { NetworkInfo } from '../src/networks';

import { ethers, BigNumber as BN, utils } from 'ethers';
import * as dotenv from 'dotenv';
import { distributeConstantsByNetwork } from "../src/helpers";

dotenv.config();
jest.setTimeout(30000);

const chainId: number = 1;
const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);


const DAIToken: Token = new Token(
  '0x6b175474e89094c44da98b954eedeac495271d0f',
  18,
);
const cDAIToken: Token = new Token(
  chainId == 1 ? '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643' : '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad',
  8
)
const OTcDAIToken: Token = new Token(
  '0x3d4e7f52efafb9e0c70179b688fc3965a75bcfea',
  8,
  EXP_2022.toNumber()
)
const USDCToken: Token = new Token(
  networkInfo.contractAddresses.tokens.USDC,
  6
);
const OTaUSDCToken: Token = new Token(
  '0x010a0288af52ed61e32674d82bbc7ddbfa9a1324',
  6,
  EXP_2022.toNumber()
)
const PENDLEETHSLPToken: Token = new Token(
  '0x37922c69b08babcceae735a31235c81f1d1e8e43',
  18
)
const OTPEToken: Token = new Token(
  '0xbf682bd31a615123d28d611b38b0ae3d2b675c2c',
  18,
  EXP_2022.toNumber()
)
const ETHUSDCSLPToken: Token = new Token(
  '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
  18
)
const aUSDCToken: Token = new Token(
  '0xbcca60bb61934080951369a648fb03df4f96263c',
  6
)
const PENDLE: Token = new Token(
  networkInfo.contractAddresses.tokens.PENDLE,
  18
)
const Tokens = { DAIToken, USDCToken, PENDLEETHSLPToken, ETHUSDCSLPToken, OTPEToken, OTaUSDCToken, OTcDAIToken, cDAIToken, aUSDCToken, PENDLE }
describe("One click wrapper", () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: any;
  let yieldContract: YieldContract;
  let wrapper: OneClickWrapper;

  beforeAll(async () => {
    const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}` : `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`;

    // const providerUrl = `http://127.0.0.1:8545`;
    provider = new ethers.providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner();
    yieldContract = new YieldContract(
      utils.parseBytes32String(forgeIdsInBytes.SUSHISWAP_SIMPLE),
      Tokens.PENDLEETHSLPToken,
      EXP_2022.toNumber()
    );
    wrapper = new OneClickWrapper(yieldContract)
  });

  it('Simulate stake OT', async () => {
    console.log("IN")
    const res = await wrapper.methods(signer, chainId).simulate(Action.stakeOTYT, new TokenAmount(
      Tokens.PENDLE,
      BN.from(10).pow(24).toString()
    ), 0.01)
    console.log(JSON.stringify(res, null, '  '));
  })
})