import { providers } from "ethers";
import { AprInfo } from "./stakingPool";
import { dummyAddress } from "../constants";
import { dummyTokenAmount, TokenAmount } from './tokenAmount';
import { YieldContract } from "./yieldContract";

export enum Action {
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

export type SimulationDetails = {
    tokenAmounts: TokenAmount[],
    transactions: Transaction[],
    poolShares: {
        otPoolShare: string
        ytPoolShare: string
    }
}

export type Transaction = {
    action: TransactionAction,
    user: string,
    paid: TokenAmount[], // required
    received: TokenAmount[], // required
    protocol: 'pendle' | 'external'
}

export type WrapperAPRInfo = {
    totalApr: string
    composition: {
        otPoolApr: AprInfo[]
        ytPoolApr: AprInfo[]
    }
}

const dummyTransaction: Transaction = {
    action: TransactionAction.mint,
    user: dummyAddress,
    paid: [dummyTokenAmount, dummyTokenAmount],
    received: [dummyTokenAmount, dummyTokenAmount],
    protocol: "pendle"
}

class OneClickWrapper {

    public readonly yieldContract: YieldContract

    public constructor(yieldContract: YieldContract) {
        this.yieldContract = yieldContract;
    }

    public methods(_: providers.JsonRpcSigner, __?: number): Record<string, any> {
        const simulate = async (_: Action, __: TokenAmount, ___: number): Promise<SimulationDetails> => {
            return {
                tokenAmounts: [dummyTokenAmount],
                transactions: [dummyTransaction],
                poolShares: {
                    otPoolShare: '0.5',
                    ytPoolShare: '0.5'
                }
            }
        }

        const send = async(_:Action, __:TokenAmount[], ___:number): Promise<providers.TransactionResponse> => {
            return {} as providers.TransactionResponse;
        }

        const apr = async(_: Action): Promise<WrapperAPRInfo> => {
            return {
                totalApr: "1",
                composition: {
                    otPoolApr: [{
                        apr: "0.5",
                        origin: "Avax incentives"
                    }],
                    ytPoolApr: [{
                        apr: '0.5',
                        origin: "Joe rewards"
                    }]
                }
            }
        }

        return {
            simulate,
            send,
            apr
        }
    }
}