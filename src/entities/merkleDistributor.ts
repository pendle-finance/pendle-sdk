import keccak256 from 'keccak256';
import { BigNumber as BN, BigNumberish, Contract, utils } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import { EthConsts } from '@pendle/constants';
import { contracts } from '../contracts';
import { PendleRewardDetails, fetchTotalPendleRewards, fetchTokenPrice } from '../fetchers';
import { distributeConstantsByNetwork, isSameAddress, submitTransaction, decimalFactor } from '../helpers';
import { Token } from './token';
import { TokenAmount } from './tokenAmount';
import type { ChainSpecifics } from './types';
import type { IERC20, PendleIncentiveData, PendleMerkleDistributor as PendleMerkleDistributorContract } from '@pendle/core/typechain-types';
import { calcLMRewardApr, DecimalsPrecision } from '../math/marketMath';
import { ONE_DAY } from '../constants';
import axios from 'axios';

// This class currently works only on Ethereum Mainnet. Should the need to
// extend this distributor to another chain ever arise, a chainId instance
// variable can be added.
export class PendleMerkleDistributor {
  private _pendleRewardDetails?: PendleRewardDetails[];

  public async pendleRewardDetails(): Promise<PendleRewardDetails[]> {
    this._pendleRewardDetails = this._pendleRewardDetails ?? await fetchTotalPendleRewards();
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
    const incentiveDataContract = new Contract(networkInfo.contractAddresses.misc.PendleIncentiveData, contracts.PendleIncentiveData.abi, provider) as PendleIncentiveData;
    
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

    const computeRewardAPR = async(inputToken: Token): Promise<string> => {
      const pendlePricePromise = fetchTokenPrice({address: pendleToken.address, chainId});
      const tokenContract = new Contract(inputToken.address, contracts.IERC20.abi, provider) as IERC20;
      const totalSupplyPromise = tokenContract.totalSupply();
      const tokenPricePromise = fetchTokenPrice({address: inputToken.address, chainId});

      const datasPromise = incentiveDataContract.callStatic.getCurrentData([inputToken.address]).catch((err: any) => {
        Promise.resolve(undefined);
      });

      const [pendlePrice, datas] = await Promise.all([pendlePricePromise, datasPromise]);
      if (datas === undefined) return "0";

      const [tokenPrice, totalSupply] = await Promise.all([tokenPricePromise, totalSupplyPromise]);

      const rewardValuation = pendlePrice.multipliedBy(datas[0].total.toString()).div(decimalFactor(18));
      const baseValuation = tokenPrice.multipliedBy(totalSupply.toString()).div(decimalFactor(inputToken.decimals));
      const epochLength = datas[0].epochEnd - datas[0].epochBegin;
      const APR = calcLMRewardApr(rewardValuation, baseValuation, (ONE_DAY.toNumber() * 365) / epochLength);
      return APR.toFixed(DecimalsPrecision);
    }

    const rewardAPR = async(inputToken: Token): Promise<string> => {
      const apr = await axios.get(`https://api.pendle.finance/apr/merkle?inputTokenAddress=${inputToken.address}`).then((res: any) => res.data);
      return apr;
    }

    return {
      fetchClaimableYield,
      claim,
      computeRewardAPR,
      rewardAPR
    };
  }
}
