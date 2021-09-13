
import { BigNumber as BN } from "ethers";

const PRECISION_BITS = 40;
export const RONE = BN.from(2).pow(PRECISION_BITS);

export function rmul(x: BN, y: BN): BN {
    return (RONE.div(2)).add(x.mul(y)).div(RONE);
}

export function rdiv(x: BN, y: BN): BN{
    return (y.div(2)).add(x.mul(RONE)).div(y);
}

export function fpart(value: BN): BN {
    return value.mod(RONE);
}

/**
@notice return base^exp with base in FP form and exp in Int
@dev this function use a technique called: exponentiating by squaring
    complexity O(log(q))
@dev function is from Kyber.
@dev base is a FP, exp is an Int, return a FP
    */
export function rpowi(base: BN,exp: BN): BN {
    var res: BN = exp.mod(2).eq(0) ? RONE : base;

    for (exp=exp.div(2); !exp.eq(0); exp=exp.div(2)) {
        base = rmul(base, base);

        if (!exp.mod(2).eq(0)) {
            res = rmul(res, base);
        }
    }
    return res;
}

/**
@notice convert a FP to an Int
@dev value is a FP, return an Int
    */
export function toInt(value: BN): BN{
    return value.div(RONE);
}

/**
@notice find the integer part of log2(p/q)
    => find largest x s.t p >= q * 2^x
    => find largest x s.t 2^x <= p / q
    */
export function log2Int(_p: BN, _q: BN): BN {
    var res: BN = BN.from(0);
    var remain: BN = _p.div(_q);
    while (remain.gt(0)) {
        res=res.add(1);
        remain=remain.div(2);
    }
    return res.sub(1);
}

/**
@notice log2 for a number that it in [1,2)
@dev _x is FP, return a FP
@dev function is from Kyber. Long modified the condition to be (_x >= one) && (_x < two)
to avoid the case where x = 2 may lead to incorrect result
    */
export function log2ForSmallNumber(_x: BN): BN{
    var res: BN = BN.from(0);
    var two: BN = RONE.mul(2);
    var addition: BN = RONE;

    for (var i = PRECISION_BITS; i > 0; i--) {
        _x = (_x.mul(_x)).div(RONE);
        addition = addition.div(2);
        if (_x.gte(two)) {
            _x = _x.div(2);
            res = res.add(addition);
        }
    }

    return res;
}

/**
@notice log2 of (p/q). returns result in FP form
@dev function is from Kyber.
@dev _p & _q is FP, return a FP
    */
export function logBase2(_p: BN, _q: BN): BN {
    var n: BN = BN.from(0);

    if (_p.gt(_q)) {
        n = log2Int(_p, _q);
    }

    const y: BN = (_p.mul(RONE)).div((_q.mul(BN.from(1).shl(n.toNumber()))));
    const log2Small: BN = log2ForSmallNumber(y);

    return n.mul(RONE).add(log2Small);
}

/**
@notice calculate ln(p/q). returned result >= 0
@dev function is from Kyber.
@dev _p & _q is FP, return a FP
*/
export function ln(p: BN, q: BN): BN{
    const ln2Numerator: BN = BN.from('6931471805599453094172');
    const ln2Denomerator: BN = BN.from('10000000000000000000000');

    const log2x: BN = logBase2(p, q);

    return (ln2Numerator.mul(log2x)).div(ln2Denomerator);
}


/**
@notice convert an Int to a FP
@dev value is an Int, return a FP
    */
export function toFP(value: BN): BN {
    return value.mul(RONE);
}

/**
@notice return e^exp in FP form
@dev estimation by formula at http://pages.mtu.edu/~shene/COURSES/cs201/NOTES/chap04/exp.html
    the function is based on exp function of:
    https://github.com/NovakDistributed/macroverse/blob/master/contracts/RealMath.sol
@dev the function is expected to converge quite fast, after about 20 iteration
@dev exp is a FP, return a FP
    */
export function rpowe(exp: BN) : BN{
    var res: BN = BN.from(0);

    var curTerm: BN = RONE;

    for (var n: BN = BN.from(0); ; n = n.add(1)) {
        res = res.add(curTerm);
        curTerm = rmul(curTerm, rdiv(exp, toFP(n.add(1))));
        if (curTerm.eq(0)) {
            break;
        }
    }

    return res;
}

export function rpow(base: BN, exp: BN): BN {
    if (exp.eq(0)) {
        // Anything to the 0 is 1
        return RONE;
    }
    if (base.eq(0)) {
        // 0 to anything except 0 is 0
        return BN.from(0);
    }

    const frac: BN = fpart(exp); // get the fractional part
    const whole: BN = exp.sub(frac);

    const wholePow: BN = rpowi(base, toInt(whole)); // whole is a FP, convert to Int
    var fracPow: BN;

    // instead of calculating base ^ frac, we will calculate e ^ (frac*ln(base))
    if (base.lt(RONE)) {
        /* since the base is smaller than 1.0, ln(base) < 0.
        Since 1 / (e^(frac*ln(1/base))) = e ^ (frac*ln(base)),
        we will calculate 1 / (e^(frac*ln(1/base))) instead.
        */
        const newExp: BN = rmul(frac, ln(rdiv(RONE, base), RONE));
        fracPow = rdiv(RONE, rpowe(newExp));
    } else {
        /* base is greater than 1, calculate normally */
        var newExp: BN = rmul(frac, ln(base, RONE));
        fracPow = rpowe(newExp);
    }
    return rmul(wholePow, fracPow);
}