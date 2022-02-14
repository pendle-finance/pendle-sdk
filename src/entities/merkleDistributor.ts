import keccak256 from 'keccak256';
import { BigNumber as BN, BigNumberish, Contract, utils } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import { EthConsts } from '@pendle/constants';
import { contracts } from '../contracts';
import { PendleRewardDetails, fetchTotalPendleRewards } from '../fetchers';
import { distributeConstantsByNetwork, isSameAddress, submitTransaction } from '../helpers';
import { Token } from './token';
import { TokenAmount } from './tokenAmount';
import type { ChainSpecifics } from './types';
import type { PendleMerkleDistributor as PendleMerkleDistributorContract } from '@pendle/core/typechain-types';

// This class currently works only on Ethereum Mainnet. Should the need to
// extend this distributor to another chain ever arise, a chainId instance
// variable can be added.
export class PendleMerkleDistributor {
  private _pendleRewardDetails?: PendleRewardDetails[];

  public async pendleRewardDetails(): Promise<PendleRewardDetails[]> {
    this._pendleRewardDetails ??= await fetchTotalPendleRewards();
    return this._pendleRewardDetails;
  }

  private hashPendleRewardDetails(address: string, amount: BigNumberish): string {
    return utils.solidityKeccak256(['address', 'uint256'], [address, amount]);
  }

  public async merkleTree(): Promise<MerkleTree> {
    const details = await this.pendleRewardDetails();
    const elements = details.map(({ address, amount }) => this.hashPendleRewardDetails(address, amount));
    return new MerkleTree(elements, keccak256, { sort: true });
  }

  public async fetchUserTotalAmount(userAddress: string): Promise<BN> {
    const data = await this.pendleRewardDetails();
    const { amount } = data.find(({ address }) => isSameAddress(address, userAddress)) ?? {};
    return BN.from(amount ?? 0);
  }

  public methods({ signer, provider, chainId = EthConsts.common.CHAIN_ID }: ChainSpecifics) {
    const networkInfo = distributeConstantsByNetwork(chainId);
    const distributorAddress = networkInfo.contractAddresses.misc.PendleMerkleDistributor;
    const distributorContract = new Contract(distributorAddress, contracts.PendleMerkleDistributor.abi, provider) as PendleMerkleDistributorContract;
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
      const leaf = this.hashPendleRewardDetails(userAddress, amount);
      const proof = merkleTree.getHexProof(leaf);
      return submitTransaction(distributorContract, signer!, 'claim', [userAddress, amount, proof]);
    };

    return {
      fetchClaimableYield,
      claim,
    };
  }
}
