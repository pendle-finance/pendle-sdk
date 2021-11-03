import { OneClickWrapper, Token, EXP_2022, YieldContract, forgeIdsInBytes, Action, TokenAmount, SimulationDetails } from "../src";
import { NetworkInfo } from '../src/networks';

import { ethers, BigNumber as BN, utils } from 'ethers';
import * as dotenv from 'dotenv';
import { distributeConstantsByNetwork } from "../src/helpers";

dotenv.config();
jest.setTimeout(300000);

const chainId: number = 43114;
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
const WETH: Token = new Token(
  networkInfo.contractAddresses.tokens.WETH,
  18
)
const Tokens = { DAIToken, USDCToken, PENDLEETHSLPToken, ETHUSDCSLPToken, OTPEToken, OTaUSDCToken, OTcDAIToken, cDAIToken, aUSDCToken, PENDLE, WETH }
describe("One click wrapper", () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: any;
  let yieldContract: YieldContract;
  let wrapper: OneClickWrapper;

  beforeAll(async () => {
    const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}` : `https://api.avax.network/ext/bc/C/rpc`;

    // const providerUrl = `http://127.0.0.1:8545`;
    provider = new ethers.providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner();
    yieldContract = new YieldContract(
      utils.parseBytes32String(forgeIdsInBytes.JOE_COMPLEX),
      new Token(
        '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
        18
      ),
      EXP_2022.toNumber()
    );
    wrapper = new OneClickWrapper(yieldContract)
  });

  it('Simulate stake OT', async () => {
    console.log("IN")
    const res = await wrapper.methods(signer, chainId).simulate(Action.stakeOTYT, new TokenAmount(
      Tokens.WETH,
      BN.from(10).pow(20).toString()
    ), 0.01)
    console.log(JSON.stringify(res, null, '  '));
  })

  it.only('apr', async() => {
    const res = await wrapper.methods(signer, chainId).apr(Action.stakeOT);
    console.log(JSON.stringify(res, null, '  '));
  })

  it('send', async() => {
    const sim_res: SimulationDetails = await wrapper.methods(signer, chainId).simulate(Action.stakeOTYT, new TokenAmount(
      Tokens.WETH,
      BN.from(10).pow(20).toString()
    ), 0.01)
    const res = await wrapper.methods(signer, chainId).send(Action.stakeOTYT, sim_res.transactions, 0.01);
    console.log(JSON.stringify(res, null, '  '));
  })
})