# Pendle SDK APIs

## YT
```
YtOrMarketInterest: {
  address: string;
  interest: TokenAmount;
};

Yt.methods(JsonRpcSigner, chainId?).fetchInterests(address) => Promise<YtOrMarketInterest[]>
```

## Market

### Static Methods:
```
PendleMarket.methods(JsonRpcSigner, chainId?).fetchInterests(address) => Promise<YtOrMarketInterest[]>
```

### Instance Methods: 
```
CurrencyAmount = {
  currency: string,
  amount: string
}

MarketDetails = {
  tokenReserves: TokenReserveDetails[],
  otherDetails: { 
    dailyVolume: CurrencyAmount, 
    volume24hChange: string,
    liquidity: CurrencyAmount,
    liquidity24HChange: string,
    swapFeeApr: string,
    impliedYield: string
  }
}

SwapDetails = {
  inAmount: TokenAmount,
  outAmount: TokenAmount,
  minReceived: TokenAmount,
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

pendleMarket.methods(JsonRpcSigner, chainId?).swapExactInDetails(slippage: number, inAmount: TokenAmount) => Promise<SwapDetails>
pendleMarket.methods(JsonRpcSigner, chainId?).swapExactOutDetails(slippage: number, outAmount: TokenAmount) => Promise<SwapDetails>

pendleMarket.methods(JsonRpcSigner, chainId?).swapExactIn(slippage: number, inAmount: TokenAmount) => Promise<TransactionResponse>
pendleMarket.methods(JsonRpcSigner, chainId?).swapExactOut(slippage: number, outAmount: TokenAmount) => Promise<TransactionResponse>

pendleMarket.methods(JsonRpcSigner, chainId?).addDualDetails(tokenAmount: TokenAmount) => Promise<AddDualLiquidityDetails>
pendleMarket.methods(JsonRpcSigner, chainId?).addDual(tokenAmounts: TokenAmount[], slippage: number | string) => Promise<TransactionResponse>

pendleMarket.methods(JsonRpcSigner, chainId?).addSingleDetails(tokenAmount: TokenAmount) => Promise<AddSingleLiquidityDetails>
pendleMarket.methods(JsonRpcSigner, chainId?).addSingle(tokenAmount: TokenAmount, slippage: number | string) => Promise<TransactionResponse>

pendleMarket.methods(JsonRpcSigner, chainId?).removeDualDetails(percentage: number) => Promise<RemoveDualLiquidityDetails>
pendleMarket.methods(JsonRpcSigner, chainId?).removeDual(percentage: number, slippage: number) => Promise<TransactionResponse>

pendleMarket.methods(JsonRpcSigner, chainId?).removeSingleDetails(percentage: number, outToken: Token, slippage: number) => Promise<RemoveSingleLiquidityDetails>
pendleMarket.methods(JsonRpcSigner, chainId?).removeSingle(percentage: number, outToken: Token, slippage: number) => Promise<TransactionResponse>

pendleMarket.yieldContract() => YieldContract
```

## Staking Pool
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

StakingPool.methods(JsonRpcSigner, chainId?).fetchClaimableYields(address) => Promise<PoolYields[]>
StakingPool.methods(JsonRpcSigner, chainId?).fetchAccruingRewards(address) => Promise<PoolAccruingRewards[]>
StakingPool.methods(JsonRpcSigner, chainId?).fetchVestedRewards(address) => Promise<PoolVestedRewards[]>
```

## Yield Contract
```
RedeemDetails = {
  redeemableAmount: TokenAmount
  interestAmount: TokenAmount
}

YieldContract.methods(JsonRpcSigner, chainId?).mintDetails(toMint: TokenAmount) => Promise<TokenAmount[]>
YieldContract.methods(JsonRpcSigner, chainId?).mint(toMint: TokenAmount) => Promise<TransactionResponse>
YieldContract.methods(JsonRpcSigner, chainId?).redeemDetails(otAmount: TokenAmount, userAddress: string) => Promise<RedeemDetails>
YieldContract.methods(JsonRpcSigner, chainId?).redeem(otAmount: TokenAmount): Promise<TransactionResponse>
```
