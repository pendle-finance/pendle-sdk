import { OneClickWrapper, Token, EXP_2022, EXP_2023, YieldContract, forgeIdsInBytes, Action, TokenAmount, SimulationDetails, ETHToken, dummyAddress, EXP_2022JUN, EXP_WONDERLAND } from "../src";
import { NetworkInfo } from '../src/networks';

import { ethers, BigNumber as BN, utils } from 'ethers';
import * as dotenv from 'dotenv';
import { distributeConstantsByNetwork, decimalFactor } from "../src/helpers";
import { computeTradeRouteExactOut, populateJoePairs } from "../src/entities/tradeRouteProducer";

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
    signer = provider.getSigner('0x0D207520DF136bFc84c7a2932383362b8ae4fC61');
    yieldContract = new YieldContract(
      utils.parseBytes32String(forgeIdsInBytes.JOE_SIMPLE),
      new Token(
        "0x3acd2ff1c3450bc8a9765afd8d0dea8e40822c86",
        18
      ),
      EXP_2023.toNumber(),
      chainId
    );
    wrapper = new OneClickWrapper(yieldContract)
  });

  it('Simulate stake', async () => {
    const res: SimulationDetails = await wrapper.methods({signer, provider: signer.provider, chainId}).simulateDual(Action.stakeOTYT, new TokenAmount(
      new Token(
        networkInfo.contractAddresses.tokens.USDC,
        6
      ),
      BN.from(10).pow(8).toString()
    ), 0.001)
    console.log(JSON.stringify(res, null, '  '));

    // const res1:SimulationDetails = await wrapper.methods({signer, provider, chainId}).simulate(Action.stakeOT, new TokenAmount(
    //   ETHToken,
    //   BN.from(10).pow(20).toString()
    // ), 0.01)
    // console.log(JSON.stringify(res1.transactions[0], null, '  '));
    // const res2 = await wrapper.methods({signer, provider, chainId}).simulate(Action.stakeYT, new TokenAmount(
    //   ETHToken,
    //   BN.from(10).pow(20).toString()
    // ), 0.01)
    // console.log(JSON.stringify(res2.transactions[0], null, '  '));

  })

  it.only('apr', async() => {
    const res2 = await wrapper.methods({signer, provider: signer.provider, chainId}).apr(Action.stakeOTYT);
    console.log('stakeOTYT', JSON.stringify(res2, null, '  '));
  })

  it('send', async() => {
    // const sim_res: SimulationDetails = await wrapper.methods({signer, provider: signer.provider, chainId}).simulateDual(Action.stakeOTYT, new TokenAmount(
    //   new Token(
    //     networkInfo.contractAddresses.tokens.USDC,
    //     6
    //   ),
    //   BN.from(10).pow(5).toString()
    // ), 0.01)
    const sim_res: SimulationDetails = await wrapper.methods({signer, provider: signer.provider, chainId}).simulateSingle(Action.stakeOTYT, new TokenAmount(new Token(
      '0x027dbca046ca156de9622cd1e2d907d375e53aa7', 9
    ), decimalFactor(9)), 0.001);
    console.log(JSON.stringify(sim_res, null, '  '));
    const res = await wrapper.methods({signer, provider: signer.provider, chainId}).send(Action.stakeOTYT, sim_res, 0.001);
    console.log(JSON.stringify(res, null, '  '));
  })

  it('TradeRoute', async() => {
    var trade = await computeTradeRouteExactOut(
      new Token(
        '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab',
        18
      ),
      new TokenAmount(
      new Token(
        '0xfb98b335551a418cd0737375a2ea0ded62ea213b', 18
      ), decimalFactor(20)
    ));
    // var trade = await computeTradeRouteExactOut(new Token('0xfb98b335551a418cd0737375a2ea0ded62ea213b', 18), new TokenAmount(
    //   new Token(
    //     '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664', 6
    //   ), decimalFactor(10)
    // ));
    console.log(trade)
  })

  it('simulate Single', async() => {
    console.log(JSON.stringify(await wrapper.methods({signer, provider, chainId}).simulateSingle(Action.stakeOTYT, new TokenAmount(new Token(
      '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab', 18
    ), decimalFactor(18)), 0.001), null, '  '));
  })
})