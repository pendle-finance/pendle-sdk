import { providers } from "ethers";
import { TokenAmount } from "./tokenAmount";
import { distributeConstantsByNetwork, indexRange, isSameAddress } from "../helpers";
import { MARKETINFO, NetworkInfo, OTINFO } from "../networks";
import { Token } from "./token";
import { forgeIdsInBytes } from "../constants";
import { TrioTokenUints } from "./multiTokens";
import { RedeemProxy } from "./redeemProxy";

export type OtReward = {
    reward: TokenAmount[]
    address: string
}

export const OT_NOT_EXIST: string = "No OT is found at the given address";

export class Ot extends Token {
    public readonly yieldBearingAddress: string;
    public readonly priceFeedMarketAddress: string | undefined;
    public readonly forgeIdInBytes: string;
    public readonly rewardTokenAddresses: string[];

    public constructor(address: string, decimals: number, yieldBearingAddress: string, forgeIdInBytes: string, expiry: number, rewardTokens: string[], priceFeedMarketAddress?: string) {
        super(address, decimals, expiry);
        this.yieldBearingAddress = yieldBearingAddress;
        this.priceFeedMarketAddress = priceFeedMarketAddress;
        this.forgeIdInBytes = forgeIdInBytes;
        this.rewardTokenAddresses = rewardTokens;
    }

    public static find(address: string, chainId?: number): Ot {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const otInfo: OTINFO | undefined = networkInfo.contractAddresses.OTs.find((o: OTINFO) => {
            return isSameAddress(address, o.address);
        })
        if (otInfo === undefined) {
            throw OT_NOT_EXIST;
        }
        const otherMarkets: MARKETINFO[] | undefined = networkInfo.contractAddresses.otherMarkets;
        var priceFeedMarketAddress = undefined;
        if (otherMarkets !== undefined) {
            const marketInfo: MARKETINFO | undefined = otherMarkets.find((m: MARKETINFO) => isSameAddress(m.pair[0], address) || isSameAddress(m.pair[1], address));
            if (marketInfo !== undefined) {
                priceFeedMarketAddress = marketInfo.address;
            }
        } 
        return new Ot(
            address.toLowerCase(),
            networkInfo.decimalsRecord[address.toLowerCase()],
            otInfo.yieldTokenAddress,
            otInfo.forgeIdInBytes,
            0, // expiry not used
            otInfo.rewardTokenAddresses === undefined ? [] : otInfo.rewardTokenAddresses,
            priceFeedMarketAddress
        )
    }

    public static methods(signer: providers.JsonRpcSigner, chainId?: number): Record<string, any> {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);

        const fetchRewards = async (userAddress: string): Promise<OtReward[]> => {
            const OTs: OTINFO[] = networkInfo.contractAddresses.OTs.filter((OTInfo: OTINFO) => Ot.hasRewardsByForgeId(OTInfo.forgeIdInBytes));
            const userRewards: TrioTokenUints[] = await(RedeemProxy.methods(signer, chainId).callStatic.redeemOts(
                OTs.map((OTInfo: OTINFO) => OTInfo.address),
                userAddress
            ));
            const formattedResult: OtReward[] = indexRange(0, OTs.length).map((i: number) => {
                return {
                    address: OTs[i].address,
                    reward: userRewards[i].toTokenAmounts(chainId)
                }
            })
            return formattedResult;
        }

        return {
            fetchRewards
        }
    }

    private static hasRewardsByForgeId(forgeId: string) {
        return !(forgeId == forgeIdsInBytes.SUSHISWAP_SIMPLE || forgeId == forgeIdsInBytes.JOE_SIMPLE)
    }

    public hasRewards(): boolean {
        return Ot.hasRewardsByForgeId(this.forgeIdInBytes)
    }
}