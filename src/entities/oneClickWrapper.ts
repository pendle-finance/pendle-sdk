import { providers, BigNumber as BN } from "ethers";
import { AprInfo } from "./types";
import { dummyAddress, forgeIdsInBytes, zeroAddress, ONE_MINUTE, ETHAddress } from "../constants";
import { dummyTokenAmount, TokenAmount } from './tokenAmount';
import { YieldContract } from "./yieldContract";
import { Ot } from "./ot";
import { Yt } from "./yt";
import { Token } from "./token";
import { Contract } from "ethers";
import { StakingPool } from "./stakingPool";
import { LMINFO, MARKETINFO, NetworkInfo, PENDLEMARKETNFO } from "../networks";
import { distributeConstantsByNetwork, getABIByForgeId, getCurrentTimestamp, getGasLimit, getGasLimitWithETH, isSameAddress } from "../helpers";
import { contracts } from "../contracts";
import { PendleMarket, Market, OtherMarketDetails, MarketDetails, AddDualLiquidityDetails } from "./market";
import { calcOtherTokenAmount, calcShareOfPool, calcSlippedDownAmount, calcSlippedUpAmount, DecimalsPrecision } from "../math/marketMath";
import BigNumber from "bignumber.js";
import { fetchValuation } from "../fetchers/priceFetcher";
import { CurrencyAmount, dummyCurrencyAmount, ZeroCurrencyAmount } from "./currencyAmount";
import { MasterChef } from "./masterChef";

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
    maxPaid: [dummyTokenAmount, dummyTokenAmount],
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

const forgeIdToMode: Record<string, number> = {
    [forgeIdsInBytes.AAVE]: 0,
    [forgeIdsInBytes.COMPOUND]: 1,
    [forgeIdsInBytes.COMPOUND_UPGRADED]: 1,
    [forgeIdsInBytes.SUSHISWAP_SIMPLE]: 3,
    [forgeIdsInBytes.SUSHISWAP_COMPLEX]: 3,
    [forgeIdsInBytes.JOE_COMPLEX]: 3,
    [forgeIdsInBytes.JOE_SIMPLE]: 3,
    [forgeIdsInBytes.BENQI]: 1,
    [forgeIdsInBytes.XJOE]: 5
}

export type DataTknzAaveCompound = {
    token: string;
    amount: string;
}

export const dummyDataTknzAaveCompound: DataTknzAaveCompound = {
    token: zeroAddress,
    amount: '0'
}

export type DataAddLiqUniFork = {
    tokenA: string;
    tokenB: string;
    amountADesired: string; // input
    amountBDesired: string; // theoritical amount + slippage
    amountAMin: string; // input
    amountBMin: string; // theoritical amount - slippage
    deadline: number; // timestamp + 3 hr
    kyberPool: string;
    kybervReserveRatioBounds: string[];
}

export const dummyDataAddLiqUniFork: DataAddLiqUniFork = {
    tokenA: zeroAddress,
    tokenB: zeroAddress,
    amountADesired: '0',
    amountBDesired: '0',
    amountAMin: '0',
    amountBMin: '0',
    deadline: 0,
    kyberPool: zeroAddress,
    kybervReserveRatioBounds: ['0', '0'],
}

export type DataTknz = {
    aaveCom: DataTknzAaveCompound;
    uniFork: DataAddLiqUniFork;
    forge: string; // address
    expiryYT: number;
}

export type DataAddLiqOT = {
    baseToken: string;
    amountTokenDesired: string; // theoritical + slippage
    amountTokenMin: string; // theoritical - slippage
    deadline: number; // + 3hr
    liqMiningAddr: string;
}

export type DataAddLiqYT = {
    baseToken: string;
    amountTokenDesired: string; // theoritical + slippage
    amountTokenMin: string; // theoritical - slippagef
    marketFactoryId: string;
    liqMiningAddr: string;
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
        const PendleWrapper = new Contract(networkInfo.contractAddresses.misc.PendleWrapper, contracts.PendleWrapper.abi, signer.provider);

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
            var otPoolShare: BigNumber, ytPoolShare: BigNumber;

            const otMarketAddLiqTransaction: Transaction | undefined = getAddOtLiqTxn(transactions, pendleFixture);
            if (otMarketAddLiqTransaction === undefined) {
                otPoolShare = new BigNumber(0)
            } else {
                const otMarketSupply: BN = await new Contract(pendleFixture.otMarket.address, contracts.UniswapV2Pair.abi, signer.provider).totalSupply();
                otPoolShare = calcShareOfPool(otMarketSupply, BN.from(otMarketAddLiqTransaction.received[0].rawAmount()));
            }

            const ytMarketAddLiqTransaction: Transaction | undefined = getAddYtLiqTxn(transactions, pendleFixture);
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

        const simulateWithFixedInput = async (action: Action, pendleFixture: PendleFixture, fixedInputAmount: TokenAmount, slippage: number): Promise<SimulationDetails> => {
            const transactions: Transaction[] = [];
            // const user: string = await signer.getAddress()
            const user: string = '0x12345';
            const inAmount: BN = BN.from(fixedInputAmount.rawAmount());

            const underlyingLp: Market = Market.find(this.yieldContract.underlyingAsset.address, chainId);
            const underlyingLPDetails: OtherMarketDetails = await (underlyingLp.methods(signer, chainId).readMarketDetails());

            const testInutTokenIdxInLP: number = isSameAddress(underlyingLPDetails.tokenReserves[0].token.address, fixedInputAmount.token.address) ? 0 : 1;
            const otherTokenInLP: Token = underlyingLPDetails.tokenReserves[1 ^ testInutTokenIdxInLP].token;

            const otherTokenInLPAmount: TokenAmount = new TokenAmount(
                otherTokenInLP,
                calcOtherTokenAmount(
                    BN.from(underlyingLPDetails.tokenReserves[testInutTokenIdxInLP].rawAmount()),
                    BN.from(underlyingLPDetails.tokenReserves[1 ^ testInutTokenIdxInLP].rawAmount()),
                    inAmount
                ).toString()
            );
            const outLPAmount: TokenAmount = new TokenAmount(
                new Token(
                    underlyingLp.address,
                    networkInfo.decimalsRecord[underlyingLp.address]
                ),
                inAmount.mul(BN.from(underlyingLPDetails.totalSupplyLP)).div(underlyingLPDetails.tokenReserves[testInutTokenIdxInLP].rawAmount()).toString()
            )
            transactions.push({
                action: TransactionAction.preMint,
                user: user,
                protocol: 'external',
                paid: [
                    fixedInputAmount,
                    otherTokenInLPAmount
                ],
                maxPaid: [
                    fixedInputAmount,
                    otherTokenInLPAmount
                ],
                received: [
                    outLPAmount
                ]
            });

            const otytAmounts: TokenAmount[] = await this.yieldContract.methods(signer, chainId).mintDetails(outLPAmount);
            transactions.push({
                action: TransactionAction.mint,
                user: user,
                protocol: 'pendle',
                paid: [outLPAmount],
                maxPaid: [outLPAmount],
                received: otytAmounts,
            })

            if (action == Action.stakeOT || action == Action.stakeOTYT) {
                const otMarketDetail: OtherMarketDetails = await pendleFixture.otMarket.methods(signer, chainId).readMarketDetails();
                const otTokenIdxInMarket: number = isSameAddress(pendleFixture.ot.address, otMarketDetail.tokenReserves[0].token.address) ? 0 : 1;
                const otAmount: TokenAmount = otytAmounts[0];
                const otReserve: BN = BN.from(otMarketDetail.tokenReserves[otTokenIdxInMarket].rawAmount());
                const baseTokenReserve: BN = BN.from(otMarketDetail.tokenReserves[1 ^ otTokenIdxInMarket].rawAmount());
                const baseTokenInOtMarket: Token = isSameAddress(pendleFixture.otMarket.tokens[0].address, pendleFixture.ot.address) ? pendleFixture.otMarket.tokens[1] : pendleFixture.otMarket.tokens[0];

                const baseTokenInOtMarketAmount: TokenAmount = new TokenAmount(
                    baseTokenInOtMarket,
                    BN.from(otAmount.rawAmount()).mul(baseTokenReserve).div(otReserve).toString()
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
                    paid: [otAmount, baseTokenInOtMarketAmount],
                    maxPaid: [
                        otAmount,
                        new TokenAmount(
                            baseTokenInOtMarketAmount.token,
                            calcSlippedUpAmount(BN.from(baseTokenInOtMarketAmount.rawAmount()), slippage).toString()
                        )
                    ],
                    received: [otMarketLpAmount]
                });

                transactions.push({
                    action: TransactionAction.stake,
                    user: user,
                    protocol: 'pendle',
                    paid: [otMarketLpAmount],
                    maxPaid: [otMarketLpAmount],
                    received: []
                });
            }

            if (action == Action.stakeYT || action == Action.stakeOTYT) {
                const addDualDetails: AddDualLiquidityDetails = await pendleFixture.ytMarket.methods(signer, chainId).addDualDetails(otytAmounts[1]);
                const baseTokenInYtMarketAmount: TokenAmount = addDualDetails.otherTokenAmount;
                const ytMarketLpAmount: TokenAmount = new TokenAmount(
                    new Token(
                        pendleFixture.ytMarket.address,
                        networkInfo.decimalsRecord[pendleFixture.ytMarket.address]
                    ),
                    addDualDetails.lpMinted
                )
                transactions.push({
                    action: TransactionAction.addLiquidity,
                    user: user,
                    protocol: 'pendle',
                    paid: [otytAmounts[1], baseTokenInYtMarketAmount],
                    maxPaid: [
                        otytAmounts[1],
                        new TokenAmount(
                            baseTokenInYtMarketAmount.token,
                            calcSlippedUpAmount(BN.from(baseTokenInYtMarketAmount.rawAmount()), slippage).toString()
                        )
                    ],
                    received: [ytMarketLpAmount]
                });

                transactions.push({
                    action: TransactionAction.stake,
                    user: user,
                    protocol: 'pendle',
                    paid: [ytMarketLpAmount],
                    maxPaid: [ytMarketLpAmount],
                    received: []
                });
            };

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

        const unwrapEthInSimulation = (simulation: SimulationDetails): SimulationDetails => {
            return {
                tokenAmounts: simulation.tokenAmounts.map(unwrapEth),
                transactions: simulation.transactions.map(unwrapEthInTransaction),
                poolShares: {
                    otPoolShare: simulation.poolShares.otPoolShare,
                    ytPoolShare: simulation.poolShares.ytPoolShare
                }
            }
        }

        const simulate = async (action: Action, inputTokenAmount: TokenAmount, slippage: number): Promise<SimulationDetails> => {
            const pendleFixture: PendleFixture = await getPendleFixture();
            inputTokenAmount = wrapEth(inputTokenAmount);
            if (isUnderlyingLP()) {
                const underlyingLp: Market = Market.find(this.yieldContract.underlyingAsset.address, chainId);

                const testTokenAmount: TokenAmount = new TokenAmount(
                    underlyingLp.tokens[0],
                    BN.from(10).pow(18).toString()
                )
                const testSimulationResult: SimulationDetails = await simulateWithFixedInput(action, pendleFixture, testTokenAmount, slippage);
                const testInputTokenAmount: TokenAmount = testSimulationResult.tokenAmounts.find((t: TokenAmount) => isSameAddress(t.token.address, inputTokenAmount.token.address))!;
                const scaledSimulation: SimulationDetails = await scaleSimulationResult(pendleFixture, testSimulationResult, inputTokenAmount, testInputTokenAmount);
                return unwrapEthInSimulation(scaledSimulation);
            }
            return dummySimulation
        }

        const send = async (action: Action, sTxns: Transaction[], slippage: number): Promise<providers.TransactionResponse> => {
            const pendleFixture: PendleFixture = await getPendleFixture();
            const maxEthPaid: BN = sTxns.reduce((p: BN, txn: Transaction): BN => {
                const ethInThisTxn: BN = txn.maxPaid.reduce((pp: BN, t: TokenAmount): BN => {
                    if (isSameAddress(t.token.address, ETHAddress)) {
                        return pp.add(BN.from(t.rawAmount()));
                    } else {
                        return pp;
                    }
                }, BN.from(0));
                return p.add(ethInThisTxn);
            }, BN.from(0))

            if (isUnderlyingLP()) {
                const dataTknz: DataTknz = {} as DataTknz;
                dataTknz.forge = forgeAddress;
                dataTknz.aaveCom = dummyDataTknzAaveCompound;
                dataTknz.expiryYT = this.yieldContract.expiry;

                const dataAddLiqUniFork: DataAddLiqUniFork = {
                    kyberPool: '0',
                    kybervReserveRatioBounds: ['0', '0']
                } as DataAddLiqUniFork;
                const addUnderlyingLiqTxn: Transaction = sTxns.find((txn: Transaction) => txn.action == TransactionAction.preMint)!;
                dataAddLiqUniFork.tokenA = addUnderlyingLiqTxn.paid[0].token.address;
                dataAddLiqUniFork.tokenB = addUnderlyingLiqTxn.paid[1].token.address;
                dataAddLiqUniFork.amountADesired = addUnderlyingLiqTxn.maxPaid[0].rawAmount();
                dataAddLiqUniFork.amountBDesired = addUnderlyingLiqTxn.maxPaid[1].rawAmount();
                dataAddLiqUniFork.amountAMin = calcSlippedDownAmount(BN.from(addUnderlyingLiqTxn.paid[0].rawAmount()), slippage).toString();
                dataAddLiqUniFork.amountBMin = calcSlippedDownAmount(BN.from(addUnderlyingLiqTxn.paid[1].rawAmount()), slippage).toString();
                const currentTime: BN = BN.from(await getCurrentTimestamp(signer.provider));
                const deadline: BN = currentTime.add(ONE_MINUTE.mul(60).mul(3));
                dataAddLiqUniFork.deadline = deadline.toNumber();

                var dataAddLiqOT: DataAddLiqOT = {} as DataAddLiqOT, dataAddLiqYT: DataAddLiqYT = {} as DataAddLiqYT;
                if (action == Action.stakeOT || action == Action.stakeOTYT) {
                    const otAddLiqTxn: Transaction = getAddOtLiqTxn(sTxns, pendleFixture)!;
                    const baseTokenExpectedAmount: TokenAmount = otAddLiqTxn.paid.find((t: TokenAmount) => !isSameAddress(t.token.address, pendleFixture.ot.address))!;
                    const baseToken: Token = baseTokenExpectedAmount.token;
                    dataAddLiqOT.baseToken = baseToken.address;
                    dataAddLiqOT.amountTokenDesired = otAddLiqTxn.maxPaid.find((t: TokenAmount) => isSameAddress(t.token.address, baseToken.address))!.rawAmount();
                    dataAddLiqOT.amountTokenMin = calcSlippedDownAmount(BN.from(baseTokenExpectedAmount.rawAmount()), slippage).toString();
                    dataAddLiqOT.deadline = deadline.toNumber();
                    dataAddLiqOT.liqMiningAddr = pendleFixture.otStakingPool.address;
                }

                if (action == Action.stakeYT || action == Action.stakeOTYT) {
                    const ytAddLiqTxn: Transaction = getAddYtLiqTxn(sTxns, pendleFixture)!;
                    const baseTokenExpectedAmount: TokenAmount = ytAddLiqTxn.paid.find((t: TokenAmount) => !isSameAddress(t.token.address, pendleFixture.yt.address))!;
                    const baseToken: Token = baseTokenExpectedAmount.token;
                    dataAddLiqYT.baseToken = baseToken.address;
                    dataAddLiqYT.amountTokenDesired = ytAddLiqTxn.maxPaid.find((t: TokenAmount) => isSameAddress(t.token.address, baseToken.address))!.rawAmount();
                    dataAddLiqYT.amountTokenMin = calcSlippedDownAmount(BN.from(baseTokenExpectedAmount.rawAmount()), slippage).toString();
                    dataAddLiqYT.marketFactoryId = await pendleFixture.ytMarket.methods(signer, chainId).getMarketFactoryId();
                    dataAddLiqYT.liqMiningAddr = pendleFixture.ytStakingPool.address;
                }

                const mode: number = forgeIdToMode[this.yieldContract.forgeIdInBytes];
                switch (action){
                    case Action.stakeOT:
                        var args: any[] = [
                            mode,
                            dataTknz,
                            dataAddLiqOT
                        ];
                        var gasEstimate: BN = await PendleWrapper.connect(signer).estimateGas.insAddDualLiqForOT(...args, {value: maxEthPaid});
                        return PendleWrapper.connect(signer).insAddDualLiqForOT(...args, getGasLimitWithETH(gasEstimate, maxEthPaid));

                    case Action.stakeYT:
                        args = [
                            mode,
                            dataTknz,
                            dataAddLiqYT
                        ];
                        gasEstimate = await PendleWrapper.connect(signer).estimateGas.insAddDualLiqForYT(...args, {value: maxEthPaid});
                        return PendleWrapper.connect(signer).insAddDualLiqForYT(...args, getGasLimitWithETH(gasEstimate, maxEthPaid));

                    case Action.stakeOTYT:
                        args = [
                            mode,
                            dataTknz,
                            dataAddLiqOT,
                            dataAddLiqYT
                        ];
                        gasEstimate = await PendleWrapper.connect(signer).estimateGas.insAddDualLiqForOTandYT(...args, {value: maxEthPaid});
                        return PendleWrapper.connect(signer).insAddDualLiqForOTandYT(...args, getGasLimitWithETH(gasEstimate, maxEthPaid)); 
                }
            } else {
                return {} as providers.TransactionResponse;
            }
        }

        type AprWithPrincipal = {
            apr: AprInfo,
            principal: CurrencyAmount
        };

        const getOtRewards = async(underlyingAmount: TokenAmount, pendleFixture: PendleFixture): Promise<AprWithPrincipal[]> => {
            if (this.yieldContract.forgeIdInBytes == forgeIdsInBytes.JOE_COMPLEX) {
                const yieldTokenHolderAddress: string = await pendleFixture.forge.yieldTokenHolders(this.yieldContract.underlyingAsset, this.yieldContract.expiry);
                const yieldTokenHolder: Contract = new Contract(yieldTokenHolderAddress, contracts.PendleTraderJoeYieldTokenHolder.abi);
                const pid: number = await yieldTokenHolder.pid();
                const rawAprs: AprInfo[] =  await MasterChef.methods(signer, chainId).getRewardsAprs(pid);
                const principalValuation: CurrencyAmount = await fetchValuation(underlyingAmount, signer, chainId);
                return rawAprs.map((apr: AprInfo) => {
                    return {
                        apr,
                        principal: principalValuation
                    }
                })
            }
            return [];
        }

        // const getOtLpRewards = async(otLpAmount: TokenAmount, _: PendleFixture): Promise<AprWithPrincipal[]> => {
        //     const otherMarketInfo: MARKETINFO | undefined = networkInfo.contractAddresses.otherMarkets?.find((m: MARKETINFO) => isSameAddress(m.address, otLpAmount.token.address));
        //     if (otherMarketInfo === undefined || otherMarketInfo.masterChefPID === undefined) return [];
        //     const pid: number = otherMarketInfo.masterChefPID;
        //     const rawAprs: AprInfo[] =  await MasterChef.methods(signer, chainId).getRewardsAprs(pid);
        //     const principalValuation: CurrencyAmount = await fetchValuation(otLpAmount, signer, chainId);
        //     return rawAprs.map((apr: AprInfo) => {
        //         return {
        //             apr,
        //             principal: principalValuation
        //         }
        //     })        
        // }

        const getLmRewards = async(stakingPool: StakingPool, inputAmount: TokenAmount): Promise<AprWithPrincipal[]> => {
            const rawAprs = await stakingPool.methods(signer, chainId).rewardAprs();
            const principalValuation: CurrencyAmount = await fetchValuation(inputAmount, signer, chainId);
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

        const getAllRewardsFromTxns = async(action: Action, testSimulation: SimulationDetails, pendleFixture: PendleFixture): Promise<rewardsInfo> => {
            var otPromises: Promise<AprWithPrincipal[]>[] = [], ytPromises: Promise<AprWithPrincipal[]>[] = [];
            var otLpValuation: CurrencyAmount = ZeroCurrencyAmount, ytLpValuation: CurrencyAmount = ZeroCurrencyAmount;
            var otLpSwapFeeApr: string = '0', ytLpSwapFeeApr: string = '0';
            const mintTxn: Transaction = testSimulation.transactions.find((txn: Transaction) => txn.action == TransactionAction.mint)!;
            otPromises.push(getOtRewards(mintTxn.paid[0], pendleFixture));

            var otRewards: AprWithPrincipal[] = [], ytRewards: AprWithPrincipal[] = [];
            if (action == Action.stakeOT || action == Action.stakeOTYT) {
                const otLpAddLiqTxn: Transaction = getAddOtLiqTxn(testSimulation.transactions, pendleFixture)!;
                otPromises.push(getLmRewards(pendleFixture.otStakingPool, otLpAddLiqTxn.received[0]));
                otLpValuation = await fetchValuation(otLpAddLiqTxn.received[0], signer, chainId);
                otLpSwapFeeApr = await pendleFixture.otMarket.methods(signer, chainId).getSwapFeeApr();
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
                ytLpValuation = await fetchValuation(ytLpAddLiqTxn.received[0], signer, chainId);
                ytLpSwapFeeApr = await pendleFixture.ytMarket.methods(signer, chainId).getSwapFeeApr();
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
                inputTokenAmount = dummyTokenAmount;
            }
            var totalPrincipalValuation = new BigNumber(0);
            const testSimulation: SimulationDetails = await simulate(action, inputTokenAmount, 0);
            for (const t of testSimulation.tokenAmounts) {
                totalPrincipalValuation = totalPrincipalValuation.plus((await fetchValuation(t, signer, chainId)).amount);
            }

            var rewardsInfo: rewardsInfo = await getAllRewardsFromTxns(action, testSimulation, pendleFixture);
            const adjustedOTRewards: AprInfo[] = rewardsInfo.otRewards.map((aprWP: AprWithPrincipal) => {
                return {
                    origin: aprWP.apr.origin,
                    apr: new BigNumber(aprWP.apr.apr).multipliedBy(aprWP.principal.amount).div(totalPrincipalValuation).toFixed(DecimalsPrecision)
                }
            })
            const adjustedYTRewards: AprInfo[] = rewardsInfo.otRewards.map((aprWP: AprWithPrincipal) => {
                return {
                    origin: aprWP.apr.origin,
                    apr: new BigNumber(aprWP.apr.apr).multipliedBy(aprWP.principal.amount).div(totalPrincipalValuation).toFixed(DecimalsPrecision)
                }
            })
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
            simulate,
            send,
            apr
        }
    }
}