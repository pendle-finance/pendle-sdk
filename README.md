# Pendle SDK APIs

## YT

### Static Methods:

```
YtOrMarketInterest: {
  address: string;
  interest: TokenAmount;
};

Yt.find(address, chainId?) => Yt
Yt.methods(JsonRpcSigner, chainId?).fetchInterests(userAddress) => Promise<YtOrMarketInterest[]>
```

## OT

### Static Methods:
```
type OtReward = {
    reward: TokenAmount
    address: string
}
Ot.find(address, chainId?) => Ot
Ot.methods(JsonRpcSigner, chainId?).fetchInterests(userAddress) => Promise<OtReward[]>
```

## Market

### Static Methods:
```
Market.find(address, chainId?) => Market
```
This supports finding both Pendle YT markets and Sushi OT markets

### Instance Methods:
```
market.methods(signer, chainId?).getSwapFeeApr() => Promise<string>
```


## PendleMarket

### Static Methods:
```
PendleMarket.find(address, chainId?) => PendleMarket
PendleMarket.methods(JsonRpcSigner, chainId?).fetchInterests(address) => Promise<YtOrMarketInterest[]>
```

### Instance Methods: 
```
CurrencyAmount = {
  currency: string,
  amount: string
}

TokenReserveDetails = {
  reserves: TokenAmount
  weights: string
}

MarketDetails = {
  tokenReserves: TokenReserveDetails[],
  otherDetails: { 
    dailyVolume: CurrencyAmount, 
    volume24hChange: string,
    liquidity: CurrencyAmount,
    liquidity24HChange: string,
    swapFeeApr: string,
    impliedYield: string,
    underlyingYieldRate: number,
    YTPrice: CurrencyAmount
  }
}

SwapDetails = {
  inAmount: TokenAmount,
  outAmount: TokenAmount,
  minReceived?: TokenAmount,
  maxInput?: TokenAmount
  priceImpact: string,
  swapFee: TokenAmount
}

AddDualLiquidityDetails = {
  otherTokenAmount: TokenAmount,
  shareOfPool: string
}

AddSingleLiquidityDetails = {
  shareOfPool: string,
  priceImpact: string,
  rate: TokenAmount,
  swapFee: TokenAmount
}

RemoveDualLiquidityDetails = {
  tokenAmounts: TokenAmount[]
}

RemoveSingleLiquidityDetails = {
  outAmount: TokenAmount
  priceImpact?: string
  rate: TokenAmount
  swapFee?: TokenAmount
}

pendleMarket.methods(JsonRpcSigner, chainId?).readMarketDetails() => Promise<MarketDetails>

pendleMarket.methods(JsonRpcSigner, chainId?).swapExactInDetails(inAmount: TokenAmount, slippage: number) => Promise<SwapDetails>
pendleMarket.methods(JsonRpcSigner, chainId?).swapExactOutDetails(outAmount: TokenAmount, slippage: number) => Promise<SwapDetails>

pendleMarket.methods(JsonRpcSigner, chainId?).swapExactIn(inAmount: TokenAmount, slippage: number) => Promise<TransactionResponse>
pendleMarket.methods(JsonRpcSigner, chainId?).swapExactOut(outAmount: TokenAmount, slippage: number) => Promise<TransactionResponse>

pendleMarket.methods(JsonRpcSigner, chainId?).addDualDetails(tokenAmount: TokenAmount, slippage: number) => Promise<AddDualLiquidityDetails>
pendleMarket.methods(JsonRpcSigner, chainId?).addDual(tokenAmounts: TokenAmount[], slippage: number) => Promise<TransactionResponse> // tokenAmounts is assumed be xyt amount followed by baseToken amount

pendleMarket.methods(JsonRpcSigner, chainId?).addSingleDetails(tokenAmount: TokenAmount) => Promise<AddSingleLiquidityDetails>
pendleMarket.methods(JsonRpcSigner, chainId?).addSingle(tokenAmount: TokenAmount, slippage: number) => Promise<TransactionResponse>

pendleMarket.methods(JsonRpcSigner, chainId?).removeDualDetails(percentage: number, slippage: number) => Promise<RemoveDualLiquidityDetails>
pendleMarket.methods(JsonRpcSigner, chainId?).removeDual(percentage: number, slippage: number) => Promise<TransactionResponse>

pendleMarket.methods(JsonRpcSigner, chainId?).removeSingleDetails(percentage: number, outToken: Token, slippage: number) => Promise<RemoveSingleLiquidityDetails>
pendleMarket.methods(JsonRpcSigner, chainId?).removeSingle(percentage: number, outToken: Token, slippage: number) => Promise<TransactionResponse>

pendleMarket.yieldContract() => YieldContract

pendleMarket.methods(signer, chainId?).getSwapFeeApr() => Promise<string>

```

## Staking Pool

### Static Methods:

```
enum YieldType {
	INTEREST="interest",
	REWARDS="rewards"
}

YieldInfo = {
	yield: TokenAmount,
	yieldType: YieldType 
}

PoolYields = {
  address: string; 
  inputToken: Token;
  yields: YieldInfo[];
};

FutureEpochRewards = {
  epochId: number;
  rewards: TokenAmount[];
};

PoolAccruingRewards = {
  address: string;
  inputToken: Token;
  accruingRewards: FutureEpochRewards[];
};

PoolVestedRewards = {
  address: string;
  inputToken: Token;
  vestedRewards: FutureEpochRewards[];
};

StakingPool.find(adddress, inputTokenAddress, chainId?) => StakingPool
StakingPool.methods(JsonRpcSigner, chainId?).fetchClaimableYields(address) => Promise<PoolYields[]>
StakingPool.methods(JsonRpcSigner, chainId?).fetchAccruingRewards(address) => Promise<PoolAccruingRewards[]>
StakingPool.methods(JsonRpcSigner, chainId?).fetchVestedRewards(address) => Promise<PoolVestedRewards[]>
```

### Instance Methods
```
AprInfo = {
	origin: string, // 'Pendle' or 'Sushiswap'
	apr: string
}

StakedAmount = {
  amount: TokenAmount;
  valuation: CurrencyAmount;
}

stakingPool.methods(signer, chainId?).getTotalStaked() => Promise<StakedAmount>
stakingPool.methods(signer, chainId?).balanceOf(address) => Promise<StakedAmount>
stakingPool.methods(signer, chainId?).rewardAprs() => Promise<AprInfo[]>

stakingPool.methods(signer, chainId?).stake(amount: TokenAmount) => Promise<TransactionResponse>
stakingPool.methods(signer, chainId?).unstake(amount: TokenAmount) => Promise<TransactionResponse>

```

## Yield Contract

### Instance Methods: 

```
RedeemDetails = {
  redeemableAmount: TokenAmount
  interestAmount: TokenAmount
}

yieldContract.methods(JsonRpcSigner, chainId?).mintDetails(toMint: TokenAmount) => Promise<TokenAmount[]>
yieldContract.methods(JsonRpcSigner, chainId?).mint(toMint: TokenAmount) => Promise<TransactionResponse>
yieldContract.methods(JsonRpcSigner, chainId?).redeemDetails(otAmount: TokenAmount, userAddress: string) => Promise<RedeemDetails>
yieldContract.methods(JsonRpcSigner, chainId?).redeem(otAmount: TokenAmount) => Promise<TransactionResponse>
```

## Pendle Merkle Distributor

### Instance Methods:

```typescript
type PendleRewardDetails = {
    address: string;
    amount: string;
};

pendleMerkleDistributor.methods({signer?, provider, chainId = 1}).fetchClaimableYield(userAddress: string) => Promise<TokenAmount>;
pendleMerkleDistributor.methods({signer?, provider, chainId = 1}).claim(userAddress: string) => Promise<TransactionResponse>;

pendleMerkleDistributor.pendleRewardDetails() => Promise<PendleRewardDetails[]>;
pendleMerkleDistributor.merkleTree() => Promise<MerkleTree>;
pendleMerkleDistributor.fetchUserTotalAmount(userAddress: string) => Promise<BN>;
```

## Misc functions:

```
import {Sdk} from '@pendle/sdk`;

Sdk.fetchValuations(TokenAmount[], chainId) => Promise<CurrencyAmount>
Sdk.claimYields({
  yts: Token[],
  ots: Token[],
	lps: Token[],
	interestStakingPools: StakingPool[],
	rewardStakingPools: StakingPool[]
}) => Promise<TransactionResponse>
```