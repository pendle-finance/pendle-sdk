import { providers, Contract } from "ethers";
import { TokenAmount } from "./tokenAmount";
import { distributeConstantsByNetwork, indexRange, isSameAddress } from "../helpers";
import { MARKETINFO, NetworkInfo, OTINFO } from "../networks";
import { Token } from "./token";
import { contracts } from "../contracts";
import { zeroAddress } from "../constants";

export type OtReward = {
    reward: TokenAmount
    address: string
}

export const OT_NOT_EXIST: string = "No OT is found at the given address";

export class Ot extends Token {
    public readonly yieldBearingAddress: string;
    public readonly priceFeedMarketAddress: string | undefined;

    public constructor(address: string, decimals: number, yieldBearingAddress: string, expiry?: number, priceFeedMarketAddress?: string) {
        super(address, decimals, expiry);
        this.yieldBearingAddress = yieldBearingAddress;
        this.priceFeedMarketAddress = priceFeedMarketAddress;
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
            0, // expiry not used
            priceFeedMarketAddress
        )
    }

    public static methods(signer: providers.JsonRpcSigner, chainId?: number): Record<string, any> {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const OTs: OTINFO[] = networkInfo.contractAddresses.OTs;
        const redeemProxyContract = new Contract(
            networkInfo.contractAddresses.misc.PendleRedeemProxy,
            contracts.PendleRedeemProxy.abi,
            signer.provider
        );
        const fetchRewards = async (userAddress: string): Promise<OtReward[]> => {

            const userRewards = await redeemProxyContract.callStatic.redeemOts(
                OTs.map((OTInfo: OTINFO) => OTInfo.address),
                { from: userAddress }
            );
            const formattedResult: OtReward[] = indexRange(0, OTs.length).map((i: number) => {
                const OTInfo: OTINFO = OTs[i];
                if (OTInfo.rewardTokenAddresses === undefined) {
                    return {
                        address: OTInfo.address,
                        reward: new TokenAmount(
                            new Token(zeroAddress, 0),
                            '0'
                        )
                    };
                }
                return {
                    address: OTInfo.address,
                    reward: new TokenAmount(
                        new Token(OTInfo.rewardTokenAddresses![0], networkInfo.decimalsRecord[OTInfo.rewardTokenAddresses![0]]),
                        userRewards[i].amountRewardOne.toString()
                    )
                }
            })
            return formattedResult;
        }

        return {
            fetchRewards
        }
    }
}