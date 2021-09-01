import { Token, TokenAmount } from './token';
import { providers } from 'ethers';
// import { contractAddresses } from '../constants';
// import { contracts } from '../contracts';

const sushiToken = new Token('0x6b3595068778dd592e39a122f4f5a5cf09c90fe2', 18)
const pendleToken = new Token('0x808507121B80c02388fAd14726482e061B8da827', 18)
const dummyAmount = '123456000000000000'

export interface StakingPoolId {
  address: string
  inputTokenAddress: string
  contractType: string
}

export type PoolInterstAndRewards = {
  address: string
  inputToken: Token
  interest: TokenAmount
  claimableRewards: TokenAmount[]
}

export type PoolAccruingRewards = {
  address: string
  inputToken: Token
  accruingRewards: TokenAmount[]
}

export type PoolVestedRewards = {
  address: string
  inputToken: Token
  vestedRewards: FutureEpochRewards[]
}

export type FutureEpochRewards = {
  epochId: number
  rewards: TokenAmount[]
}

export enum StakingPoolType {
  LmV1 = "PendleLiquidityMining",
  LmV2 = "PendleLiquidityMiningV2",
  PendleSingleSided = "PendleSingleStaking"
}

export class StakingPool {
  public readonly address: string;
  public readonly inputToken: Token;
  public readonly rewardTokens: Token[]; // Should always be PENDLE
  public readonly interestTokens?: Token[]; //
  public readonly contractType?: StakingPoolType;

  constructor(address: string, inputToken: Token, rewardTokens: Token[], interestTokens?: Token[], contractType?: StakingPoolType) {
    this.address = address
    this.inputToken = inputToken
    this.rewardTokens = rewardTokens
    this.interestTokens = interestTokens
    this.contractType = contractType
  }

  public static methods(_: providers.JsonRpcSigner): Record<string, any> {
    const fetchInterestsAndRewards = async(stakingPools: StakingPoolId[], _: string): Promise<PoolInterstAndRewards[]> => {
      // const lmV1Contracts = stakingPools.filter((pool) => pool.contractType = StakingPoolType.LmV1)
      // const lmV2Contracts = stakingPools.filter((pool) => pool.contractType = StakingPoolType.LmV2)
      // const redeemProxyContract = new Contract(contractAddresses.PendleRedeemProxy, contracts.PendleRedeemProxy.abi, provider.provider);
      //TODO: fetch rewards and interests

      // return dummy data
      return stakingPools.map((stakingPool) => ({
        address: stakingPool.address,
        inputToken: new Token(stakingPool.inputTokenAddress, 18),
        interest: new TokenAmount(sushiToken, dummyAmount),
        claimableRewards: [new TokenAmount(pendleToken, dummyAmount)]
      }))
    }

    const fetchAccruingRewards = async(stakingPools: StakingPoolId[], _: string): Promise<PoolAccruingRewards[]> => {
      // return dummy data
      return stakingPools.map((stakingPool) => ({
        address: stakingPool.address,
        inputToken: new Token(stakingPool.inputTokenAddress, 18),
        accruingRewards: [new TokenAmount(pendleToken, dummyAmount)]
      }))
    }

    const fetchVestedRewards = async(stakingPools: StakingPoolId[], _: string): Promise<PoolVestedRewards[]> => {
      // return dummy data
      return stakingPools.map((stakingPool) => ({
        address: stakingPool.address,
        inputToken: new Token(stakingPool.inputTokenAddress, 18),
        vestedRewards: [
          {
            epochId: 12,
            rewards: [new TokenAmount(pendleToken, dummyAmount)]
          },
          {
            epochId: 13,
            rewards: [new TokenAmount(pendleToken, dummyAmount)]
          },
          {
            epochId: 14,
            rewards: [new TokenAmount(pendleToken, dummyAmount)]
          },
          {
            epochId: 15,
            rewards: [new TokenAmount(pendleToken, dummyAmount)]
          },
        ]
      }))
    }

    return {
      fetchInterestsAndRewards,
      fetchAccruingRewards,
      fetchVestedRewards
    }
  }
  // sendStake(provider: providers.JsonRpcSigner, amount: string): Promise<Transaction> ; // returns a promise
  // sendUnstake(provider: providers.JsonRpcSigner, amount: string): Promise<any>; // returns a promise
  // callBalanceOf(
  //   provider: providers.JsonRpcSigner,
  //   userAddress: string
  // ): Promise<string>; // returns a promise
}

// export class LiquidityMiningV1Pool implements StakingPool {
//   public readonly address: string;
//   public readonly inputToken: Token;
//   public readonly rewardToken: Token; // Should always be PENDLE
//   public readonly interestToken?: Token; //
//   public readonly type = StakingPoolType.LmV1;
//
//   public constructor(
//     address: string,
//     inputToken: Token,
//     rewardToken: Token,
//     interestToken?: Token
//   ) {
//     this.address = address.toLowerCase();
//     this.inputToken = inputToken;
//     this.rewardToken = rewardToken;
//     this.interestToken = interestToken;
//   }
//
//   public sendStake(
//     provider: providers.JsonRpcSigner,
//     amount: string
//   ): Promise<Transaction> {
//     // returns a promise
//     const lmV1Contract = new Contract(
//       this.address,
//       contracts.PendleLiquidityMiningBase,
//       provider
//     );
//     return lmV1Contract.stake(this.inputToken.expiry, amount);
//   }
//
//   public sendUnstake(
//     provider: providers.JsonRpcSigner,
//     amount: string
//   ): Promise<Transaction> {
//     // returns a promise
//     const lmV1Contract = new Contract(
//       this.address,
//       contracts.PendleLiquidityMiningBase,
//       provider
//     );
//     return lmV1Contract.unstake(this.inputToken.expiry, amount);
//   }
//
//   public callBalanceOf(
//     provider: providers.JsonRpcSigner,
//     userAddress: string
//   ): Promise<string> {
//     const lmV1Contract = new Contract(
//       this.address,
//       contracts.PendleLiquidityMiningBase,
//       provider
//     );
//     return lmV1Contract.getBalances(this.inputToken.expiry, userAddress);
//   }
// }
