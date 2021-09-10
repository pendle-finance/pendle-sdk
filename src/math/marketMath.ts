import { rdiv, rpow, RONE, rmul } from './mathLib'
import { BigNumber as BN } from 'ethers';
import bigDecimal from 'js-big-decimal';


export const DecimalsPrecision: number = 10;

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

export function calAvgRate(
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
        exactOutLp: exactOutLp,
        swapFee: inAmount.sub(inAmountAfterFee),
        inAmountSwapped: inAmountSwapped,
        outAmountSwapped: outAmountSwapped
    }
}

export function calcPriceImpact(idealRate: BN, actualRate: BN): bigDecimal {
    const priceImpact: bigDecimal = new bigDecimal(idealRate.sub(actualRate).toString()).divide(new bigDecimal(idealRate.toString()), DecimalsPrecision);
    return priceImpact;
}

export function calcShareOfPool(originalBalance: BN, deltaInBalance: BN): bigDecimal {
    return new bigDecimal(deltaInBalance.toString()).divide(new bigDecimal(deltaInBalance.add(originalBalance).toString()), DecimalsPrecision);
}