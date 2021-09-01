import { Token } from '../entities';
import { providers, Contract, Transaction } from 'ethers';
import { contracts } from '../contracts';

export interface StakingPoolId {
    address: string
    inputTokenAddress: string
    contractType: string
}

export enum StakingPoolType {
  LmV1 = 1,
  LmV2,
  PendleSingleSided,
}

export interface StakingPool {
  readonly address: string;
  readonly inputToken: Token;
  readonly rewardTokens: Token[]; // Should always be PENDLE
  readonly interestTokens?: Token[]; //
  readonly type: StakingPoolType;

  sendStake(provider: providers.JsonRpcSigner, amount: string): Promise<Transaction>; // returns a promise
  sendUnstake(provider: providers.JsonRpcSigner, amount: string): Promise<any>; // returns a promise
  callBalanceOf(
    provider: providers.JsonRpcSigner,
    userAddress: string
  ): Promise<string>; // returns a promise
}

export class LiquidityMiningV1Pool implements StakingPool {
  public readonly address: string;
  public readonly inputToken: Token;
  public readonly rewardToken: Token; // Should always be PENDLE
  public readonly interestToken?: Token; //
  public readonly type = StakingPoolType.LmV1;

  public constructor(
    address: string,
    inputToken: Token,
    rewardToken: Token,
    interestToken?: Token
  ) {
    this.address = address.toLowerCase();
    this.inputToken = inputToken;
    this.rewardToken = rewardToken;
    this.interestToken = interestToken;
  }

  public sendStake(
    provider: providers.JsonRpcSigner,
    amount: string
  ): Promise<Transaction> {
    // returns a promise
    const lmV1Contract = new Contract(
      this.address,
      contracts.PendleLiquidityMiningBase,
      provider
    );
    return lmV1Contract.stake(this.inputToken.expiry, amount);
  }

  public sendUnstake(
    provider: providers.JsonRpcSigner,
    amount: string
  ): Promise<Transaction> {
    // returns a promise
    const lmV1Contract = new Contract(
      this.address,
      contracts.PendleLiquidityMiningBase,
      provider
    );
    return lmV1Contract.unstake(this.inputToken.expiry, amount);
  }

  public callBalanceOf(
    provider: providers.JsonRpcSigner,
    userAddress: string
  ): Promise<string> {
    const lmV1Contract = new Contract(
      this.address,
      contracts.PendleLiquidityMiningBase,
      provider
    );
    return lmV1Contract.getBalances(this.inputToken.expiry, userAddress);
  }
}
