import keccak256 from 'keccak256';
import { BigNumber as BN, Contract, utils } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import { EthConsts } from '@pendle/constants';
import { contracts } from '../contracts';
import { distributeConstantsByNetwork, isSameAddress, submitTransaction } from '../helpers';
import { Token } from './token';
import { TokenAmount } from './tokenAmount';
import type { ChainSpecifics } from './types';

// TODO: Annotate the contract with the appropriate type
// import type { PendleMerkleDistributor } from '@pendle/core/typechain-types';

// This class currently works only on Ethereum Mainnet. Should the need to
// extend this distributor to another chain ever arise, a chainId instance
// variable can be added.
export class PendleMerkleDistributor {
  // TODO: Complete this function to fetch merkle tree from backend server
  public async merkleTree(): Promise<MerkleTree> {
    return new MerkleTree([], keccak256, { sort: true });
  }

  public async fetchUserTotalAmount(userAddress: string): Promise<BN> {
    // TODO: Replace dummy data with backend server data
    const data = await [{ address: '0xD08c8e6d78a1f64B1796d6DC3137B19665cb6F1F', amount: BN.from(10).pow(17) }];
    const { amount } = data.find(({ address }) => isSameAddress(address, userAddress)) ?? {};
    return amount ?? BN.from(0);
  }

  public methods({ signer, provider, chainId = EthConsts.common.CHAIN_ID }: ChainSpecifics) {
    const networkInfo = distributeConstantsByNetwork(chainId);
    const distributorAddress = networkInfo.contractAddresses.misc.PendleMerkleDistributor;
    // TODO: Annotate the contract with the appropriate type
    const distributorContract = new Contract(distributorAddress, contracts.PendleMerkleDistributor.abi, provider); // as PendleMerkleDistributor;
    const pendleToken = Token.find(networkInfo.contractAddresses.tokens.PENDLE);

    // Fetch claimable Pendle yield
    const fetchClaimableYield = async (userAddress: string): Promise<TokenAmount> => {
      const [totalAmount, claimedAmount] = await Promise.all([
        this.fetchUserTotalAmount(userAddress),
        distributorContract.callStatic.claimedAmount(userAddress),
      ]);
      const amountOut = totalAmount.sub(claimedAmount);
      return new TokenAmount(pendleToken, amountOut.toString());
    };

    // Claim the Pendle yield
    const claim = async (userAddress: string) => {
      const [amount, merkleTree] = await Promise.all([this.fetchUserTotalAmount(userAddress), this.merkleTree()]);
      const leaf = utils.solidityKeccak256(['address', 'uint256'], [userAddress, amount]);
      const proof = merkleTree.getHexProof(leaf);
      return submitTransaction(distributorContract, signer!, 'claim', [userAddress, amount, proof]);
    };

    return {
      fetchClaimableYield,
      claim,
    };
  }
}
