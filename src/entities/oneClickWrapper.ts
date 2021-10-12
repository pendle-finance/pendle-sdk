import { providers, BigNumber as BN } from "ethers";
import { AprInfo } from "./stakingPool";
import { dummyAddress, forgeIdsInBytes } from "../constants";
import { dummyTokenAmount, TokenAmount } from './tokenAmount';
import { YieldContract } from "./yieldContract";
import { Ot } from "./ot";
import { Yt } from "./yt";
import { Token } from "./token";
import { Contract } from "ethers";
import { StakingPool } from "./stakingPool";
import { LMINFO, MARKETINFO, NetworkInfo, PENDLEMARKETNFO } from "../networks";
import { distributeConstantsByNetwork, getABIByForgeId, isSameAddress } from "../helpers";
import { contracts } from "../contracts";
import { PendleMarket, Market, OtherMarketDetails } from "./market";
import { calcOtherTokenAmount } from "../math/marketMath";

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

export type Transaction = {
    action: TransactionAction,
    user: string,
    paid: TokenAmount[], // required
    received: TokenAmount[], // required
    protocol: 'pendle' | 'external'
}

export type SimulationDetails = {
    tokenAmounts: TokenAmount[],
    transactions: Transaction[],
    poolShares: {
        otPoolShare: string
        ytPoolShare: string
    }
}

export type WrapperAPRInfo = {
    totalApr: string
    composition: {
        otPoolApr: AprInfo[]
        ytPoolApr: AprInfo[]
    }
}

export type PendleFixture = {
    yieldContract: YieldContract,
    ot: Ot,
    yt: Yt,
    forge: Contract,
    data: Contract,
    ytMarket: PendleMarket,
    otMarket: Market,
    otStakingPool: StakingPool,
    ytStakingPool: StakingPool
}

const dummyTransaction: Transaction = {
    action: TransactionAction.mint,
    user: dummyAddress,
    paid: [dummyTokenAmount, dummyTokenAmount],
    received: [dummyTokenAmount, dummyTokenAmount],
    protocol: "pendle"
}
const dummySimulation = {
    tokenAmounts: [dummyTokenAmount],
    transactions: [dummyTransaction],
    poolShares: {
        otPoolShare: '0.5',
        ytPoolShare: '0.5'
    }
}


export class OneClickWrapper {

    public readonly yieldContract: YieldContract

    public constructor(yieldContract: YieldContract) {
        this.yieldContract = yieldContract;
    }

    public methods(signer: providers.JsonRpcSigner, chainId?: number): Record<string, any> {

        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const pendleDataContract = new Contract(networkInfo.contractAddresses.misc.PendleData, contracts.IPendleData.abi, signer.provider);
        const forgeAddress = networkInfo.contractAddresses.forges[this.yieldContract.forgeIdInBytes];
        const pendleForgeContract = new Contract(forgeAddress, getABIByForgeId(this.yieldContract.forgeIdInBytes).abi, signer.provider);

        const isUnderlyingLP = (): boolean => {
            return this.yieldContract.forgeIdInBytes == forgeIdsInBytes.SUSHISWAP_SIMPLE || this.yieldContract.forgeIdInBytes == forgeIdsInBytes.SUSHISWAP_COMPLEX;
        }

        const getPendleFixture = async (): Promise<PendleFixture> => {
            const otAddress: string = await pendleDataContract.otTokens(this.yieldContract.forgeIdInBytes, this.yieldContract.underlyingAsset, this.yieldContract.expiry);
            const ytAddress: string = await pendleDataContract.xytTokens(this.yieldContract.forgeIdInBytes, this.yieldContract.underlyingAsset, this.yieldContract.expiry);
            const ot: Ot = Ot.find(otAddress, chainId);
            const yt: Yt = Yt.find(ytAddress, chainId);
            const ytMarketAddress: string = networkInfo.contractAddresses.pendleMarkets.find((m: PENDLEMARKETNFO) => {
                return isSameAddress(m.pair[0], ytAddress) || isSameAddress(m.pair[1], ytAddress)
            })!.address;
            const ytMarket: PendleMarket = PendleMarket.find(ytMarketAddress, chainId);
            const otMarketAddress: string = networkInfo.contractAddresses.otherMarkets!.find((m: MARKETINFO) => {
                return isSameAddress(m.pair[0], ytAddress) || isSameAddress(m.pair[1], ytAddress)
            })!.address;
            const otMarket: Market = Market.find(otMarketAddress, chainId);
            const ytStakingPoolInfo: LMINFO = networkInfo.contractAddresses.stakingPools.find((lm: LMINFO) => {
                return isSameAddress(lm.inputTokenAddress, ytMarketAddress);
            })!;
            const ytStakingPool: StakingPool = StakingPool.find(ytStakingPoolInfo.address, ytStakingPoolInfo.inputTokenAddress, chainId);
            const otStakingPoolInfo: LMINFO = networkInfo.contractAddresses.stakingPools.find((lm: LMINFO) => {
                return isSameAddress(lm.inputTokenAddress, otMarketAddress);
            })!;
            const otStakingPool: StakingPool = StakingPool.find(otStakingPoolInfo.address, otStakingPoolInfo.inputTokenAddress, chainId);
            return {
                yieldContract: this.yieldContract,
                data: pendleDataContract,
                forge: pendleForgeContract,
                ot: ot,
                yt: yt,
                ytMarket: ytMarket,
                otMarket: otMarket,
                ytStakingPool: ytStakingPool,
                otStakingPool: otStakingPool
            };
        }

        const simulateStakeOT = async (pendleFixture: PendleFixture, inputTokenAmount: TokenAmount, slippage: number): Promise<SimulationDetails> => {
            const user: string = await signer.getAddress();
            const inAmount: BN = BN.from(inputTokenAmount.rawAmount());
            const transactions: Transaction[] = [];

            const otMarketDetail: OtherMarketDetails = await pendleFixture.otMarket.methods(signer, chainId).readMarketDetails();
            const otRate: BN = isSameAddress(pendleFixture.otMarket.tokens[0].address, pendleFixture.ot.address) ? BN.from(otMarketDetail.rates[0]) : BN.from(otMarketDetail.rates[1]);

            if (isUnderlyingLP()) {
                const underlyingLP: Market = Market.find(this.yieldContract.underlyingAsset.address, chainId);
                const underlyingLPDetails: OtherMarketDetails = await (underlyingLP.methods(signer, chainId).readMarketDetails());
                
                const inputTokenIdxInLP: number = isSameAddress(underlyingLPDetails.tokenReserves[0].token.address, inputTokenAmount.token.address) ? 0 : 1;

                const otherTokenInLP: Token = underlyingLPDetails.tokenReserves[1 ^ inputTokenIdxInLP].token;
                const baseTokenInOtMarket: Token = isSameAddress(pendleFixture.otMarket.tokens[0].address, pendleFixture.ot.address) ? pendleFixture.otMarket.tokens[1]: pendleFixture.otMarket.tokens[0];
                
                if (isSameAddress(inputTokenAmount.token.address, baseTokenInOtMarket.address)) { // As the case of Pendle in PE

                } else { // As the case of ETH in PE
                    const otherTokenInLPAmount: TokenAmount = new TokenAmount(
                        otherTokenInLP, 
                        calcOtherTokenAmount(
                            BN.from(underlyingLPDetails.tokenReserves[inputTokenIdxInLP].rawAmount()),
                            BN.from(underlyingLPDetails.tokenReserves[1 ^ inputTokenIdxInLP].rawAmount()),
                            inAmount
                        ).toString()
                    );
                    const outLPAmount: TokenAmount = new TokenAmount(
                        new Token(
                            underlyingLP.address,
                            networkInfo.decimalsRecord[underlyingLP.address]
                        ),
                        inAmount.mul(BN.from(underlyingLPDetails.totalSupplyLP)).div(underlyingLPDetails.tokenReserves[inputTokenIdxInLP].rawAmount()).toString()
                    )
                    transactions.push({
                        action: TransactionAction.preMint,
                        user: user,
                        protocol: 'external',
                        paid: [
                            inputTokenAmount,
                            otherTokenInLPAmount
                        ],
                        received: [
                            outLPAmount
                        ]
                    });
                    
                }
            } else {
                return dummySimulation;
            }
            return dummySimulation;
        }

        const simulate = async (action: Action, inputTokenAmount: TokenAmount, slippage: number): Promise<SimulationDetails> => {
            const pendleFixture: PendleFixture = await getPendleFixture();
            switch (action) {
                case Action.stakeOT:
                    return simulateStakeOT(pendleFixture, inputTokenAmount, slippage);
            }
            return dummySimulation
        }

        const send = async (_: Action, __: TokenAmount[], ___: number): Promise<providers.TransactionResponse> => {
            return {} as providers.TransactionResponse;
        }

        const apr = async (_: Action): Promise<WrapperAPRInfo> => {
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