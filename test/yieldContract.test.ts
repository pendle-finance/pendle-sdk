import { dummyTokenAmount, EXP_2022, EXP_2021, Token, TokenAmount, YieldContract, forgeIdsInBytes, contracts } from '../src';
// import { Market } from '../src/entities/market';
import { ethers, BigNumber as BN, Contract, utils } from 'ethers';
import * as dotenv from 'dotenv';
import { NetworkInfo } from '../src/networks';
import { distributeConstantsByNetwork } from '../src/helpers';
dotenv.config();

const chainId: number = 42;

const dummyUser = '0x186e446fbd41dD51Ea2213dB2d3ae18B05A05ba8'; // local alice account

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
const Tokens = { DAIToken, USDCToken, PENDLEETHSLPToken, ETHUSDCSLPToken, OTPEToken, OTaUSDCToken, OTcDAIToken, cDAIToken, aUSDCToken }


describe("Yiled Contract", () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: any;
  let yContract: YieldContract;

  beforeAll(async () => {
    const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}` : `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`;

    // const providerUrl = `http://127.0.0.1:8545`;
    provider = new ethers.providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner();
    yContract = new YieldContract(
      utils.parseBytes32String(forgeIdsInBytes.AAVE),
      Tokens.USDCToken,
      EXP_2021.toNumber()
    );
  });

  it('yieldContract.mintDetails', async () => {
    const response = await yContract.methods(signer, chainId).mintDetails(new TokenAmount(
      Tokens.aUSDCToken,
      BN.from(10).pow(9).toString()
    ));
    console.log(response);
  })

  it('yieldContract.mint', async () => {
    const cDAIContract = new Contract(Tokens.cDAIToken.address, contracts.IERC20.abi, provider);
    await cDAIContract.connect(signer).approve(networkInfo.contractAddresses.misc.PendleRouter, BN.from(10).pow(40));
    const response = await yContract.methods(signer).mint(new TokenAmount(
      Tokens.cDAIToken,
      BN.from(10).pow(12).toString()
    ));
    console.log(response);
  })

  it.only('yieldContract.redeemDetails', async () => {
    const response = await yContract.methods(signer).redeemDetails(new TokenAmount(
      Tokens.OTcDAIToken,
      BN.from(10).pow(12).toString()
    ), dummyUser);
    console.log(response);
  })

  it.skip('yieldContract.redeem', async () => {
    const response = await yContract.methods(signer).redeem(dummyTokenAmount);
    console.log(response);
  })
})
