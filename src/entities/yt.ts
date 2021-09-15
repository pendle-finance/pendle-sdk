import { Token } from "./token";
import { TokenAmount } from "./tokenAmount";
import { NetworkInfo, YTINFO } from "../networks";
import { distributeConstantsByNetwork, isSameAddress, getDecimal } from "../helpers";
import { providers, Contract } from "ethers";
import { contracts } from "../contracts";

export type YtOrMarketInterest = {
    address: string;
    interest: TokenAmount;
};

const YT_NOT_EXIST = new Error("No YT is found at the given address");

export class Yt extends Token {

    public readonly yieldBearingAddress: string;

    public constructor(address: string, decimals: number, yieldBearingAddress: string, expiry?: number) {
        super(address, decimals, expiry);
        this.yieldBearingAddress = yieldBearingAddress;
    }

    public static find(address: string, chainId?: number): Yt {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const ytInfo: YTINFO | undefined = networkInfo.contractAddresses.YTs.find((y: YTINFO) => {
            return isSameAddress(address, y.address);
        })
        if (ytInfo === undefined) {
            throw YT_NOT_EXIST;
        }
        return new Yt(
            address.toLowerCase(),
            networkInfo.decimalsRecord[address.toLowerCase()],
            ytInfo.rewardTokenAddresses[0],
            ytInfo.expiry.toNumber()
        )
    }

    public static methods(
        signer: providers.JsonRpcSigner,
        chainId?: number
    ): Record<string, any> {

        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const redeemProxyContract = new Contract(
            networkInfo.contractAddresses.misc.PendleRedeemProxy,
            contracts.PendleRedeemProxy.abi,
            signer.provider
        );

        const YTs: YTINFO[] = networkInfo.contractAddresses.YTs;
        const decimalsRecord: Record<string, number> = networkInfo.decimalsRecord;

        const fetchInterests = async (
            userAddress: string,
        ): Promise<YtOrMarketInterest[]> => {

            const formattedResult: YtOrMarketInterest[] = [];

            const userInterests = await redeemProxyContract.callStatic.redeemXyts(
                YTs.map((YTInfo: any) => YTInfo.address),
                { from: userAddress }
            );
            for (let i = 0; i < YTs.length; i++) {
                const YTInfo = YTs[i];
                formattedResult.push({
                    address: YTInfo.address,
                    interest: new TokenAmount(
                        new Token(YTInfo.rewardTokenAddresses[0], await getDecimal(decimalsRecord, YTInfo.rewardTokenAddresses[0], signer.provider)),
                        userInterests[i].toString()
                    ),
                });
            }
            return formattedResult;
        };
        return {
            fetchInterests,
        };
    }
}