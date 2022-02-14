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
  let distributor: PendleMerkleDistributor;

  beforeAll(async () => {
    const providerUrl =
      chainId === EthConsts.common.CHAIN_ID
        ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`
        : `https://api.avax.network/ext/bc/C/rpc`;
    // const providerUrl = 'http://127.0.0.1:8545';
    provider = new providers.JsonRpcProvider(providerUrl);
    signer = provider.getSigner();
    distributor = new PendleMerkleDistributor();
  });

  it('read Pendle claimable yield', async () => {
    const yields = await distributor.methods({ signer, provider, chainId }).fetchClaimableYield(dummyUser);
    console.log('Pendle claimable yield', parse(yields));
  });

  it('claim Pendle yield', async () => {
    const tokenContract = new Contract(pendleToken.address, contracts.IERC20.abi, provider);
    const { fetchClaimableYield, claim } = distributor.methods({ signer, provider, chainId });
    const [balanceBefore, expectedAmount] = await Promise.all([
      tokenContract.balanceOf(dummyUser),
      fetchClaimableYield(dummyUser),
    ]);
    await claim(dummyUser);
    const balanceAfter = await tokenContract.balanceOf(dummyUser);
    console.log(
      'Claim Pendle yield\nBefore claim:',
      balanceBefore.toString(),
      '\nAfter claim:',
      balanceAfter.toString()
    );
    expect(balanceAfter.sub(balanceBefore).toString()).toBe(expectedAmount.rawAmount());
  });
});
