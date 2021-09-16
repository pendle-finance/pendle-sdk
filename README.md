# Pendle SDK APIs

## YT

### Static Methods:

```
YtOrMarketInterest: {
  address: string;
  interest: TokenAmount;
};

Yt.find(address, chainId?) => Yt
Yt.methods(JsonRpcSigner, chainId?).fetchInterests(address) => Promise<YtOrMarketInterest[]>
```

## Market

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
    underlyingYieldRate: number
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
  swapFee: TokenAmount
}

RemoveDualLiquidityDetails = {
  tokenAmounts: TokenAmount[]
}

RemoveSingleLiquidityDetails = {
  outAmount: TokenAmount
  priceImpact?: string
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
yieldContract.methods(JsonRpcSigner, chainId?).redeem(otAmount: TokenAmount): Promise<TransactionResponse>
```
