import { Contract, providers, BigNumber as BN } from "ethers";
import { Token, ETHToken } from "./token";
import { StakingPool } from "./stakingPool";
import { PendleMarket } from "./market";
import { Yt } from "./yt";
import { contracts } from "../contracts";
import { distributeConstantsByNetwork, submitTransactionWithBinarySearchedGasLimit, indexRange, isSameAddress, submitTransaction, binarySearchGas } from "../helpers";
import { LMINFO, NetworkInfo, OTINFO, PENDLEMARKETNFO, YTINFO } from "../networks";
import { Ot } from "./ot";
import { GasInfo, getGasPrice } from "../fetchers/gasPriceFetcher";
import { TokenAmount } from "./tokenAmount";
import { PairTokenUints, TrioTokenUints } from "./multiTokens";
import { ChainSpecifics } from "./types";

enum ProxyVersion {
    OldSingle = 0,
    Single,
    Multi
}

enum LmRedeemMode {
    INTEREST = 0,
    REWARDS,
    BOTH
}

type OtRewards = {
    amountRewardOne: BN;
    amountRewardTwo: BN;
}

type LmRedeemRequest = {
    addr: string;
    expiry: number;
    mode: LmRedeemMode;
}

type wrappedRequest = {
    request: LmRedeemRequest,
    isInvalidExpiry: boolean,
    index: number
};

type LmRedeemResult = {
    rewards: PairTokenUints;
    interests: PairTokenUints;
}

export class RedeemProxy {
    public static methods({signer, provider, chainId}: ChainSpecifics): Record<string, any> {
        var proxyVersion: ProxyVersion;
        var redeemProxyContract: Contract;
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        
        if (chainId === undefined || chainId == 1 || chainId == 42) {
            proxyVersion = ProxyVersion.OldSingle;
            redeemProxyContract = new Contract(networkInfo.contractAddresses.misc.PendleRedeemProxy, contracts.PendleRedeemProxy.abi, provider);
        } else {
            proxyVersion = ProxyVersion.Multi;
            redeemProxyContract = new Contract(networkInfo.contractAddresses.misc.PendleRedeemProxy, contracts.PendleRedeemProxyMulti.abi, provider);
        }

        const constructArgsForClaimYieldsOld = (
            yts: Token[],
            ots: Token[],
            lps: Token[],
            interestStakingPools: StakingPool[],
            rewardStakingPools: StakingPool[],
            userAddress: string
        ): any[] => {
            const ytAddresses: string[] = yts.map((t: Token) => t.address);
            const otAddresses: string[] = ots.map((t: Token) => Ot.find(t.address, chainId)).filter((t: Ot) => t.hasRewards()).map((t: Ot) => t.address);
            const marketAddresses: string[] = lps.map((t: Token) => t.address);
            const lmV1sForInterest: StakingPool[] = interestStakingPools.filter((s: StakingPool) => s.isLmV1());
            const lmV1sExpiriesForInterest: number[] = lmV1sForInterest.map((s: StakingPool) => {
                const market: PendleMarket = PendleMarket.find(s.inputToken.address, chainId);
                const yt: Yt = Yt.find(market.tokens[0].address, chainId);
                return yt.expiry!;
            })
            const lmV2sForInterest: StakingPool[] = interestStakingPools.filter((s: StakingPool) => s.isLmV2());
            const lmV1sForRewards: StakingPool[] = rewardStakingPools.filter((s: StakingPool) => s.isLmV1());
            const lmV1sExpiriesForRewards: number[] = lmV1sForRewards.map((s: StakingPool) => {
                const market: PendleMarket = PendleMarket.find(s.inputToken.address, chainId);
                const yt: Yt = Yt.find(market.tokens[0].address, chainId);
                return yt.expiry!;
            })
            const lmV2sForRewards: StakingPool[] = rewardStakingPools.filter((s: StakingPool) => s.isLmV2());

            const args: any[] = [
                {
                    xyts: ytAddresses,
                    ots: otAddresses,
                    markets: marketAddresses,
                    lmContractsForRewards: lmV1sForRewards.map((s: StakingPool) => s.address),
                    expiriesForRewards: lmV1sExpiriesForRewards,
                    lmContractsForInterests: lmV1sForInterest.map((s: StakingPool) => s.address),
                    expiriesForInterests: lmV1sExpiriesForInterest,
                    lmV2ContractsForRewards: lmV2sForRewards.map((s: StakingPool) => s.address),
                    lmV2ContractsForInterests: lmV2sForInterest.map((s: StakingPool) => s.address)
                },
                userAddress
            ];
            return args;
        }

        const constructArgsForClaimYieldsMulti = (
            yts: Token[],
            ots: Token[],
            lps: Token[],
            interestStakingPools: StakingPool[],
            rewardStakingPools: StakingPool[],
            tokensToDistribute: Token[],
            userAddress: string
        ): any[] => {
            const ytAddresses: string[] = yts.map((t: Token) => t.address);
            const otAddresses: string[] = ots.map((t: Token) => Ot.find(t.address, chainId)).filter((t: Ot) => t.hasRewards()).map((t: Ot) => t.address);
            const marketAddresses: string[] = lps.map((t: Token) => t.address);

            const lmV1sForInterest: StakingPool[] = interestStakingPools.filter((s: StakingPool) => s.isLmV1());
            const lmV1sExpiriesForInterest: number[] = lmV1sForInterest.map((s: StakingPool) => {
                const market: PendleMarket = PendleMarket.find(s.inputToken.address, chainId);
                const yt: Yt = Yt.find(market.tokens[0].address, chainId);
                return yt.expiry!;
            })
            const lmV1sForRewards: StakingPool[] = rewardStakingPools.filter((s: StakingPool) => s.isLmV1());
            const lmV1sExpiriesForRewards: number[] = lmV1sForRewards.map((s: StakingPool) => {
                const market: PendleMarket = PendleMarket.find(s.inputToken.address, chainId);
                const yt: Yt = Yt.find(market.tokens[0].address, chainId);
                return yt.expiry!;
            })
            const lmV1RedeemRequestsForInterests: LmRedeemRequest[] = indexRange(0, lmV1sForInterest.length).map((i: number) => {
                return {
                    addr: lmV1sForInterest[i].address,
                    expiry: lmV1sExpiriesForInterest[i],
                    mode: LmRedeemMode.INTEREST
                }
            })
            const lmV1RedeemRequestsForRewards: LmRedeemRequest[] = indexRange(0, lmV1sForRewards.length).map((i: number) => {
                return {
                    addr: lmV1sForRewards[i].address,
                    expiry: lmV1sExpiriesForRewards[i],
                    mode: LmRedeemMode.REWARDS
                }
            })
            const lmV1RedeemRequests: LmRedeemRequest[] = lmV1RedeemRequestsForInterests.concat(lmV1RedeemRequestsForRewards);

            const lmV2sForInterest: StakingPool[] = interestStakingPools.filter((s: StakingPool) => s.isLmV2());
            const lmV2sForRewards: StakingPool[] = rewardStakingPools.filter((s: StakingPool) => s.isLmV2());
            const lmV2RedeemRequestsForInterests: LmRedeemRequest[] = indexRange(0, lmV2sForInterest.length).map((i: number) => {
                return {
                    addr: lmV2sForInterest[i].address,
                    expiry: 0,
                    mode: LmRedeemMode.INTEREST
                }
            })
            const lmV2RedeemRequestsForRewards: LmRedeemRequest[] = indexRange(0, lmV2sForRewards.length).map((i: number) => {
                return {
                    addr: lmV2sForRewards[i].address,
                    expiry: 0,
                    mode: LmRedeemMode.REWARDS
                }
            })
            const lmV2RedeemRequests: LmRedeemRequest[] = lmV2RedeemRequestsForInterests.concat(lmV2RedeemRequestsForRewards);

            return [
                {
                    yts: ytAddresses,
                    ots: otAddresses,
                    markets: marketAddresses,
                    lmV1: lmV1RedeemRequests,
                    lmV2: lmV2RedeemRequests,
                    tokensDistribution: tokensToDistribute.map((t: Token) => t.address)
                },
                userAddress
            ]
        }

        const constructArgsForClaimYields = (
            yts: Token[],
            ots: Token[],
            lps: Token[],
            interestStakingPools: StakingPool[],
            rewardStakingPools: StakingPool[],
            tokensToDistribute: Token[],
            userAddress: string
        ): any[] => {
            switch (proxyVersion) {
                case ProxyVersion.OldSingle:
                    return constructArgsForClaimYieldsOld(yts, ots, lps, interestStakingPools, rewardStakingPools, userAddress);

                case ProxyVersion.Multi:
                    return constructArgsForClaimYieldsMulti(yts, ots, lps, interestStakingPools, rewardStakingPools, tokensToDistribute, userAddress);

                default:
                    throw Error(`Invalid proxy version.`)
            }
        }

        const claimYields = async ({
            yts = [],
            ots = [],
            lps = [],
            interestStakingPools = [],
            rewardStakingPools = [],
            tokensToDistribute = []
        }: {
            yts: Token[],
            ots: Token[],
            lps: Token[],
            interestStakingPools: StakingPool[],
            rewardStakingPools: StakingPool[],
            tokensToDistribute: Token[]
        }): Promise<providers.TransactionResponse> => {
            const userAddress: string = await signer!.getAddress();
            const args: any[] = constructArgsForClaimYields(yts, ots, lps, interestStakingPools, rewardStakingPools, tokensToDistribute, userAddress);
            console.log(JSON.stringify(args, null, "  "))
            return submitTransactionWithBinarySearchedGasLimit(redeemProxyContract, proxyVersion == ProxyVersion.OldSingle, signer!, 'redeem', args);
        }

        const estimateGasForClaimYields = async ({
            yts = [],
            ots = [],
            lps = [],
            interestStakingPools = [],
            rewardStakingPools = [],
            tokensToDistribute = []
        }: {
            yts?: Token[],
            ots?: Token[],
            lps?: Token[],
            interestStakingPools?: StakingPool[],
            rewardStakingPools?: StakingPool[],
            tokensToDistribute: Token[]
        }): Promise<GasInfo> => {
            console.log(rewardStakingPools);
            const userAddress: string = "0xe1d900c75fd48913c1d092fa0e4c3d7430de7f1b";
            // const userAddress: string = await signer!.getAddress();
            const args: any[] = constructArgsForClaimYields(yts, ots, lps, interestStakingPools, rewardStakingPools, tokensToDistribute, userAddress);
            console.log(args);
            const gasLimit: BN = await binarySearchGas(redeemProxyContract, proxyVersion == ProxyVersion.OldSingle, userAddress, 'redeem', args)
            const gasPrice: BN = await getGasPrice(chainId);
            console.log("GasLimit", gasLimit.toString())
            return {
                gasCost: new TokenAmount(
                    ETHToken,
                    gasLimit.mul(gasPrice).toString(),
                ),
                gasLimit: gasLimit.toString(),
                gasPrice: new TokenAmount(
                    ETHToken,
                    gasPrice.toString(),
                )
            }
        }

        const callStatic: Record<string, any> = {
            redeemMarkets: async (marketsAddresses: string[], userAddress: string): Promise<TokenAmount[]> => {
                switch (proxyVersion) {
                    case ProxyVersion.OldSingle: {
                        const userInterests: BN[] = await redeemProxyContract.callStatic.redeemMarkets(marketsAddresses, { from: userAddress });
                        return indexRange(0, marketsAddresses.length).map((i: number) => {
                            const marketInfo: PENDLEMARKETNFO = networkInfo.contractAddresses.pendleMarkets.find((m: PENDLEMARKETNFO) => isSameAddress(m.address, marketsAddresses[i]))!;
                            return new TokenAmount(
                                new Token(
                                    marketInfo.rewardTokenAddresses[0],
                                    networkInfo.decimalsRecord[marketInfo.rewardTokenAddresses[0]]
                                ),
                                userInterests[i].toString()
                            )
                        })
                    }

                    case ProxyVersion.Multi: {
                        const userInterests: BN[] = await redeemProxyContract.callStatic.redeemMarkets(marketsAddresses, userAddress);
                        return indexRange(0, marketsAddresses.length).map((i: number) => {
                            const marketInfo: PENDLEMARKETNFO = networkInfo.contractAddresses.pendleMarkets.find((m: PENDLEMARKETNFO) => isSameAddress(m.address, marketsAddresses[i]))!;
                            return new TokenAmount(
                                new Token(
                                    marketInfo.rewardTokenAddresses[0],
                                    networkInfo.decimalsRecord[marketInfo.rewardTokenAddresses[0]]
                                ),
                                userInterests[i].toString()
                            )
                        })
                    }

                    default:
                        throw Error(`Invalid proxy version.`);
                }
            },

            redeemOts: async (otAddresses: string[], userAddress: string): Promise<TrioTokenUints[]> => {
                switch (proxyVersion) {
                    case ProxyVersion.OldSingle: {
                        const userRewards: BN[] = (await redeemProxyContract.callStatic.redeemOts(otAddresses, { from: userAddress }))
                            .map((res: OtRewards) => res.amountRewardOne);
                        return indexRange(0, otAddresses.length).map((i: number) => {
                            const otInfo: OTINFO = networkInfo.contractAddresses.OTs.find((ot: OTINFO) => isSameAddress(ot.address, otAddresses[i]))!;
                            return TrioTokenUints.fromOne(otInfo.rewardTokenAddresses![0], userRewards[i]);
                        })
                    }

                    case ProxyVersion.Multi: {
                        const userRewards = await redeemProxyContract.callStatic.redeemOts(otAddresses, userAddress, { from: userAddress });
                        return userRewards.map((t: any) => TrioTokenUints.fromContractTrioTokenUints(t));
                    }

                    default:
                        throw Error(`Invalid proxy version.`)
                }
            },

            redeemXyts: async (ytAddresses: string[], userAddress: string): Promise<TokenAmount[]> => {
                switch (proxyVersion) {
                    case ProxyVersion.OldSingle: {
                        const userInterests: BN[] = await redeemProxyContract.callStatic.redeemXyts(ytAddresses, { from: userAddress });
                        return indexRange(0, ytAddresses.length).map((i: number) => {
                            const ytInfo: YTINFO = networkInfo.contractAddresses.YTs.find((y: YTINFO) => isSameAddress(y.address, ytAddresses[i]))!;
                            return new TokenAmount(
                                new Token(
                                    ytInfo.rewardTokenAddresses[0],
                                    networkInfo.decimalsRecord[ytInfo.rewardTokenAddresses[0]]
                                ),
                                userInterests[i].toString()
                            )
                        })
                    }

                    case ProxyVersion.Multi: {
                        const userInterests: BN[] = await redeemProxyContract.callStatic.redeemYts(ytAddresses, userAddress);
                        return indexRange(0, ytAddresses.length).map((i: number) => {
                            const ytInfo: YTINFO = networkInfo.contractAddresses.YTs.find((y: YTINFO) => isSameAddress(y.address, ytAddresses[i]))!;
                            return new TokenAmount(
                                new Token(
                                    ytInfo.rewardTokenAddresses[0],
                                    networkInfo.decimalsRecord[ytInfo.rewardTokenAddresses[0]]
                                ),
                                userInterests[i].toString()
                            )
                        })
                    }

                    default:
                        throw Error(`Invalid proxy version.`)
                }
            },

            redeemLmInterests: async (lmAddresses: string[], expiries: BN[], userAddress: string): Promise<PairTokenUints[]> => {
                switch (proxyVersion) {
                    case ProxyVersion.OldSingle: {
                        const userInterests: BN[] = (await redeemProxyContract.callStatic.redeemLmInterests(lmAddresses, expiries, userAddress)).lmInterests;
                        return indexRange(0, lmAddresses.length).map((i: number) => {
                            const LMInfo: LMINFO = networkInfo.contractAddresses.stakingPools.find((lm: LMINFO) => {
                                return isSameAddress(lm.address, lmAddresses[i]) && lm.expiry!.eq(expiries[i])
                            })!;
                            return PairTokenUints.fromOne(LMInfo.interestTokensAddresses[0], userInterests[i]);
                        });
                    }

                    case ProxyVersion.Multi: {
                        const userExpiriesOnAllLmV1s: BN[][] = await Promise.all(indexRange(0, lmAddresses.length).map(async (i: number): Promise<BN[]> => {
                            const LMContract: Contract = new Contract(lmAddresses[i], contracts.PendleGenericLiquidityMiningMulti.abi, provider);
                            return await LMContract.readUserExpiries(userAddress);
                        }))
                        const userInterests: PairTokenUints[] = new Array(lmAddresses.length).fill(PairTokenUints.EMPTY);
                        const redeemRequests: wrappedRequest[] = indexRange(0, lmAddresses.length).map((i: number): wrappedRequest => {
                            return {
                                request: {
                                    addr: lmAddresses[i],
                                    expiry: expiries[i].toNumber(),
                                    mode: LmRedeemMode.INTEREST
                                },
                                isInvalidExpiry: userExpiriesOnAllLmV1s[i].find((exp: BN) => exp.eq(expiries[i])) === undefined,
                                index: i
                            }
                        })
                        const redeemRequestsWithValidExpiries: wrappedRequest[] = redeemRequests.filter((w: wrappedRequest) => !w.isInvalidExpiry);
                        const userInterestsWithValidExpiries: PairTokenUints[] = (await redeemProxyContract.callStatic.redeemLmV1(
                            redeemRequestsWithValidExpiries.map((w: wrappedRequest): LmRedeemRequest => w.request), userAddress)
                        ).map((res: LmRedeemResult) => PairTokenUints.fromContractPairTokenUints(res.interests));
                        indexRange(0, userInterestsWithValidExpiries.length).forEach((i: number) => {
                            userInterests[redeemRequestsWithValidExpiries[i].index] = userInterestsWithValidExpiries[i]
                        })
                        return userInterests;
                    }

                    default:
                        throw Error(`Invalid proxy version.`);
                }
            },

            redeemLmRewards: async (lmAddresses: string[], expiries: BN[], userAddress: string): Promise<PairTokenUints[]> => {
                switch (proxyVersion) {
                    case ProxyVersion.OldSingle: {
                        const userRewards: BN[] = (await redeemProxyContract.callStatic.redeemLmRewards(lmAddresses, expiries, userAddress)).lmRewards;
                        return indexRange(0, lmAddresses.length).map((i: number) => {
                            const LMInfo: LMINFO = networkInfo.contractAddresses.stakingPools.find((lm: LMINFO) => {
                                return isSameAddress(lm.address, lmAddresses[i]) && lm.expiry!.eq(expiries[i])
                            })!
                            return PairTokenUints.fromOne(LMInfo.rewardTokenAddresses[0], userRewards[i]);
                        });
                    }

                    case ProxyVersion.Multi: {
                        const userExpiriesOnAllLmV1s: BN[][] = await Promise.all(indexRange(0, lmAddresses.length).map(async (i: number): Promise<BN[]> => {
                            const LMContract: Contract = new Contract(lmAddresses[i], contracts.PendleLiquidityMiningBase.abi, provider);
                            const userExpiries: BN[] = await LMContract.readUserExpiries(userAddress);
                            return userExpiries;
                        }))
                        const userRewards: PairTokenUints[] = new Array(lmAddresses.length).fill(PairTokenUints.EMPTY);

                        const redeemRequests: wrappedRequest[] = indexRange(0, lmAddresses.length).map((i: number): wrappedRequest => {
                            return {
                                request: {
                                    addr: lmAddresses[i],
                                    expiry: expiries[i].toNumber(),
                                    mode: LmRedeemMode.REWARDS
                                },
                                isInvalidExpiry: userExpiriesOnAllLmV1s[i].find((exp: BN) => exp.eq(expiries[i])) === undefined,
                                index: i
                            }
                        })
                        const redeemRequestsWithValidExpiries: wrappedRequest[] = redeemRequests.filter((w: wrappedRequest) => !w.isInvalidExpiry);
                        const userRewardsWithValidExpiries: PairTokenUints[] = (await redeemProxyContract.callStatic.redeemLmV1(
                            redeemRequestsWithValidExpiries.map((w: wrappedRequest) => w.request), userAddress))
                            .map((res: LmRedeemResult) => PairTokenUints.fromContractPairTokenUints(res.rewards));
                        indexRange(0, userRewardsWithValidExpiries.length).forEach((i: number) => {
                            userRewards[redeemRequestsWithValidExpiries[i].index] = userRewardsWithValidExpiries[i]
                        })
                        return userRewards;
                    }

                    default:
                        throw Error(`Invalid proxy version.`);
                }
            },

            redeemLmV2Interests: async (lmAddresses: string[], userAddress: string): Promise<PairTokenUints[]> => {
                switch (proxyVersion) {
                    case ProxyVersion.OldSingle: {
                        const userInterests: BN[] = await redeemProxyContract.callStatic.redeemLmV2Interests(lmAddresses, userAddress);
                        return indexRange(0, lmAddresses.length).map((i: number) => {
                            const LMInfo: LMINFO = networkInfo.contractAddresses.stakingPools.find((lm: LMINFO) => isSameAddress(lm.address, lmAddresses[i]))!;
                            return PairTokenUints.fromOne(LMInfo.interestTokensAddresses[0], userInterests[i]);
                        })
                    }

                    case ProxyVersion.Multi: {
                        const redeemRequests: LmRedeemRequest[] = indexRange(0, lmAddresses.length).map((i: number) => {
                            return {
                                addr: lmAddresses[i],
                                expiry: 0,
                                mode: LmRedeemMode.INTEREST
                            }
                        })
                        return (await redeemProxyContract.callStatic.redeemLmV2(redeemRequests, userAddress)).map((res: LmRedeemResult) => PairTokenUints.fromContractPairTokenUints(res.interests))
                    }

                    default:
                        throw Error(`Invalid proxy version.`);

                }
            },

            redeemLmV2Rewards: async (lmAddresses: string[], userAddress: string): Promise<PairTokenUints[]> => {
                switch (proxyVersion) {
                    case ProxyVersion.OldSingle: {
                        const userRewards: BN[] = await redeemProxyContract.callStatic.redeemLmV2Rewards(lmAddresses, userAddress);
                        return indexRange(0, lmAddresses.length).map((i: number) => {
                            const LMInfo: LMINFO = networkInfo.contractAddresses.stakingPools.find((lm: LMINFO) => isSameAddress(lm.address, lmAddresses[i]))!;
                            return PairTokenUints.fromOne(LMInfo.rewardTokenAddresses[0], userRewards[i]);
                        })
                    }

                    case ProxyVersion.Multi: {
                        const redeemRequests: LmRedeemRequest[] = indexRange(0, lmAddresses.length).map((i: number) => {
                            return {
                                addr: lmAddresses[i],
                                expiry: 0,
                                mode: LmRedeemMode.REWARDS
                            }
                        });
                        return (await redeemProxyContract.callStatic.redeemLmV2(redeemRequests, userAddress)).map((res: LmRedeemResult) => PairTokenUints.fromContractPairTokenUints(res.rewards));
                    }

                    default:
                        throw Error(`Invalid proxy version.`);
                }
            },

            redeemTokenDist: async(tokenAddresses: string[], userAddress: string): Promise<TokenAmount[]> => {
                switch (proxyVersion) {
                    case ProxyVersion.OldSingle: {
                        throw Error(`Redeem proxy on ${chainId || 1} does not support claiming token distribution`);
                    }

                    case ProxyVersion.Multi: {
                        const redeemResults: BN[] = await redeemProxyContract.callStatic.redeemTokenDist(tokenAddresses, userAddress);
                        return indexRange(0, tokenAddresses.length).map((i: number): TokenAmount => {
                            return new TokenAmount(
                                new Token(
                                    tokenAddresses[i],
                                    networkInfo.decimalsRecord[tokenAddresses[i]]
                                ),
                                redeemResults[i].toString()
                            )
                        })
                    }

                    default:
                        throw Error(`Invalid proxy version.`);
                }
            }   
        }

        return {
            claimYields,
            estimateGasForClaimYields,
            callStatic
        }
    }
}