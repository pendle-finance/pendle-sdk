
import { BigNumber as BN } from "ethers";

const RONE = BN.from(2).pow(40);

export function rmul(x: BN, y: BN): BN {
    return (RONE.div(2)).add(x.mul(y)).div(RONE);
}

export function rdiv(x: BN, y: BN): BN{
    return (y.div(2)).add(x.mul(RONE)).div(y);
}