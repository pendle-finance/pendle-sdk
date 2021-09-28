import { rdiv, rpow, RONE, rmul } from './mathLib'
import { BigNumber as BN } from 'ethers';
import BigNumber from 'bignumber.js';

export const DecimalsPrecision: number = 10;
export const PercentageMaxDecimals: number = 6;
export const PONE: BN = BN.from(10).pow(PercentageMaxDecimals);
export const ONE = new BigNumber(1);

export function calcExactOut(
    inTokenReserve: BN,
    inTokenWeight: BN,
    outTokenReserve: BN,
    outTokenWeight: BN,
    exactIn: BN,
    swapFee: BN
): BN {
    const weightRatio: BN = rdiv(inTokenWeight, outTokenWeight);
    var adjustedIn: BN = RONE.sub(swapFee);
    adjustedIn = rmul(exactIn, adjustedIn);
    const y: BN = rdiv(inTokenReserve, inTokenReserve.add(adjustedIn));
    const foo: BN = rpow(y, weightRatio);
    const bar: BN = RONE.sub(foo);

    const exactOut = rmul(outTokenReserve, bar);
    return exactOut;
}

export function calcExactIn(
    inTokenReserve: BN,
    inTokenWeight: BN,
    outTokenReserve: BN,
    outTokenWeight: BN,
    exactOut: BN,
    swapFee: BN
): BN {
    const weightRatio: BN = rdiv(outTokenWeight, inTokenWeight);
    const diff: BN = outTokenReserve.sub(exactOut);
    const y: BN = rdiv(outTokenReserve, diff);
    var foo: BN = rpow(y, weightRatio);

    foo = foo.sub(RONE);
    var exactIn: BN = RONE.sub(swapFee);
    exactIn = rdiv(rmul(inTokenReserve, foo), exactIn);
    return exactIn;
}

export function calcRate(
    inTokenReserve: BN,
    inTokenWeight: BN,
    outTokenReserve: BN,
    outTokenWeight: BN,
    inTokenDecimal: number
): BN {
    return BN.from(10).pow(inTokenDecimal).mul(outTokenReserve).mul(inTokenWeight).div(outTokenWeight).div(inTokenReserve);
}

export function calcAvgRate(
    inAmount: BN,
    outAmount: BN,
    inTokenDecimal: number,
): BN {
    return outAmount.mul(BN.from(10).pow(inTokenDecimal)).div(inAmount);
}

export function calcRateWithSwapFee(
    inTokenReserve: BN,
    inTokenWeight: BN,
    outTokenReserve: BN,
    outTokenWeight: BN,
    outTokenDecimal: number,
    swapFee: BN
): BN {
    const rate: BN = calcRate(inTokenReserve, inTokenWeight, outTokenReserve, outTokenWeight, outTokenDecimal);
    return rate.mul(RONE.sub(swapFee)).div(RONE);
}

export function calcSwapFee(inAmount: BN, swapFee: BN) {
    return inAmount.mul(swapFee).div(RONE);
}

export function calcOtherTokenAmount(
    inTokenReserve: BN,
    outTokenReserve: BN,
    inAmount: BN
): BN {
    return inAmount.mul(outTokenReserve).div(inTokenReserve);
}

export function calcOutAmountLp(
    inAmount: BN,
    inTokenReserve: BN,
    inTokenWeight: BN,
    outTokenReserve: BN,
    swapFee: BN,
    totalSupplyLp: BN
): Record<string, BN> {
    const feePortion: BN = rmul(RONE.sub(inTokenWeight), swapFee);
    const inAmountAfterFee: BN = rmul(inAmount, RONE.sub(feePortion));

    const inBalanceUpdated: BN = inTokenReserve.add(inAmountAfterFee);
    const inTokenRatio: BN = rdiv(inBalanceUpdated, inTokenReserve);

    const lpTokenRatio: BN = rpow(inTokenRatio, inTokenWeight);
    const totalSupplyLpUpdated: BN = rmul(lpTokenRatio, totalSupplyLp);
    const exactOutLp: BN = totalSupplyLpUpdated.sub(totalSupplyLp);

    const inAmountRemained: BN = inTokenReserve.mul(exactOutLp).div(totalSupplyLp);
    const inAmountSwapped: BN = inAmountAfterFee.sub(inAmountRemained);
    const outAmountSwapped: BN = outTokenReserve.mul(exactOutLp).div(totalSupplyLp);
    return {
        exactOutLp,
        swapFee: inAmount.sub(inAmountAfterFee),
        inAmountSwapped,
        outAmountSwapped
    }
}

export function calcPriceImpact(idealRate: BN, actualRate: BN): BigNumber {
    const priceImpact: BigNumber = BigNumber.max(new BigNumber(0), new BigNumber(idealRate.sub(actualRate).toString()).div(idealRate.toString()));
    return priceImpact;
}

export function calcShareOfPool(originalBalance: BN, deltaInBalance: BN): BigNumber {
    return new BigNumber(deltaInBalance.toString()).div(deltaInBalance.add(originalBalance).toString());
}

export function calcOutAmountToken(
    inTokenReserve: BN,
    outTokenReserve: BN,
    outTokenWeight: BN,
    totalSupplyLp: BN,
    inLp: BN,
    swapFee: BN
): Record<string, BN> {
    const nWeight: BN = outTokenWeight;
    const totalSupplyLpUpdated: BN = totalSupplyLp.sub(inLp);
    const lpRatio: BN = rdiv(totalSupplyLpUpdated, totalSupplyLp);

    const outTokenRatio: BN = rpow(lpRatio, rdiv(RONE, nWeight));
    const outTokenBalanceUpdated: BN = rmul(outTokenRatio, outTokenReserve);

    const outAmountTokenBeforeSwapFee: BN = outTokenReserve.sub(outTokenBalanceUpdated);

    const feePortion: BN = rmul(RONE.sub(nWeight), swapFee);
    const exactOutToken: BN = rmul(outAmountTokenBeforeSwapFee, RONE.sub(feePortion));

    const inAmountSwapped: BN = inLp.mul(inTokenReserve).div(totalSupplyLp);
    const outAmountSwapped: BN = outAmountTokenBeforeSwapFee.sub(inLp.mul(outTokenReserve).div(totalSupplyLp));

    return {
        exactOutToken,
        swapFee: outAmountTokenBeforeSwapFee.sub(exactOutToken),
        inAmountSwapped,
        outAmountSwapped
    };
}

export function calcReserveUSDValue(baseTokenAmount: BN, baseTokenDecimal: number, baseTokenPrice: BigNumber, baseTokenWeight: BN): BigNumber {
    return new BigNumber(baseTokenAmount.mul(RONE).div(baseTokenWeight).toString())
        .multipliedBy(baseTokenPrice).div(Math.pow(10, baseTokenDecimal).toString());
}

export function calcSwapFeeAPR(volume: number, swapFee: BN, protocolFee: BN, liquidity: number): BigNumber {
    return new BigNumber(rmul(swapFee, RONE.sub(protocolFee)).toString()).multipliedBy(volume)
        .multipliedBy(365).dividedBy(new BigNumber(RONE.toString()).multipliedBy(liquidity));
}

export function calcTokenPriceByMarket(knownPrice: BigNumber, rate: BN, otherDecimal: number): BigNumber {
    return knownPrice.multipliedBy(rate.toString()).dividedBy(Math.pow(10, otherDecimal));
}

export function calcPrincipalForSLPYT(exchangeRate: BN): BN {
    return rdiv(BN.from(10).pow(18), exchangeRate);
}

export function calcImpliedYield(p: BigNumber, daysLeft: BigNumber): number {
    return Math.pow((ONE.plus(p.dividedBy(ONE.minus(p)))).toNumber(), (new BigNumber(365).dividedBy(daysLeft)).toNumber()) - 1 ;
}

export function calcPrincipalFloat(principalPerYT: BN, ytDecimal: number, underlyingDecimal: number): BigNumber {
    return new BigNumber(principalPerYT.mul(BN.from(10).pow(ytDecimal)).toString())
        .div(new BigNumber(BN.from(10).pow(18 + underlyingDecimal).toString()));
}

export function calcSlippedDownAmount(amount: BN, slippage: number) {
    slippage = Math.trunc(slippage * Math.pow(10, PercentageMaxDecimals));
    return amount.mul(PONE.sub(BN.from(slippage))).div(PONE);
}

export function calcSlippedUpAmount(amount: BN, slippage: number) {
    slippage = Math.trunc(slippage * Math.pow(10, PercentageMaxDecimals));
    return amount.mul(PONE.add(BN.from(slippage))).div(PONE);
}

export function calcValuation(unitPrice: BigNumber, amount: BN, decimals: number): BigNumber {
    return unitPrice.multipliedBy(amount.toString()).dividedBy(BN.from(10).pow(decimals).toString());
}