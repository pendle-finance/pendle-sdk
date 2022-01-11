import { providers, BigNumber as BN, utils } from "ethers";
import { AprInfo, ChainSpecifics } from "./types";
import { dummyAddress, forgeIdsInBytes, zeroAddress, ONE_MINUTE, ETHAddress, ZERO } from "../constants";
import { dummyTokenAmount, TokenAmount } from './tokenAmount';
import { YieldContract } from "./yieldContract";
import { Ot } from "./ot";
import { Yt } from "./yt";
import { Token, ETHToken } from "./token";
import { Contract } from "ethers";
import { StakingPool } from "./stakingPool";
import { LMINFO, MARKETINFO, NetworkInfo, PENDLEMARKETNFO } from "../networks";
import { distributeConstantsByNetwork, getABIByForgeId, getCurrentTimestamp, isSameAddress, submitTransaction, decimalFactor, getOutTokenAddress, isNativeOrEquivalent } from "../helpers";
import { contracts } from "../contracts";
import { PendleMarket, Market, OtherMarketDetails, AddDualLiquidityDetails } from "./market";
import { calcOtherTokenAmount, calcShareOfPool, calcSlippedDownAmount, calcSlippedUpAmount, DecimalsPrecision, PercentageMaxDecimals } from "../math/marketMath";
import BigNumber from "bignumber.js";
import { fetchValuation } from "../fetchers/priceFetcher";
import { CurrencyAmount, ZeroCurrencyAmount } from "./currencyAmount";
import { MasterChef } from "./masterChef";
import { cdiv, rdiv } from "../math/mathLib"
import { Comptroller } from "./comptroller";
import { Trade, computeTradeRouteExactOut, computeTradeRouteExactIn } from "./tradeRouteProducer";
import { 
    PendleZapEstimatorSingle, 
    SingleTokenZapDataStruct,
    SwapInfoStructOutput,
    BaseSplitStructOutput
} from "@pendle/core/typechain-types/PendleZapEstimatorSingle";
import { PAPReservesStructOutput, DoubleTokenZapDataStruct } from "@pendle/core/typechain-types/PendleZapEstimatorPAP";
import { 
    PendleWrapper,
    DataPullStruct,
    DataSwapStruct,
    PairTokenAmountStruct,
    DataAddLiqOTStruct,
    DataAddLiqYTStruct,
    DataTknzSingleStruct,
    DataAddLiqJoeStruct as DataAddLiqUniFork,
    DataTknzStruct
} from "@pendle/core/typechain-types/PendleWrapper";

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
    unstake,
    wrap,
    unwrap
}

export type Transaction = {
    action: TransactionAction,
    user?: string,
    paid: TokenAmount[], // required
    maxPaid: TokenAmount[],
    received: TokenAmount[], // required
    protocol: 'pendle' | 'external'
}

export type SimulationDetails = {
    tokenAmounts: TokenAmount[],
    transactions: Transaction[],
    poolShares: {
        otPoolShare: string
        ytPoolShare: string
    },
    dataPull: DataPullStruct
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
    maxPaid: [dummyTokenAmount, dummyTokenAmount],
    received: [dummyTokenAmount, dummyTokenAmount],
    protocol: "pendle"
}

const forgeIdToMode: Record<string, number> = {
    [forgeIdsInBytes.BENQI]: 0,
    [forgeIdsInBytes.JOE_COMPLEX]: 1,
    [forgeIdsInBytes.JOE_SIMPLE]: 1,
    [forgeIdsInBytes.XJOE]: 2,
    [forgeIdsInBytes.WONDERLAND]: 3
}

export const dummyDataTknzSingle: DataTknzSingleStruct = {
    token: zeroAddress,
    amount: '0'
}
export const dummyDataAddLiqUniFork: DataAddLiqUniFork = {
    tokenA: zeroAddress,
    tokenB: zeroAddress,
    amountADesired: '0',
    amountBDesired: '0',
    amountAMin: '0',
    amountBMin: '0',
    deadline: 0
}

export type EstimatorPAPReseult = {
    wavaxInfo: SwapInfoStructOutput;
    pendleInfo: SwapInfoStructOutput;
    amountToMintLP: PAPReservesStructOutput;
    split: BaseSplitStructOutput;
  }
export type EstimatorSingleResult = {
    underInfo: SwapInfoStructOutput;
    baseInfo: SwapInfoStructOutput;
    split: BaseSplitStructOutput;
}

export class OneClickWrapper {

    public readonly yieldContract: YieldContract

    public constructor(yieldContract: YieldContract) {
        this.yieldContract = yieldContract;
    }

    public methods({signer, provider, chainId}: ChainSpecifics): Record<string, any> {

        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const pendleDataContract = new Contract(networkInfo.contractAddresses.misc.PendleData, contracts.IPendleData.abi, provider);
        const forgeAddress = networkInfo.contractAddresses.forges[this.yieldContract.forgeIdInBytes];
        const pendleForgeContract = new Contract(forgeAddress, getABIByForgeId(this.yieldContract.forgeIdInBytes).abi, provider);
        const PendleWrapper = new Contract(networkInfo.contractAddresses.misc.PendleWrapper, contracts.PendleWrapper.abi, provider) as PendleWrapper;
        const zapEstimatorSingle: PendleZapEstimatorSingle = new Contract(networkInfo.contractAddresses.misc.PendleZapEstimatorSingle, contracts.PendleZapEstimatorSingle.abi, provider) as PendleZapEstimatorSingle;
        const zapEstimatorPAP = new Contract(networkInfo.contractAddresses.misc.PendleZapEstimatorPAP, contracts.PendleZapEstimatorPAP.abi, provider);

        const isUnderlyingLP = (): boolean => {
            return this.yieldContract.forgeIdInBytes == forgeIdsInBytes.SUSHISWAP_SIMPLE || this.yieldContract.forgeIdInBytes == forgeIdsInBytes.SUSHISWAP_COMPLEX
                || this.yieldContract.forgeIdInBytes == forgeIdsInBytes.JOE_SIMPLE || this.yieldContract.forgeIdInBytes == forgeIdsInBytes.JOE_COMPLEX;
        }

        const getAddOtLiqTxn = (txns: Transaction[], pendleFixture: PendleFixture): Transaction | undefined => {
            return txns.find((txn: Transaction) => {
                return txn.action == TransactionAction.addLiquidity && txn.paid.filter((t: TokenAmount) => isSameAddress(t.token.address, pendleFixture.ot.address)).length > 0;
            });
        }

        const getAddYtLiqTxn = (txns: Transaction[], pendleFixture: PendleFixture): Transaction | undefined => {
            return txns.find((txn: Transaction) => {
                return txn.action == TransactionAction.addLiquidity && txn.paid.filter((t: TokenAmount) => isSameAddress(t.token.address, pendleFixture.yt.address)).length > 0;
            });
        }

        const getPendleFixture = async (): Promise<PendleFixture> => {
            const otAddress: string = await pendleDataContract.otTokens(this.yieldContract.forgeIdInBytes, this.yieldContract.underlyingAsset.address, this.yieldContract.expiry);
            const ytAddress: string = await pendleDataContract.xytTokens(this.yieldContract.forgeIdInBytes, this.yieldContract.underlyingAsset.address, this.yieldContract.expiry);
            const ot: Ot = Ot.find(otAddress, chainId);
            const yt: Yt = Yt.find(ytAddress, chainId);
            const ytMarketAddress: string = networkInfo.contractAddresses.pendleMarkets.find((m: PENDLEMARKETNFO) => {
                return isSameAddress(m.pair[0], ytAddress) || isSameAddress(m.pair[1], ytAddress)
            })!.address;
            const ytMarket: PendleMarket = PendleMarket.find(ytMarketAddress, chainId);
            const otMarketAddress: string = networkInfo.contractAddresses.otherMarkets!.find((m: MARKETINFO) => {
                return isSameAddress(m.pair[0], otAddress) || isSameAddress(m.pair[1], otAddress)
            })!.address;
            const otMarket: Market = Market.find(otMarketAddress, chainId);
            const ytStakingPoolInfo: LMINFO = networkInfo.contractAddresses.stakingPools.find((lm: LMINFO) => {
                return isSameAddress(lm.inputTokenAddress, ytMarketAddress) && lm.active;
            })!;
            const ytStakingPool: StakingPool = StakingPool.find(ytStakingPoolInfo.address, ytStakingPoolInfo.inputTokenAddress, chainId);
            const otStakingPoolInfo: LMINFO = networkInfo.contractAddresses.stakingPools.find((lm: LMINFO) => {
                return isSameAddress(lm.inputTokenAddress, otMarketAddress) && lm.active;
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

        const getDeadline = async(): Promise<number> => {
            const currentTime: BN = BN.from(await getCurrentTimestamp(provider));
            return currentTime.add(ONE_MINUTE.mul(60).mul(3)).toNumber();
        }

        const getOtYtPoolShares = async({
            pendleFixture,
            transactions,
        }: {
            pendleFixture: PendleFixture,
            transactions: Transaction[]
        }): Promise<{
            otPoolShare: string,
            ytPoolShare: string
        }> => {
            var otPoolShare: BigNumber, ytPoolShare: BigNumber;

            const otMarketAddLiqTransaction: Transaction | undefined = getAddOtLiqTxn(transactions, pendleFixture);
            if (otMarketAddLiqTransaction === undefined) {
                otPoolShare = new BigNumber(0)
            } else {
                const otMarketSupply: BN = await new Contract(pendleFixture.otMarket.address, contracts.UniswapV2Pair.abi, provider).totalSupply();
                otPoolShare = calcShareOfPool(otMarketSupply, BN.from(otMarketAddLiqTransaction.received[0].rawAmount()));
            }

            const ytMarketAddLiqTransaction: Transaction | undefined = getAddYtLiqTxn(transactions, pendleFixture);
            if (ytMarketAddLiqTransaction === undefined) {
                ytPoolShare = new BigNumber(0)
            } else {
                const ytMarketSupply: BN = await new Contract(pendleFixture.ytMarket.address, contracts.IPendleMarket.abi, provider).totalSupply();
                ytPoolShare = calcShareOfPool(ytMarketSupply, BN.from(ytMarketAddLiqTransaction.received[0].rawAmount()));
            }
            return {
                otPoolShare: otPoolShare.toFixed(DecimalsPrecision),
                ytPoolShare: ytPoolShare.toFixed(DecimalsPrecision)
            }
        }

        const scaleDualSimulationResult = async (pendleFixture: PendleFixture, testSimulation: SimulationDetails, desiredTokenAmount: TokenAmount, testTokenAmount: TokenAmount): Promise<SimulationDetails> => {
            
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
                    maxPaid: txn.maxPaid.map((t: TokenAmount) => new TokenAmount(
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

            const dataPull: DataPullStruct = {
                swaps: [],
                pulls: testSimulation.dataPull.pulls.map((p: PairTokenAmountStruct): PairTokenAmountStruct => {
                    return {
                        token: p.token,
                        amount: BN.from(p.amount).mul(desiredAmount).div(testAmount).toString()
                    }
                }),
                deadline: testSimulation.dataPull.deadline
            }

            return {
                tokenAmounts: tokenAmounts,
                transactions: transactions,
                poolShares: await getOtYtPoolShares({pendleFixture, transactions}),
                dataPull
            }
        }

        const populateTransactionsFromPreMint = async({
            action,
            pendleFixture,
            slippage,
            underlyingAmount0,
            underlyingAmount1,
            baseTokenAmountOT,
            baseTokenAmountYT,
            walletAddress
        }: {
            action: Action,
            pendleFixture: PendleFixture,
            slippage: number,
            underlyingAmount0: TokenAmount,
            underlyingAmount1?: TokenAmount,
            baseTokenAmountOT?: TokenAmount,
            baseTokenAmountYT?: TokenAmount,
            walletAddress?: string
        }): Promise<Transaction[]> => {
            var transactions: Transaction[] = [];
            switch (this.yieldContract.forgeIdInBytes) {
                case forgeIdsInBytes.JOE_COMPLEX:
                case forgeIdsInBytes.JOE_SIMPLE:
                    const underlyingLp: Market = Market.find(this.yieldContract.underlyingAsset.address, chainId);
                    const underlyingLPDetails: OtherMarketDetails = await (underlyingLp.methods({signer, provider, chainId}).readMarketDetails());
                    const testInutTokenIdxInLP: number = isSameAddress(underlyingLPDetails.tokenReserves[0].token.address, underlyingAmount0.token.address) ? 0 : 1;

                    if (underlyingAmount1 === undefined) {
                        const otherTokenInLP: Token = underlyingLPDetails.tokenReserves[1 ^ testInutTokenIdxInLP].token;

                        const otherTokenInLPAmount: TokenAmount = new TokenAmount(
                            otherTokenInLP,
                            calcOtherTokenAmount(
                                BN.from(underlyingLPDetails.tokenReserves[testInutTokenIdxInLP].rawAmount()),
                                BN.from(underlyingLPDetails.tokenReserves[1 ^ testInutTokenIdxInLP].rawAmount()),
                                BN.from(underlyingAmount0.rawAmount())
                            ).toString()
                        );
                        var outYieldTokenAmount = new TokenAmount(
                            new Token(
                                underlyingLp.address,
                                networkInfo.decimalsRecord[underlyingLp.address]
                            ),
                            BN.from(underlyingAmount0.rawAmount()).mul(BN.from(underlyingLPDetails.otherDetails.totalSupplyLP))
                            .div(underlyingLPDetails.tokenReserves[testInutTokenIdxInLP].rawAmount()).toString()
                        )
                        transactions.push({
                            action: TransactionAction.preMint,
                            user: walletAddress,
                            protocol: 'external',
                            paid: [
                                underlyingAmount0,
                                otherTokenInLPAmount
                            ],
                            maxPaid: [
                                underlyingAmount0,
                                otherTokenInLPAmount
                            ],
                            received: [
                                outYieldTokenAmount
                            ]
                        });
                    } else {
                        var outYieldTokenAmount = new TokenAmount(
                            new Token(
                                underlyingLp.address,
                                networkInfo.decimalsRecord[underlyingLp.address]
                            ),
                            BN.from(underlyingAmount0.rawAmount()).mul(BN.from(underlyingLPDetails.otherDetails.totalSupplyLP))
                            .div(underlyingLPDetails.tokenReserves[testInutTokenIdxInLP].rawAmount()).toString()
                        )
                        transactions.push({
                            action: TransactionAction.preMint,
                            user: walletAddress,
                            protocol: 'external',
                            paid: [
                                underlyingAmount0,
                                underlyingAmount1
                            ],
                            maxPaid: [
                                underlyingAmount0,
                                underlyingAmount1
                            ],
                            received: [
                                outYieldTokenAmount
                            ]
                        });
                    }
                    break;

                case forgeIdsInBytes.BENQI:
                case forgeIdsInBytes.XJOE:
                case forgeIdsInBytes.WONDERLAND:
                    const underlyingAddress: string = this.yieldContract.underlyingAsset.address;
                    const exchangeRate: BN = await pendleForgeContract.connect(provider).callStatic.getExchangeRate(underlyingAddress, { from: networkInfo.contractAddresses.misc.PendleRouter });
                    outYieldTokenAmount = new TokenAmount(
                        this.yieldContract.yieldToken,
                        this.yieldContract.useCompoundMath() 
                            ? cdiv(BN.from(underlyingAmount0.rawAmount()), exchangeRate).toString() 
                            : rdiv(BN.from(underlyingAmount0.rawAmount()), exchangeRate).toString()
                    )
                    transactions.push({
                        action: TransactionAction.preMint,
                        user: walletAddress,
                        protocol: "external",
                        paid: [underlyingAmount0],
                        maxPaid: [underlyingAmount0],
                        received: [outYieldTokenAmount]
                    })
                    break;

                default:
                    throw new Error(`Unsupported forge: ${this.yieldContract.forgeId} in OneClickWrapper`);
            }

            const otytAmounts: TokenAmount[] = await this.yieldContract.methods({signer, provider, chainId}).mintDetails(outYieldTokenAmount);
            transactions.push({
                action: TransactionAction.mint,
                user: walletAddress,
                protocol: 'pendle',
                paid: [outYieldTokenAmount],
                maxPaid: [outYieldTokenAmount],
                received: otytAmounts,
            })

            if (action == Action.stakeOT || action == Action.stakeOTYT) {
                const otMarketDetail: OtherMarketDetails = await pendleFixture.otMarket.methods({signer, provider, chainId}).readMarketDetails();
                const otTokenIdxInMarket: number = isSameAddress(pendleFixture.ot.address, otMarketDetail.tokenReserves[0].token.address) ? 0 : 1;
                const otAmount: TokenAmount = otytAmounts[0];
                const otReserve: BN = BN.from(otMarketDetail.tokenReserves[otTokenIdxInMarket].rawAmount());
                
                if (baseTokenAmountOT === undefined) {
                    const baseTokenReserve: BN = BN.from(otMarketDetail.tokenReserves[1 ^ otTokenIdxInMarket].rawAmount());
                    const baseTokenInOtMarket: Token = isSameAddress(pendleFixture.otMarket.tokens[0].address, pendleFixture.ot.address) ? pendleFixture.otMarket.tokens[1] : pendleFixture.otMarket.tokens[0];
                    baseTokenAmountOT = new TokenAmount(
                        baseTokenInOtMarket,
                        BN.from(otAmount.rawAmount()).mul(baseTokenReserve).div(otReserve).toString()
                    );
                }
                const otMarketLpAmount: TokenAmount = new TokenAmount(
                    new Token(
                        pendleFixture.otMarket.address,
                        networkInfo.decimalsRecord[pendleFixture.otMarket.address]
                    ),
                    BN.from(otMarketDetail.otherDetails.totalSupplyLP).mul(otAmount.rawAmount()).div(otReserve).toString()
                )
                transactions.push({
                    action: TransactionAction.addLiquidity,
                    user: walletAddress,
                    protocol: 'external',
                    paid: [otAmount, baseTokenAmountOT],
                    maxPaid: [
                        otAmount,
                        new TokenAmount(
                            baseTokenAmountOT.token,
                            calcSlippedUpAmount(BN.from(baseTokenAmountOT.rawAmount()), slippage).toString()
                        )
                    ],
                    received: [otMarketLpAmount]
                });

                transactions.push({
                    action: TransactionAction.stake,
                    user: walletAddress,
                    protocol: 'pendle',
                    paid: [otMarketLpAmount],
                    maxPaid: [otMarketLpAmount],
                    received: []
                });
            }

            if (action == Action.stakeYT || action == Action.stakeOTYT) {
                const addDualDetails: AddDualLiquidityDetails = await pendleFixture.ytMarket.methods({signer, provider, chainId}).addDualDetails(otytAmounts[1]);
                if (baseTokenAmountYT === undefined) {
                    baseTokenAmountYT = addDualDetails.otherTokenAmount;
                }
                const ytMarketLpAmount: TokenAmount = new TokenAmount(
                    new Token(
                        pendleFixture.ytMarket.address,
                        networkInfo.decimalsRecord[pendleFixture.ytMarket.address]
                    ),
                    addDualDetails.lpMinted
                )
                transactions.push({
                    action: TransactionAction.addLiquidity,
                    user: walletAddress,
                    protocol: 'pendle',
                    paid: [otytAmounts[1], baseTokenAmountYT],
                    maxPaid: [
                        otytAmounts[1],
                        new TokenAmount(
                            baseTokenAmountYT.token,
                            calcSlippedUpAmount(BN.from(baseTokenAmountYT.rawAmount()), slippage).toString()
                        )
                    ],
                    received: [ytMarketLpAmount]
                });

                transactions.push({
                    action: TransactionAction.stake,
                    user: walletAddress,
                    protocol: 'pendle',
                    paid: [ytMarketLpAmount],
                    maxPaid: [ytMarketLpAmount],
                    received: []
                });
            };

            return transactions;
        }

        const simulateWithFixedInput = async (action: Action, pendleFixture: PendleFixture, fixedInputAmount: TokenAmount, slippage: number, walletAddress?: string): Promise<SimulationDetails> => {
            var transactions: Transaction[] = [];

            if (this.yieldContract.forgeIdInBytes == forgeIdsInBytes.WONDERLAND && isSameAddress(fixedInputAmount.token.address, networkInfo.contractAddresses.tokens.TIME)) {
                const MEMOAmount: TokenAmount = new TokenAmount(
                    new Token(
                        networkInfo.contractAddresses.tokens.MEMO,
                        networkInfo.decimalsRecord[networkInfo.contractAddresses.tokens.MEMO]
                    ),
                    fixedInputAmount.rawAmount()
                )
                transactions.push({
                    action: TransactionAction.stake,
                    paid: [fixedInputAmount],
                    maxPaid: [fixedInputAmount],
                    received: [MEMOAmount],
                    user: walletAddress,
                    protocol: "external"
                });
                fixedInputAmount = MEMOAmount;
            }

            transactions = transactions.concat(await populateTransactionsFromPreMint({
                action,
                pendleFixture,
                slippage,
                underlyingAmount0: fixedInputAmount,
                walletAddress
            }))

            const tokenMap: Map<string, BN> = new Map();
            transactions.forEach((txn: Transaction) => {
                txn.maxPaid.forEach((t: TokenAmount) => {
                    if (tokenMap.has(t.token.address)) {
                        tokenMap.set(t.token.address, tokenMap.get(t.token.address)!.add(t.rawAmount()))
                    } else {
                        tokenMap.set(t.token.address, BN.from(t.rawAmount()));
                    }
                })
            })
            transactions.forEach((txn: Transaction) => {
                txn.received.forEach((t: TokenAmount) => {
                    if (tokenMap.has(t.token.address)) {
                        tokenMap.set(t.token.address, tokenMap.get(t.token.address)!.sub(t.rawAmount()))
                    }
                })
            })
            const finalTokenAmounts: TokenAmount[] = [];
            tokenMap.forEach((amount: BN, t: string) => {
                if (amount.gt(0)) {
                    finalTokenAmounts.push(new TokenAmount(new Token(t, networkInfo.decimalsRecord[t]), amount.toString()));
                }
            })

            return {
                tokenAmounts: finalTokenAmounts,
                transactions: transactions,
                poolShares: {
                    otPoolShare: '0',
                    ytPoolShare: '0'
                },
                dataPull: {
                    swaps: [],
                    pulls: finalTokenAmounts.map((t: TokenAmount): PairTokenAmountStruct => {
                        return {
                            token: t.token.address,
                            amount: t.rawAmount()
                        }
                    }),
                    deadline: await getDeadline()
                }
            }
        }

        const wrapEth = (tokenAmount: TokenAmount): TokenAmount => {
            if (isSameAddress(tokenAmount.token.address, ETHAddress)) {
                return new TokenAmount(
                    new Token(
                        networkInfo.contractAddresses.tokens.WETH,
                        networkInfo.decimalsRecord[networkInfo.contractAddresses.tokens.WETH]
                    ),
                    tokenAmount.rawAmount()
                )
            } else {
                return tokenAmount;
            }
        }

        const wrapEthInTransaction = (txn: Transaction): Transaction => {
            return {
                action: txn.action,
                paid: txn.paid.map(wrapEth),
                maxPaid: txn.maxPaid.map(wrapEth),
                received: txn.received.map(wrapEth),
                user: txn.user,
                protocol: txn.protocol
            }
        }

        const unwrapEth = (tokenAmount: TokenAmount): TokenAmount => {
            if (isSameAddress(tokenAmount.token.address, networkInfo.contractAddresses.tokens.WETH)) {
                return new TokenAmount(
                    new Token(
                        ETHAddress,
                        networkInfo.decimalsRecord[networkInfo.contractAddresses.tokens.WETH]
                    ),
                    tokenAmount.rawAmount()
                )
            } else {
                return tokenAmount;
            }
        }

        const unwrapEthInTransaction = (txn: Transaction): Transaction => {
            return {
                action: txn.action,
                paid: txn.paid.map(unwrapEth),
                maxPaid: txn.maxPaid.map(unwrapEth),
                received: txn.received.map(unwrapEth),
                user: txn.user,
                protocol: txn.protocol
            }
        }

        const unwrapEthInPathStartingToken = (path: string[]): string[] => {
            if (isSameAddress(networkInfo.contractAddresses.tokens.WETH, path[0])) {
                path[0] = ETHAddress;
            }
            return path;
        }

        const unwrapEthInSimulation = (simulation: SimulationDetails): SimulationDetails => {
            return {
                tokenAmounts: simulation.tokenAmounts.map(unwrapEth),
                transactions: simulation.transactions.map(unwrapEthInTransaction),
                poolShares: {
                    otPoolShare: simulation.poolShares.otPoolShare,
                    ytPoolShare: simulation.poolShares.ytPoolShare
                },
                dataPull: {
                    swaps: simulation.dataPull.swaps.map((s: DataSwapStruct) => {
                        return {
                            amountInMax: s.amountInMax,
                            amountOut: s.amountOut,
                            path: unwrapEthInPathStartingToken(s.path)
                        }
                    }),
                    pulls: simulation.dataPull.pulls.map((p: PairTokenAmountStruct): PairTokenAmountStruct => {
                        if (isSameAddress(networkInfo.contractAddresses.tokens.WETH, p.token)) {
                            p.token = ETHAddress
                        }
                        return p;
                    }),
                    deadline: simulation.dataPull.deadline
                }
            }
        }

        const getTestInputTokenAmount = (userInputTokenAmount: TokenAmount): TokenAmount => {
            const testAmount: BN =  BN.from(10).pow(18);
            if (isUnderlyingLP()) {
                const underlyingLp: Market = Market.find(this.yieldContract.underlyingAsset.address, chainId);

                const testTokenAmount: TokenAmount = new TokenAmount(
                    underlyingLp.tokens[0],
                    testAmount.toString()
                )
                return testTokenAmount;
            } else {
                const inputToken: Token = this.yieldContract.forgeIdInBytes == forgeIdsInBytes.WONDERLAND && isSameAddress(userInputTokenAmount.token.address, networkInfo.contractAddresses.tokens.TIME)
                                          ? userInputTokenAmount.token
                                          : this.yieldContract.underlyingAsset;
                return new TokenAmount(
                    inputToken,
                    testAmount.toString()
                )
            }
        }

        const simulateDual = async (action: Action, inputTokenAmount: TokenAmount, slippage: number, walletAddress?: string): Promise<SimulationDetails> => {
            const pendleFixture: PendleFixture = await getPendleFixture();
            inputTokenAmount = wrapEth(inputTokenAmount);

            const testTokenAmount = getTestInputTokenAmount(inputTokenAmount);

            const testSimulationResult: SimulationDetails = await simulateWithFixedInput(action, pendleFixture, testTokenAmount, slippage, walletAddress);
            const testInputTokenAmount: TokenAmount = testSimulationResult.tokenAmounts.find((t: TokenAmount) => isSameAddress(t.token.address, inputTokenAmount.token.address))!;
            var scaledSimulation: SimulationDetails = await scaleDualSimulationResult(pendleFixture, testSimulationResult, inputTokenAmount, testInputTokenAmount);
                        
            return unwrapEthInSimulation(scaledSimulation);
        }

        const getInitialTokens = (pendleFixture: PendleFixture): {
            underlyingToken0: Token,
            underlyingToken1?: Token,
            baseToken: Token
        } => {
            const tokens = {} as {
                underlyingToken0: Token,
                underlyingToken1?: Token,
                baseToken: Token
            };
            if (isUnderlyingLP()) {
                const underlyingLP: Token = pendleFixture.yieldContract.underlyingAsset;
                const underlyingLPInfo: MARKETINFO = networkInfo.contractAddresses.otherMarkets!.find((m: MARKETINFO) => isSameAddress(m.address, underlyingLP.address))!;
                tokens.underlyingToken0 = new Token(
                    underlyingLPInfo.pair[0],
                    networkInfo.decimalsRecord[underlyingLPInfo.pair[0]]
                )
                tokens.underlyingToken1 = new Token(
                    underlyingLPInfo.pair[1],
                    networkInfo.decimalsRecord[underlyingLPInfo.pair[1]]
                )
            } else {
                if (this.yieldContract.forgeIdInBytes == forgeIdsInBytes.WONDERLAND) {
                    tokens.underlyingToken0 = new Token(
                        networkInfo.contractAddresses.tokens.TIME,
                        networkInfo.decimalsRecord[networkInfo.contractAddresses.tokens.TIME]
                    );
                } else if (this.yieldContract.forgeIdInBytes == forgeIdsInBytes.BENQI && isSameAddress(this.yieldContract.underlyingAsset.address, networkInfo.contractAddresses.tokens.WETH)) {
                    tokens.underlyingToken0 = ETHToken;
                } else {
                    tokens.underlyingToken0 = this.yieldContract.underlyingAsset
                }
            }

            tokens.baseToken = pendleFixture.otMarket.tokens.find((t: Token) => !isSameAddress(pendleFixture.ot.address, t.address))!;
            return tokens;
        }

        const getDataPullWithSwapsForPAP = async (action: Action, inputTokenAmount: TokenAmount, slippage: number, pendleFixture: PendleFixture): Promise<{
            dataPull: DataPullStruct,
            estimationResult: EstimatorPAPReseult
        }> => {

            const deadline = await getDeadline();;
            const initialTokens = getInitialTokens(pendleFixture);

            const rslippage: string = new BigNumber(slippage).times(decimalFactor(PercentageMaxDecimals)).toFixed(0);

            const tokenZapData = {
                mode: action,
                inAmount: inputTokenAmount.rawAmount(),
                slippage: rslippage
            } as DoubleTokenZapDataStruct;
            const marketFactoryId: string = await pendleFixture.ytMarket.methods({signer, provider, chainId}).getMarketFactoryId();
            tokenZapData.tknzData = {
                marketFactoryId,
                forgeId: this.yieldContract.forgeIdInBytes,
                underAsset: this.yieldContract.underlyingAsset.address,
                expiry: this.yieldContract.expiry
            }

            const dataPull = {} as DataPullStruct;
            dataPull.deadline = deadline;
            var estimationResult: EstimatorPAPReseult = {} as EstimatorPAPReseult;

            var wavaxTrade: Trade = await computeTradeRouteExactIn(inputTokenAmount, 
                isSameAddress(initialTokens.underlyingToken0.address, networkInfo.contractAddresses.tokens.WETH)
                    ? initialTokens.underlyingToken0
                    : initialTokens.underlyingToken1!
            );
            var pendleTrade: Trade = await computeTradeRouteExactIn(inputTokenAmount, 
                isSameAddress(initialTokens.underlyingToken0.address, networkInfo.contractAddresses.tokens.PENDLE)
                    ? initialTokens.underlyingToken0
                    : initialTokens.underlyingToken1!
            )
            tokenZapData.wavaxPath = wavaxTrade.path;
            tokenZapData.pendlePath = pendleTrade.path;
            estimationResult = await zapEstimatorPAP.calcPapZapSwapInfo(tokenZapData);
                
            var wavaxEstimate: string = estimationResult.wavaxInfo.amountOut.toString();
            var pendleEstimate: string = estimationResult.pendleInfo.amountOut.toString();
            wavaxTrade = await computeTradeRouteExactOut(inputTokenAmount.token, new TokenAmount(
                isSameAddress(initialTokens.underlyingToken0.address, networkInfo.contractAddresses.tokens.WETH)
                    ? initialTokens.underlyingToken0
                    : initialTokens.underlyingToken1!,
                wavaxEstimate)
            );
            pendleTrade = await computeTradeRouteExactOut(inputTokenAmount.token, new TokenAmount(
                isSameAddress(initialTokens.underlyingToken0.address, networkInfo.contractAddresses.tokens.PENDLE)
                    ? initialTokens.underlyingToken0
                    : initialTokens.underlyingToken1!,
                pendleEstimate)
            );
            tokenZapData.wavaxPath = wavaxTrade.path;
            tokenZapData.pendlePath = pendleTrade.path;
            estimationResult = await zapEstimatorPAP.calcPapZapSwapInfo(tokenZapData);

            dataPull.swaps = [];
            dataPull.pulls = [];

            if (isNativeOrEquivalent(inputTokenAmount.token.address, this.yieldContract.chainId)) {
                dataPull.pulls.push({
                    token: inputTokenAmount.token.address,
                    amount: estimationResult.wavaxInfo.amountOut.toString()
                })
                dataPull.swaps.push({
                    amountInMax: estimationResult.pendleInfo.amountIn.toString(),
                    amountOut: estimationResult.pendleInfo.amountOut.toString(),
                    path: pendleTrade.path
                })
            } else if (isSameAddress(inputTokenAmount.token.address, networkInfo.contractAddresses.tokens.PENDLE)) {
                dataPull.pulls.push({
                    token: inputTokenAmount.token.address,
                    amount: estimationResult.pendleInfo.amountOut.toString()
                });
                dataPull.swaps.push({
                    amountInMax: estimationResult.wavaxInfo.amountIn.toString(),
                    amountOut: estimationResult.wavaxInfo.amountOut.toString(),
                    path: wavaxTrade.path
                })
            } else {
                dataPull.swaps.push({
                    amountInMax: estimationResult.wavaxInfo.amountIn.toString(),
                    amountOut: estimationResult.wavaxInfo.amountOut.toString(),
                    path: wavaxTrade.path
                })
                dataPull.swaps.push({
                    amountInMax: estimationResult.pendleInfo.amountIn.toString(),
                    amountOut: estimationResult.pendleInfo.amountOut.toString(),
                    path: pendleTrade.path
                })
            }
            
            return {
                dataPull,
                estimationResult
            }
        }

        const getDataPullWithSwapsForSingleUnderlying = async (action: Action, inputTokenAmount: TokenAmount, slippage: number, pendleFixture: PendleFixture): Promise<{
            dataPull: DataPullStruct,
            estimationResult: EstimatorSingleResult
        }> => {
            const deadline = await getDeadline();;
            const initialTokens = getInitialTokens(pendleFixture);

            const rslippage: string = new BigNumber(slippage).times(decimalFactor(PercentageMaxDecimals)).toFixed(0);

            const tokenZapData = {
                mode: action,
                inAmount: inputTokenAmount.rawAmount(),
                slippage: rslippage
            } as SingleTokenZapDataStruct;
            const marketFactoryId: string = await pendleFixture.ytMarket.methods({signer, provider, chainId}).getMarketFactoryId();
            tokenZapData.tknzData = {
                marketFactoryId,
                forgeId: this.yieldContract.forgeIdInBytes,
                underAsset: this.yieldContract.underlyingAsset.address,
                expiry: this.yieldContract.expiry
            }

            const dataPull = {} as DataPullStruct;
            dataPull.deadline = deadline;
            var estimationResult: EstimatorSingleResult = {} as EstimatorSingleResult;

            var underlyingTrade: Trade = await computeTradeRouteExactIn(inputTokenAmount, initialTokens.underlyingToken0);
            var baseTokenTrade: Trade = await computeTradeRouteExactIn(inputTokenAmount, initialTokens.baseToken);
            tokenZapData.underPath = underlyingTrade.path;
            tokenZapData.basePath = baseTokenTrade.path;
            estimationResult = await zapEstimatorSingle.calcSingleTokenZapSwapInfo(tokenZapData);
            
            var underlyingEstimate: string = estimationResult.underInfo.amountOut.toString();
            var baseTokenEstimate: string = estimationResult.baseInfo.amountOut.toString();
            underlyingTrade = await computeTradeRouteExactOut(inputTokenAmount.token, new TokenAmount(initialTokens.underlyingToken0, underlyingEstimate));
            baseTokenTrade = await computeTradeRouteExactOut(inputTokenAmount.token, new TokenAmount(initialTokens.baseToken, baseTokenEstimate));
            tokenZapData.underPath = underlyingTrade.path;
            tokenZapData.basePath = baseTokenTrade.path;
            estimationResult = await zapEstimatorSingle.calcSingleTokenZapSwapInfo(tokenZapData);

            dataPull.swaps = [];
            dataPull.pulls = [];

            if (isSameAddress(initialTokens.underlyingToken0.address, initialTokens.baseToken.address)) {
                if (isSameAddress(inputTokenAmount.token.address, initialTokens.underlyingToken0.address)) {
                    dataPull.pulls.push({
                        token: inputTokenAmount.token.address,
                        amount: inputTokenAmount.rawAmount()
                    })
                } else {
                    dataPull.swaps.push({
                        amountInMax: inputTokenAmount.rawAmount(),
                        amountOut: BN.from(estimationResult.underInfo.amountOut).add(estimationResult.baseInfo.amountOut).toString(),
                        path: underlyingTrade.path
                    })
                }
            } else {
                var amountToPull: BN = BN.from(0);
                if (!isSameAddress(inputTokenAmount.token.address, initialTokens.underlyingToken0.address)) {
                    if (this.yieldContract.forgeIdInBytes == forgeIdsInBytes.BENQI && isSameAddress(this.yieldContract.underlyingAsset.address, networkInfo.contractAddresses.tokens.WETH) && isSameAddress(inputTokenAmount.token.address, networkInfo.contractAddresses.tokens.WETH)) {
                        dataPull.swaps.push({
                            amountInMax: estimationResult.underInfo.amountIn.toString(),
                            amountOut: estimationResult.underInfo.amountOut.toString(),
                            path: [networkInfo.contractAddresses.tokens.WETH, ETHAddress]
                        })
                    } else {
                        dataPull.swaps.push({
                            amountInMax: estimationResult.underInfo.amountIn.toString(),
                            amountOut: estimationResult.underInfo.amountOut.toString(),
                            path: underlyingTrade.path
                        })
                    }
                } else {
                    amountToPull = amountToPull.add(estimationResult.underInfo.amountIn);
                }
                if (!isSameAddress(inputTokenAmount.token.address, initialTokens.baseToken.address)) {
                    dataPull.swaps.push({
                        amountInMax: estimationResult.baseInfo.amountIn.toString(),
                        amountOut: estimationResult.baseInfo.amountOut.toString(),
                        path: baseTokenTrade.path
                    })
                } else {
                    amountToPull = amountToPull.add(estimationResult.baseInfo.amountIn);
                }

                if (amountToPull.gt(0)) {
                    dataPull.pulls.push({
                        token: inputTokenAmount.token.address,
                        amount: amountToPull.toString()
                    })
                }
            }

            if (isNativeOrEquivalent(inputTokenAmount.token.address, this.yieldContract.chainId)) {
                dataPull.swaps.forEach((s: DataSwapStruct) => {
                    s.path[0] = inputTokenAmount.token.address
                })
            }
            return {
                dataPull,
                estimationResult
            }
        }

        const getSwapTransactionsFromDataPulls = (inputToken: Token, dataPull: DataPullStruct, slippage: number, walletAddress?: string): Transaction[] => {
            var transactions: Transaction[] = dataPull.swaps.map((swap: DataSwapStruct): Transaction => {
                const outTokenAddress: string = getOutTokenAddress(swap.path);
                const outToken: Token = new Token(
                    outTokenAddress,
                    networkInfo.decimalsRecord[outTokenAddress]
                )
                if (isNativeOrEquivalent(inputToken.address, this.yieldContract.chainId) && isNativeOrEquivalent(outTokenAddress, this.yieldContract.chainId)) {
                    return {
                        paid: [new TokenAmount(
                            inputToken,
                            swap.amountInMax.toString()
                        )],
                        maxPaid: [new TokenAmount(
                            inputToken,
                            swap.amountInMax.toString()
                        )],
                        received: [new TokenAmount(
                            outToken,
                            swap.amountOut.toString()
                        )],
                        user: walletAddress,
                        protocol: "external",
                        action: isSameAddress(inputToken.address, ETHAddress) ? TransactionAction.wrap : TransactionAction.unwrap
                    }
                }
                return {
                    paid: [new TokenAmount(
                        inputToken,
                        calcSlippedDownAmount(BN.from(swap.amountInMax), slippage).toString()
                    )],
                    maxPaid: [new TokenAmount(
                        inputToken,
                        swap.amountInMax.toString()
                    )],
                    received: [new TokenAmount(
                        outToken,
                        swap.amountOut.toString()
                    )],
                    user: walletAddress,
                    protocol: "external",
                    action: TransactionAction.swap
                }
            })
            return transactions
        }

        const simulateSingle = async (action: Action, inputTokenAmount: TokenAmount, slippage: number, walletAddress?: string): Promise<SimulationDetails> => {
            const pendleFixture: PendleFixture = await getPendleFixture();
            var simulationDetails: SimulationDetails;
            if (isUnderlyingLP()) {
                var transactions: Transaction[] = [];
                const {dataPull, estimationResult} = await getDataPullWithSwapsForPAP(
                    action,
                    inputTokenAmount,
                    slippage,
                    pendleFixture
                );
                transactions = getSwapTransactionsFromDataPulls(inputTokenAmount.token, dataPull, slippage, walletAddress);
                const initialTokens = getInitialTokens(pendleFixture);
                transactions = transactions.concat(await populateTransactionsFromPreMint({
                    action,
                    pendleFixture,
                    slippage,
                    underlyingAmount0: new TokenAmount(
                        new Token(
                            isSameAddress(inputTokenAmount.token.address, ETHAddress) ? ETHAddress : networkInfo.contractAddresses.tokens.WETH,
                            networkInfo.decimalsRecord[networkInfo.contractAddresses.tokens.WETH]
                        ),
                        estimationResult.amountToMintLP.wavax.toString()
                    ),
                    underlyingAmount1: new TokenAmount(
                        new Token(
                            networkInfo.contractAddresses.tokens.PENDLE,
                            networkInfo.decimalsRecord[networkInfo.contractAddresses.tokens.PENDLE]
                        ),
                        estimationResult.amountToMintLP.pendle.toString()
                    ),
                    baseTokenAmountOT: new TokenAmount(
                        initialTokens.baseToken,
                        calcSlippedDownAmount(estimationResult.split.ot, slippage).toString()
                    ),
                    baseTokenAmountYT: new TokenAmount(
                        initialTokens.baseToken,
                        calcSlippedDownAmount(estimationResult.split.yt, slippage).toString()
                    )
                }));

                simulationDetails = {
                    tokenAmounts: [inputTokenAmount],
                    transactions,
                    poolShares: await getOtYtPoolShares({pendleFixture, transactions}),
                    dataPull
                }
            } else {
                const {dataPull, estimationResult} = await getDataPullWithSwapsForSingleUnderlying(
                    action,
                    inputTokenAmount,
                    slippage,
                    pendleFixture
                );
                var transactions: Transaction[] = getSwapTransactionsFromDataPulls(inputTokenAmount.token, dataPull, slippage, walletAddress);

                const initialTokens = getInitialTokens(pendleFixture);
                transactions = transactions.concat(await populateTransactionsFromPreMint({
                    action,
                    pendleFixture,
                    slippage,
                    underlyingAmount0: new TokenAmount(
                        initialTokens.underlyingToken0,
                        estimationResult.underInfo.amountOut.toString()
                    ),
                    baseTokenAmountOT: new TokenAmount(
                        initialTokens.baseToken,
                        calcSlippedDownAmount(estimationResult.split.ot, slippage).toString()
                    ),
                    baseTokenAmountYT: new TokenAmount(
                        initialTokens.baseToken,
                        calcSlippedDownAmount(estimationResult.split.yt, slippage).toString()
                    )
                }))

                simulationDetails = ({
                    tokenAmounts: [inputTokenAmount],
                    transactions,
                    poolShares: await getOtYtPoolShares({pendleFixture, transactions}),
                    dataPull
                })
            }
            return simulationDetails!
        }

        const getBaseTokenForceThreshold = (baseTokenAmount: BN): BN => {
            return baseTokenAmount.div(20);
        }

        const send = async (action: Action, sDetails: SimulationDetails, slippage: number): Promise<providers.TransactionResponse> => {
            const pendleFixture: PendleFixture = await getPendleFixture();
            const sTxns: Transaction[] = sDetails.transactions;
            
            const dataPull: DataPullStruct = sDetails.dataPull;
            const deadline: number = await getDeadline();
            dataPull.deadline = deadline;

            const maxEthPaid: BN = sDetails.tokenAmounts.reduce((p: BN, t: TokenAmount): BN => {
                if (isSameAddress(t.token.address, ETHAddress)) {
                    return p.add(t.rawAmount());
                }
                return p;
            }, ZERO);

            const dataTknz: DataTknzStruct = {
                forge: forgeAddress,
                expiryYT: this.yieldContract.expiry
            } as DataTknzStruct;

            if (isUnderlyingLP()) {
                dataTknz.single = dummyDataTknzSingle;

                const dataAddLiqUniFork: DataAddLiqUniFork = {} as DataAddLiqUniFork;
                const addUnderlyingLiqTxn: Transaction = sTxns.find((txn: Transaction) => txn.action == TransactionAction.preMint)!;
                dataAddLiqUniFork.tokenA = addUnderlyingLiqTxn.paid[0].token.address;
                dataAddLiqUniFork.tokenB = addUnderlyingLiqTxn.paid[1].token.address;
                dataAddLiqUniFork.amountADesired = addUnderlyingLiqTxn.maxPaid[0].rawAmount();
                dataAddLiqUniFork.amountBDesired = addUnderlyingLiqTxn.maxPaid[1].rawAmount();
                dataAddLiqUniFork.amountAMin = calcSlippedDownAmount(BN.from(addUnderlyingLiqTxn.paid[0].rawAmount()), slippage).toString();
                dataAddLiqUniFork.amountBMin = calcSlippedDownAmount(BN.from(addUnderlyingLiqTxn.paid[1].rawAmount()), slippage).toString();
                dataAddLiqUniFork.deadline = deadline;
                dataTknz.double = dataAddLiqUniFork;
            } else {
                const preMintTxn: Transaction = sTxns.find((txn: Transaction) => txn.action == TransactionAction.preMint)!;
                dataTknz.double = dummyDataAddLiqUniFork;
                const dataTknzSingle: DataTknzSingleStruct = {
                    token: preMintTxn.maxPaid[0].token.address,
                    amount: preMintTxn.maxPaid[0].rawAmount()
                }
                dataTknz.single = dataTknzSingle;
            }

            var dataAddLiqOT: DataAddLiqOTStruct = {} as DataAddLiqOTStruct, dataAddLiqYT: DataAddLiqYTStruct = {} as DataAddLiqYTStruct;
            if (action == Action.stakeOT || action == Action.stakeOTYT) {
                const otAddLiqTxn: Transaction = getAddOtLiqTxn(sTxns, pendleFixture)!;
                const baseTokenExpectedAmount: TokenAmount = otAddLiqTxn.paid.find((t: TokenAmount) => !isSameAddress(t.token.address, pendleFixture.ot.address))!;
                const baseToken: Token = baseTokenExpectedAmount.token;
                dataAddLiqOT.baseToken = baseToken.address;
                dataAddLiqOT.amountTokenDesired = otAddLiqTxn.maxPaid.find((t: TokenAmount) => isSameAddress(t.token.address, baseToken.address))!.rawAmount();
                dataAddLiqOT.amountTokenMin = calcSlippedDownAmount(BN.from(baseTokenExpectedAmount.rawAmount()), slippage).toString();
                dataAddLiqOT.deadline = deadline;
                dataAddLiqOT.liqMiningAddr = pendleFixture.otStakingPool.address;
            }

            if (action == Action.stakeYT || action == Action.stakeOTYT) {
                const ytAddLiqTxn: Transaction = getAddYtLiqTxn(sTxns, pendleFixture)!;
                const baseTokenExpectedAmount: TokenAmount = ytAddLiqTxn.paid.find((t: TokenAmount) => !isSameAddress(t.token.address, pendleFixture.yt.address))!;
                const baseToken: Token = baseTokenExpectedAmount.token;
                dataAddLiqYT.baseToken = baseToken.address;
                dataAddLiqYT.amountTokenDesired = ytAddLiqTxn.maxPaid.find((t: TokenAmount) => isSameAddress(t.token.address, baseToken.address))!.rawAmount();
                dataAddLiqYT.amountTokenMin = calcSlippedDownAmount(BN.from(baseTokenExpectedAmount.rawAmount()), slippage).toString();
                dataAddLiqYT.marketFactoryId = await pendleFixture.ytMarket.methods({signer, provider, chainId}).getMarketFactoryId();
                dataAddLiqYT.liqMiningAddr = pendleFixture.ytStakingPool.address;
            }

            const mode: number = forgeIdToMode[this.yieldContract.forgeIdInBytes];
            switch (action) {
                case Action.stakeOT:
                    var baseTokenAmount: BN = BN.from(dataAddLiqOT.amountTokenDesired);
                    var args: any[] = [
                        mode,
                        dataPull,
                        dataTknz,
                        dataAddLiqOT,
                        getBaseTokenForceThreshold(baseTokenAmount).toString(),
                        pendleFixture.ytMarket.address
                    ];
                    // console.log(JSON.stringify(args, null, '  '));
                    return submitTransaction(PendleWrapper, signer!, 'insAddDualLiqForOT', args, maxEthPaid);

                case Action.stakeYT:
                    baseTokenAmount = BN.from(dataAddLiqYT.amountTokenDesired);
                    args = [
                        mode,
                        dataPull,
                        dataTknz,
                        dataAddLiqYT,
                        getBaseTokenForceThreshold(baseTokenAmount).toString()
                    ];
                    // console.log(JSON.stringify(args, null, '  '));
                    return submitTransaction(PendleWrapper, signer!, 'insAddDualLiqForYT', args, maxEthPaid);

                case Action.stakeOTYT:
                    baseTokenAmount = BN.from(dataAddLiqYT.amountTokenDesired).add(dataAddLiqOT.amountTokenDesired);
                    args = [
                        mode,
                        dataPull,
                        dataTknz,
                        dataAddLiqOT,
                        dataAddLiqYT,
                        getBaseTokenForceThreshold(baseTokenAmount).toString()
                    ];
                    // console.log(JSON.stringify(args, null, '  '));
                    return submitTransaction(PendleWrapper, signer!, 'insAddDualLiqForOTandYT', args, maxEthPaid);
            }
        }

        type AprWithPrincipal = {
            apr: AprInfo,
            principal: CurrencyAmount
        };

        const getOtRewards = async (underlyingAmount: TokenAmount, pendleFixture: PendleFixture): Promise<AprWithPrincipal[]> => {
            var rawAprs: AprInfo[] = [];
            switch (this.yieldContract.forgeIdInBytes) {
                case forgeIdsInBytes.JOE_COMPLEX:
                case forgeIdsInBytes.XJOE:
                    const yieldTokenHolderAddress: string = await pendleFixture.forge.yieldTokenHolders(this.yieldContract.underlyingAsset.address, this.yieldContract.expiry);
                    const yieldTokenHolder: Contract = new Contract(yieldTokenHolderAddress, contracts.PendleTraderJoeYieldTokenHolder.abi, provider);
                    const pid: number = await yieldTokenHolder.pid();
                    rawAprs = await MasterChef.methods({signer, provider, chainId}).getRewardsAprs(pid);
                    break;

                case forgeIdsInBytes.BENQI:
                    const qiToken: Token = this.yieldContract.yieldToken;
                    const comptroller: Comptroller = new Comptroller({_address: networkInfo.contractAddresses.misc.Comptroller, _protocol: "benqi"});
                    rawAprs = await comptroller.methods({signer, provider, chainId}).getSupplierAprs(qiToken);
                    break;
                
                default:
                    return [];
            }
            const principalValuation: CurrencyAmount = await fetchValuation(underlyingAmount, provider, chainId);
            return rawAprs.map((apr: AprInfo) => {
                return {
                    apr,
                    principal: principalValuation
                }
            })
        }

        const getLmRewards = async (stakingPool: StakingPool, inputAmount: TokenAmount): Promise<AprWithPrincipal[]> => {
            const rawAprs = await stakingPool.methods({signer, provider, chainId}).rewardAprs();
            const principalValuation: CurrencyAmount = await fetchValuation(inputAmount, provider, chainId);

            return rawAprs.map((apr: AprInfo) => {
                return {
                    apr,
                    principal: principalValuation
                }
            })
        }

        type rewardsInfo = {
            otRewards: AprWithPrincipal[], // rewards related to OT (ot itself / Ot staking pool)
            ytRewards: AprWithPrincipal[],
        }

        const getAllRewardsFromTxns = async (action: Action, testSimulation: SimulationDetails, pendleFixture: PendleFixture): Promise<rewardsInfo> => {
            var otPromises: Promise<AprWithPrincipal[]>[] = [], ytPromises: Promise<AprWithPrincipal[]>[] = [];
            var otLpValuation: CurrencyAmount = ZeroCurrencyAmount, ytLpValuation: CurrencyAmount = ZeroCurrencyAmount;
            var otLpSwapFeeApr: string = '0', ytLpSwapFeeApr: string = '0';
            const mintTxn: Transaction = testSimulation.transactions.find((txn: Transaction) => txn.action == TransactionAction.mint)!;
            otPromises.push(getOtRewards(mintTxn.paid[0], pendleFixture));

            var otRewards: AprWithPrincipal[] = [], ytRewards: AprWithPrincipal[] = [];
            if (action == Action.stakeOT || action == Action.stakeOTYT) {
                const otLpAddLiqTxn: Transaction = getAddOtLiqTxn(testSimulation.transactions, pendleFixture)!;
                otPromises.push(getLmRewards(pendleFixture.otStakingPool, otLpAddLiqTxn.received[0]));
                otLpValuation = await fetchValuation(otLpAddLiqTxn.received[0], provider, chainId);
                otLpSwapFeeApr = await pendleFixture.otMarket.methods({signer, provider, chainId}).getSwapFeeApr();
                otRewards.push({
                    apr: {
                        apr: otLpSwapFeeApr,
                        origin: "Swap Fee"
                    },
                    principal: otLpValuation
                })
            }
            if (action == Action.stakeYT || action == Action.stakeOTYT) {
                const ytLpAddLiqTxn: Transaction = getAddYtLiqTxn(testSimulation.transactions, pendleFixture)!;
                ytPromises.push(getLmRewards(pendleFixture.ytStakingPool, ytLpAddLiqTxn.received[0]));
                ytLpValuation = await fetchValuation(ytLpAddLiqTxn.received[0], provider, chainId);
                ytLpSwapFeeApr = await pendleFixture.ytMarket.methods({signer, provider, chainId}).getSwapFeeApr();
                ytRewards.push({
                    apr: {
                        apr: ytLpSwapFeeApr,
                        origin: "Swap Fee"
                    },
                    principal: ytLpValuation
                })
            }
            otRewards = otRewards.concat(await Promise.all(otPromises).then((value: AprWithPrincipal[][]) => {
                return value.flat();
            }));
            ytRewards = ytRewards.concat(await Promise.all(ytPromises).then((value: AprWithPrincipal[][]) => {
                return value.flat();
            }));
            // console.log("otRewards", JSON.stringify(otRewards, null,  '  '))
            // console.log("ytRewards", JSON.stringify(ytRewards, null,  '  '))

            return {
                otRewards,
                ytRewards,
            }
        }

        const apr = async (action: Action): Promise<WrapperAPRInfo> => {
            const pendleFixture: PendleFixture = await getPendleFixture();

            var inputTokenAmount: TokenAmount;
            if (isUnderlyingLP()) {
                const underlyingLp: Market = Market.find(this.yieldContract.underlyingAsset.address, chainId);
                inputTokenAmount = new TokenAmount(
                    underlyingLp.tokens[0],
                    BN.from(10).pow(18).toString()
                )
            } else {
                inputTokenAmount = new TokenAmount(
                    this.yieldContract.underlyingAsset,
                    BN.from(10).pow(networkInfo.decimalsRecord[this.yieldContract.underlyingAsset.address]).toString()
                );
            }
            var totalPrincipalValuation = new BigNumber(0);
            const testSimulation: SimulationDetails = await simulateDual(action, inputTokenAmount, 0);
            // console.log(JSON.stringify(testSimulation, null, '  '))
            for (const t of testSimulation.tokenAmounts) {
                totalPrincipalValuation = totalPrincipalValuation.plus((await fetchValuation(t, provider, chainId)).amount);
            }
            // console.log(totalPrincipalValuation.toFixed(DecimalsPrecision));

            var rewardsInfo: rewardsInfo = await getAllRewardsFromTxns(action, testSimulation, pendleFixture);
            // console.log("rewardsInfo", JSON.stringify(rewardsInfo, null, '  '));
            const adjustedOTRewards: AprInfo[] = rewardsInfo.otRewards.map((aprWP: AprWithPrincipal) => {
                return {
                    origin: aprWP.apr.origin,
                    apr: new BigNumber(aprWP.apr.apr).multipliedBy(aprWP.principal.amount).div(totalPrincipalValuation).toFixed(DecimalsPrecision)
                }
            })
            // console.log('adjustedOTRewards', JSON.stringify(adjustedOTRewards, null, '  '))
            const adjustedYTRewards: AprInfo[] = rewardsInfo.ytRewards.map((aprWP: AprWithPrincipal) => {
                return {
                    origin: aprWP.apr.origin,
                    apr: new BigNumber(aprWP.apr.apr).multipliedBy(aprWP.principal.amount).div(totalPrincipalValuation).toFixed(DecimalsPrecision)
                }
            })
            // console.log('adjustedYTRewards', JSON.stringify(adjustedYTRewards, null, '  '))

            const totalOtApr: BigNumber = adjustedOTRewards.reduce((p: BigNumber, c: AprInfo) => p.plus(new BigNumber(c.apr)), new BigNumber(0));

            const totalYtApr: BigNumber = adjustedYTRewards.reduce((p: BigNumber, c: AprInfo) => p.plus(new BigNumber(c.apr)), new BigNumber(0));
            return {
                totalApr: totalYtApr.plus(totalOtApr).toFixed(DecimalsPrecision),
                composition: {
                    otPoolApr: adjustedOTRewards.filter((apr: AprInfo) => new BigNumber(apr.apr).gt(0)),
                    ytPoolApr: adjustedYTRewards.filter((apr: AprInfo) => new BigNumber(apr.apr).gt(0))
                }
            }
        }

        return {
            simulateDual,
            simulateSingle,
            send,
            apr,
        }
    }
}
