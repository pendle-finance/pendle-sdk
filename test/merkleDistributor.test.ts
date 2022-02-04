import * as dotenv from 'dotenv';
import { Contract, providers } from 'ethers';
import { EthConsts } from '@pendle/constants';
import { PendleMerkleDistributor, Token, contracts, distributeConstantsByNetwork } from '../src';

const chainId = EthConsts.common.CHAIN_ID;
const dummyUser = '0x82c9D29739333258f08cD3957d2a7ac7f4d53fAb'; // Mainnet test account
const networkInfo = distributeConstantsByNetwork(chainId);
const pendleToken = Token.find(networkInfo.contractAddresses.tokens.PENDLE, chainId);

dotenv.config();
jest.setTimeout(30000);

function parse(message: any): string {
  return JSON.parse(JSON.stringify(message));
}

describe(PendleMerkleDistributor, () => {
  let provider: providers.JsonRpcProvider;
  let signer: providers.JsonRpcSigner;

  beforeAll(async () => {
    const providerUrl =
      chainId === EthConsts.common.CHAIN_ID
        ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`
        : `https://api.avax.network/ext/bc/C/rpc`;
    // const providerUrl = 'http://127.0.0.1:8545';
    provider = new providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner();
  });

  it('read single token claimable yield', async () => {
    const singleTokenYield = await PendleMerkleDistributor.methods({
      signer,
      provider,
      chainId,
    }).fetchTokenClaimableYield({
      token: pendleToken,
      userAddress: dummyUser,
    });
    console.log('Single token claimable yield', parse(singleTokenYield));
  });

  it('read all tokens claimable yields', async () => {
    const yields = await PendleMerkleDistributor.methods({ signer, provider, chainId }).fetchClaimableYields(dummyUser);
    console.log('All claimable yields', parse(yields));
  });

  // TODO: Test this after the contract is deployed
  it.skip('claim yield for a single token', async () => {
    const distributor = PendleMerkleDistributor.find({ chainId, address: pendleToken.address });
    const tokenContract = new Contract(pendleToken.address, contracts.IERC20.abi, provider);
    const balanceBefore = await tokenContract.balanceOf(dummyUser);
    await distributor.methods({ signer, provider, chainId }).claim({ token: pendleToken, userAddress: dummyUser });
    const balanceAfter = await tokenContract.balanceOf(dummyUser);
    console.log(
      'Claim yield for single token\nBefore claim:',
      balanceBefore.toString(),
      '\nAfter claim:',
      balanceAfter.toString()
    );
  });
});
