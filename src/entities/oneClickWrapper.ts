import { TokenAmount, YieldContract } from ".";

export enum action {
    stakeOT,
    stakeYT,
    stakeOTYT
}

export enum TransactionAction {
    preMint,
    mint,
    redeem,
    addLiquidity,
    removeLiquidity,
    swap,
    stake,
    unstake
}

type Transaction = {
    action: TransactionAction,
    user: string,
    paid: TokenAmount[], // required
    received: TokenAmount[], // required
    protocol: 'pendle' | 'external'
}

class OneClickWrapper {
}