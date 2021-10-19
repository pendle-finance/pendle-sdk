import { providers, BigNumber as BN } from "ethers";
import { AprInfo } from "./stakingPool";
import { dummyAddress, forgeIdsInBytes, zeroAddress, ONE_MINUTE, ONE_DAY } from "../constants";
import { dummyTokenAmount, TokenAmount } from './tokenAmount';
import { YieldContract } from "./yieldContract";
import { Ot } from "./ot";
import { Yt } from "./yt";
import { Token } from "./token";
import { Contract } from "ethers";
import { StakingPool } from "./stakingPool";
import { LMINFO, MARKETINFO, NetworkInfo, PENDLEMARKETNFO } from "../networks";
import { distributeConstantsByNetwork, getABIByForgeId, getCurrentTimestamp, getGasLimit, isSameAddress } from "../helpers";
import { contracts } from "../contracts";
import { PendleMarket, Market, OtherMarketDetails, MarketDetails, AddDualLiquidityDetails } from "./market";
import { calcOtherTokenAmount, calcShareOfPool, calcSlippedDownAmount, calcSlippedUpAmount, DecimalsPrecision } from "../math/marketMath";
import BigNumber from "bignumber.js";
import { fetchValuation } from "../fetchers/priceFetcher";
import { CurrencyAmount, dummyCurrencyAmount } from "./currencyAmount";

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
    [forgeIdsInBytes.SUSHISWAP_COMPLEX]: 3
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
            return this.yieldContract.forgeIdInBytes == forgeIdsInBytes.SUSHISWAP_SIMPLE || this.yieldContract.forgeIdInBytes == forgeIdsInBytes.SUSHISWAP_COMPLEX;
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

        const simulate = async (action: Action, inputTokenAmount: TokenAmount, slippage: number): Promise<SimulationDetails> => {
            const pendleFixture: PendleFixture = await getPendleFixture();
            if (isUnderlyingLP()) {
                const underlyingLp: Market = Market.find(this.yieldContract.underlyingAsset.address, chainId);

                const testTokenAmount: TokenAmount = new TokenAmount(
                    underlyingLp.tokens[0],
                    BN.from(10).pow(18).toString()
                )
                const testSimulationResult: SimulationDetails = await simulateWithFixedInput(action, pendleFixture, testTokenAmount, slippage);
                const testInputTokenAmount: TokenAmount = testSimulationResult.tokenAmounts.find((t: TokenAmount) => isSameAddress(t.token.address, inputTokenAmount.token.address))!;
                return scaleSimulationResult(pendleFixture, testSimulationResult, inputTokenAmount, testInputTokenAmount);
            }
            return dummySimulation
        }

        const send = async (action: Action, sTxns: Transaction[], slippage: number): Promise<providers.TransactionResponse> => {
            const pendleFixture: PendleFixture = await getPendleFixture();

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
                        var gasEstimate: BN = await PendleWrapper.connect(signer).estimateGas.insAddDualLiqForOT(...args);
                        return PendleWrapper.connect(signer).insAddDualLiqForOT(...args, getGasLimit(gasEstimate));

                    case Action.stakeYT:
                        args = [
                            mode,
                            dataTknz,
                            dataAddLiqYT
                        ];
                        gasEstimate = await PendleWrapper.connect(signer).estimateGas.insAddDualLiqForYT(...args);
                        return PendleWrapper.connect(signer).insAddDualLiqForYT(...args, getGasLimit(gasEstimate));

                    case Action.stakeOTYT:
                        args = [
                            mode,
                            dataTknz,
                            dataAddLiqOT,
                            dataAddLiqYT
                        ];
                        gasEstimate = await PendleWrapper.connect(signer).estimateGas.insAddDualLiqForOTandYT(...args);
                        return PendleWrapper.connect(signer).insAddDualLiqForOTandYT(...args, getGasLimit(gasEstimate)); 
                }
            } else {
                return {} as providers.TransactionResponse;
            }
        }

        const getMasterChefBaseRewards = async(lpAmount: TokenAmount, pid: number, pendleFixture:PendleFixture): Promise<TokenAmount[]> => {
            if (this.yieldContract.forgeIdInBytes == forgeIdsInBytes.JOE_COMPLEX) {
                const masterChefV2Address: string = networkInfo.contractAddresses.misc.JOE_MASTERCHEFV2;
                const masterChefV2: Contract = new Contract(masterChefV2Address, contracts.JoeMasterChef.abi);

                var allocPoint: BN, totalAllocPoint: BN, totalJoePerSec: BN, devPercent: BN, treasuryPercent: BN, investorPercent: BN;
                const promises: Promise<any>[] = [];
                promises.push(masterChefV2.poolInfo(pid));
                promises.push(masterChefV2.totalAllocPoint());
                promises.push(masterChefV2.joePerSec());
                promises.push(masterChefV2.devPercent());
                promises.push(masterChefV2.treasuryPercent());
                promises.push(masterChefV2.investorPercent());
                await Promise.all(promises).then((values: any[]) => {
                    allocPoint = values[0].allocPoint;
                    totalAllocPoint = values[1];
                    totalJoePerSec = values[2];
                    devPercent = values[3];
                    treasuryPercent = values[4];
                    investorPercent = values[5];
                });
                const underlyingLpContract: Contract = new Contract(lpAmount.token.address, contracts.IERC20.abi);
                const lpBalance: BN = await underlyingLpContract.balanceOf(masterChefV2Address);
                const joeTokenAddress: string = (await masterChefV2.joe()).toLowerCase();
                const oneWeek: BN = ONE_DAY.mul(7);
                const joeReward: BN = oneWeek
                    .mul(totalJoePerSec!)
                    .mul(allocPoint!)
                    .div(totalAllocPoint!)
                    .mul(BN.from(1000).sub(devPercent!).sub(treasuryPercent!).sub(investorPercent!))
                    .mul(lpAmount.rawAmount())
                    .div(lpBalance)
                    .div(1000);
                return [new TokenAmount(
                    new Token(
                        joeTokenAddress,
                        networkInfo.decimalsRecord[joeTokenAddress]
                    ),
                    joeReward.toString()
                )]
            }
            return [];
        }

        const getOtRewards = async(underlyingAmount: TokenAmount, pendleFixture: PendleFixture): Promise<TokenAmount[]> => {
            if (this.yieldContract.forgeIdInBytes == forgeIdsInBytes.JOE_COMPLEX) {
                const yieldTokenHolderAddress: string = await pendleFixture.forge.yieldTokenHolders(this.yieldContract.underlyingAsset, this.yieldContract.expiry);
                const yieldTokenHolder: Contract = new Contract(yieldTokenHolderAddress, contracts.PendleTraderJoeYieldTokenHolder.abi);
                const pid: number = await yieldTokenHolder.pid();
                return getMasterChefBaseRewards(underlyingAmount, pid, pendleFixture);
            } else if (this.yieldContract.forgeIdInBytes == forgeIdsInBytes.SUSHISWAP_COMPLEX) {
                return getMasterChefBaseRewards(underlyingAmount, pendleFixture);
            }
            return [];
        }

        const getOtLpRewards = async()

        type rewardsInfo = {
            rewards: TokenAmount[], // rewards you will get in one week
            swapFees: {
                otPool: string,
                ytPool: string
            },
            valuations: {
                otPool: CurrencyAmount,
                ytPool: CurrencyAmount
            }
        }

        const getAllRewardsFromTxns = async(action: Action, testSimulation: SimulationDetails, pendleFixture: PendleFixture): Promise<rewardsInfo> => {
            
            var promises: Promise<TokenAmount[]>[] = [];
            var otLpValuation: CurrencyAmount = dummyCurrencyAmount, ytLpValuation: CurrencyAmount = dummyCurrencyAmount;
            var otLpSwapFeeApr: BigNumber = new BigNumber(0), ytLpSwapFeeApr: BigNumber = new BigNumber(0);
            if (action == Action.stakeYT) {
                const mintTxn: Transaction = testSimulation.transactions.find((txn: Transaction) => txn.action == TransactionAction.mint)!;
                promises.push(getOtRewards(mintTxn.paid[0], pendleFixture));
            } else {
                const otLpAddLiqTxn: Transaction = getAddOtLiqTxn(testSimulation.transactions, pendleFixture)!;
                promises.push(getOtLpRewards(otLpAddLiqTxn.received[0]));
            }
            if (action == Action.stakeOT || action == Action.stakeOTYT) {
                const otLpAddLiqTxn: Transaction = getAddOtLiqTxn(testSimulation.transactions, pendleFixture)!;
                promises.push(getLmRewards(pendleFixture.otStakingPool, otLpAddLiqTxn.received[0]));
                otLpValuation = await fetchValuation(otLpAddLiqTxn.received[0], signer, chainId);
                otLpSwapFeeApr = await pendleFixture.otMarket.methods(signer, chainId).getSwapFeeApr();
            }
            if (action == Action.stakeYT || action == Action.stakeOTYT) {
                const ytLpAddLiqTxn: Transaction = getAddYtLiqTxn(testSimulation.transactions, pendleFixture)!;
                promises.push(getLmRewards(pendleFixture.ytStakingPool, ytLpAddLiqTxn.received[0]));
                ytLpValuation = await fetchValuation(ytLpAddLiqTxn.received[0], signer, chainId);
                ytLpSwapFeeApr = await pendleFixture.ytMarket.methods(signer, chainId).getSwapFeeApr();
            }

            return {
                
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
            var otLpSwapFeeAprAdjusted: BigNumber = otLpSwapFeeApr.multipliedBy(otLpValuation.amount).div(totalPrincipalValuation);
            var ytLpSwapFeeAprAdjusted: BigNumber = ytLpSwapFeeApr.multipliedBy(ytLpValuation.amount).div(totalPrincipalValuation);
            var otLpSwapFeeAprAdjusted: BigNumber = otLpSwapFeeApr.multipliedBy(otLpValuation.amount).div(totalPrincipalValuation);
            var ytLpSwapFeeAprAdjusted: BigNumber = ytLpSwapFeeApr.multipliedBy(ytLpValuation.amount).div(totalPrincipalValuation);

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