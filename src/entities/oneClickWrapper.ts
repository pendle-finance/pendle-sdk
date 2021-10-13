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
import { calcOtherTokenAmount, calcShareOfPool, calcSlippedUpAmount, DecimalsPrecision } from "../math/marketMath";
import BigNumber from "bignumber.js";

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
        
        const scaleSimulationResult = async (pendleFixture: PendleFixture, testSimulation: SimulationDetails, desiredTokenAmount: TokenAmount, testTokenAmount: TokenAmount): Promise<SimulationDetails> => {
            const desiredAmount: BN = BN.from(desiredTokenAmount.rawAmount());
            const testAmount: BN = BN.from(testTokenAmount.rawAmount());

            const tokenAmounts: TokenAmount[] = testSimulation.tokenAmounts.map((t: TokenAmount) => new TokenAmount(
                t.token,
                BN.from(t.rawAmount()).mul(desiredAmount).div(testAmount).toString()
            ))

            const transactions: Transaction[] = testSimulation.transactions.map((txn: Transaction): Transaction => {
                return {
                    action: txn.action,
                    user: txn.user,
                    paid: txn.paid.map((t: TokenAmount) => new TokenAmount(
                        t.token,
                        BN.from(t.rawAmount()).mul(desiredAmount).div(testAmount).toString()
                    )),
                    received: txn.received.map((t: TokenAmount) => new TokenAmount(
                        t.token,
                        BN.from(t.rawAmount()).mul(desiredAmount).div(testAmount).toString()
                    )),
                    protocol: txn.protocol
                }
            })
            var otPoolShare: BigNumber, ytPoolShare: BigNumber;

            const otMarketAddLiqTransaction: Transaction | undefined = transactions.find((txn: Transaction) => {
                return txn.action == TransactionAction.addLiquidity && txn.paid.filter((t: TokenAmount) => isSameAddress(t.token.address, pendleFixture.ot.address)).length > 0;
            });
            if (otMarketAddLiqTransaction === undefined) {
                otPoolShare = new BigNumber(0)
            } else {
                const otMarketSupply: BN = await new Contract(pendleFixture.otMarket.address, contracts.UniswapV2Pair.abi, signer.provider).totalSupply();
                otPoolShare = calcShareOfPool(otMarketSupply, BN.from(otMarketAddLiqTransaction.received[0].rawAmount()));
            }
            
            const ytMarketAddLiqTransaction: Transaction | undefined = transactions.find((txn: Transaction) => {
                return txn.action == TransactionAction.addLiquidity && txn.paid.filter((t: TokenAmount) => isSameAddress(t.token.address, pendleFixture.yt.address)).length > 0;
            });
            if (ytMarketAddLiqTransaction === undefined) {
                ytPoolShare = new BigNumber(0)
            } else {
                const ytMarketSupply: BN = await new Contract(pendleFixture.ytMarket.address, contracts.IPendleMarket.abi, signer.provider).totalSupply();
                ytPoolShare = calcShareOfPool(ytMarketSupply, BN.from(ytMarketAddLiqTransaction.received[0].rawAmount()));
            }

            return {
                tokenAmounts: tokenAmounts,
                transactions: transactions,
                poolShares: {
                    otPoolShare: otPoolShare.toFixed(DecimalsPrecision),
                    ytPoolShare: ytPoolShare.toFixed(DecimalsPrecision)
                }
            }
        }

        // The input token is the token that is one of the token in underlying LP, but not the base token in yt/ot market
        const simulateStakeOtWithLonelyTokenInLP = async(pendleFixture: PendleFixture, inputTokenAmount: TokenAmount, slippage: number): Promise<SimulationDetails> => {
            const inAmount: BN = BN.from(inputTokenAmount.rawAmount())
            const user: string = await signer.getAddress();

            const otMarketDetail: OtherMarketDetails = await pendleFixture.otMarket.methods(signer, chainId).readMarketDetails();
            const otTokenIdxInMarket: number = isSameAddress(pendleFixture.ot.address, otMarketDetail.tokenReserves[0].token.address) ? 0 : 1;

            const underlyingLP: Market = Market.find(this.yieldContract.underlyingAsset.address, chainId);
            const underlyingLPDetails: OtherMarketDetails = await (underlyingLP.methods(signer, chainId).readMarketDetails());

            const inputTokenIdxInLP: number = isSameAddress(underlyingLPDetails.tokenReserves[0].token.address, inputTokenAmount.token.address) ? 0 : 1;

            const otherTokenInLP: Token = underlyingLPDetails.tokenReserves[1 ^ inputTokenIdxInLP].token;
            const baseTokenInOtMarket: Token = isSameAddress(pendleFixture.otMarket.tokens[0].address, pendleFixture.ot.address) ? pendleFixture.otMarket.tokens[1] : pendleFixture.otMarket.tokens[0];
            const transactions: Transaction[] = [];
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

            const otytAmounts: TokenAmount[] = this.yieldContract.methods(signer, chainId).mintDetails(outLPAmount);
            transactions.push({
                action: TransactionAction.mint,
                user: user,
                protocol: 'pendle',
                paid: [outLPAmount],
                received: otytAmounts,
            })

            const otAmount: TokenAmount = otytAmounts[0];
            const otReserve: BN = BN.from(otMarketDetail.tokenReserves[otTokenIdxInMarket].rawAmount());
            const otherTokenReserve: BN = BN.from(otMarketDetail.tokenReserves[1 ^ otTokenIdxInMarket].rawAmount());
            const otherTokenInOtMarketAmount: TokenAmount = new TokenAmount(
                baseTokenInOtMarket,
                BN.from(otAmount.rawAmount()).mul(otherTokenReserve).div(otReserve).toString()
            );
            const otMarketLpAmount: TokenAmount = new TokenAmount(
                new Token(
                    pendleFixture.otMarket.address,
                    networkInfo.decimalsRecord[pendleFixture.otMarket.address]
                ),
                BN.from(otMarketDetail.totalSupplyLP).mul(otAmount.rawAmount()).div(otReserve).toString()
            )
            transactions.push({
                action: TransactionAction.addLiquidity,
                user: user,
                protocol: 'external',
                paid: [otAmount, otherTokenInOtMarketAmount],
                received: [otMarketLpAmount]
            });
            const otPoolShare: BigNumber = calcShareOfPool(BN.from(otMarketDetail.totalSupplyLP), BN.from(otMarketLpAmount.rawAmount()));

            transactions.push({
                action: TransactionAction.stake,
                user: user,
                protocol: 'pendle',
                paid: [otMarketLpAmount],
                received: []
            });

            const maxOtherTokenAmount: TokenAmount = new TokenAmount(
                otherTokenInLP,
                calcSlippedUpAmount(BN.from(otherTokenInLPAmount.rawAmount), slippage).add(calcSlippedUpAmount(BN.from(otherTokenInOtMarketAmount.rawAmount()), slippage)).toString()
            )
            
            return {
                tokenAmounts: [inputTokenAmount, maxOtherTokenAmount],
                transactions: transactions,
                poolShares: {
                    otPoolShare: otPoolShare.toFixed(DecimalsPrecision),
                    ytPoolShare: "0"
                }
            }
        }

        const simulateStakeOT = async (pendleFixture: PendleFixture, inputTokenAmount: TokenAmount, slippage: number): Promise<SimulationDetails> => {
            if (isUnderlyingLP()) {
                const baseTokenInOtMarket: Token = isSameAddress(pendleFixture.otMarket.tokens[0].address, pendleFixture.ot.address) ? pendleFixture.otMarket.tokens[1] : pendleFixture.otMarket.tokens[0];
                if (isSameAddress(inputTokenAmount.token.address, baseTokenInOtMarket.address)) { // As the case of Pendle in PE
                    const underlyingLP: Market = Market.find(this.yieldContract.underlyingAsset.address, chainId);

                    const testLonelyTokenAmount: TokenAmount = new TokenAmount(
                        isSameAddress(underlyingLP.tokens[0].address, inputTokenAmount.token.address) ? underlyingLP.tokens[1]: underlyingLP.tokens[0],
                        BN.from(10).pow(18).toString()
                    );
                    const testSimulationResult: SimulationDetails = await simulateStakeOtWithLonelyTokenInLP(pendleFixture, testLonelyTokenAmount, slippage);

                    const testMaxInputAmount: TokenAmount = testSimulationResult.tokenAmounts.find((t: TokenAmount) => isSameAddress(t.token.address, inputTokenAmount.token.address))!;
                    return await scaleSimulationResult(pendleFixture, testSimulationResult, inputTokenAmount, testMaxInputAmount);
                } else { // As the case of ETH in PE
                    return await simulateStakeOtWithLonelyTokenInLP(pendleFixture, inputTokenAmount, slippage);
                }
            } else {
                return dummySimulation;
            }
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