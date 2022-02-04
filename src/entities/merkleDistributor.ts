import keccak256 from 'keccak256';
import { Contract, utils } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import { EthConsts } from '@pendle/constants';
import { contracts } from '../contracts';
import { distributeConstantsByNetwork, isSameAddress, submitTransaction } from '../helpers';
import { Token } from './token';
import { TokenAmount } from './tokenAmount';
import type { ChainSpecifics } from './types';

// TODO: Annotate the contract with the appropriate type
// import type { PendleMerkleDistributor } from '@pendle/core/typechain-types';

export class PendleMerkleDistributor {
  public readonly token: Token;
  public readonly distributorAddress: string;

  constructor({ address, chainId = EthConsts.common.CHAIN_ID }: { address: string; chainId: number }) {
    const { contractAddresses } = distributeConstantsByNetwork(chainId);
    const { merkleDistributors } = contractAddresses;
    this.distributorAddress = merkleDistributors!.find(({ token }) => isSameAddress(token, address))!.distributor;
    this.token = Token.find(address, chainId);
  }

  public static find({ address, chainId = EthConsts.common.CHAIN_ID }: { address: string; chainId: number }) {
    return new PendleMerkleDistributor({ address, chainId });
  }

  // TODO: Complete this function to fetch merkle tree from backend server
  public async merkleTree(): Promise<MerkleTree> {
    return new MerkleTree([], keccak256, { sort: true });
  }

  // While the current merkle distributor is only intended to distribute PENDLE
  // rewards, this implementation allows us to extend this concept to any token
  // should the need to distribute other tokens using arise
  public static methods({ chainId }: ChainSpecifics) {
    const { contractAddresses } = distributeConstantsByNetwork(chainId);
    const { merkleDistributors } = contractAddresses;
    const distributors = (merkleDistributors ?? []).map(({ token: address }) =>
      PendleMerkleDistributor.find({ address, chainId })
    );

    // Fetches yield for a single token
    // TODO: Fetch claimable yield for token from backend server
    const fetchTokenClaimableYield = async ({
      token,
      userAddress,
    }: {
      token: Token;
      userAddress: string;
    }): Promise<TokenAmount> => {
      return new TokenAmount(token, '0');
    };

    // Fetches yield for all tokens
    const fetchClaimableYields = async (userAddress: string): Promise<TokenAmount[]> => {
      return Promise.all(distributors.map(async ({ token }) => fetchTokenClaimableYield({ token, userAddress })));
    };

    return {
      fetchTokenClaimableYield,
      fetchClaimableYields,
    };
  }

  public methods({ signer, provider, chainId }: ChainSpecifics) {
    const contract = new Contract(this.distributorAddress, contracts.PendleMerkleDistributor.abi, signer);

    // Claims the yield for a single token
    const claim = async ({ token, userAddress }: { token: Token; userAddress: string }) => {
      const [tokenAmount, merkleTree] = await Promise.all([
        PendleMerkleDistributor.methods({ signer, provider, chainId }).fetchTokenClaimableYield({ token, userAddress }),
        this.merkleTree(),
      ]);
      const amount = tokenAmount.rawAmount();
      const leaf = utils.solidityKeccak256(['address', 'uint256'], [userAddress, amount]);
      const proof = merkleTree.getHexProof(leaf);
      return submitTransaction(contract, signer!, 'claim', [userAddress, amount, proof]);
    };

    return {
      claim,
    };
  }
}
