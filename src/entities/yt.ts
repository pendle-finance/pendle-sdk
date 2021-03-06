import { Token } from "./token";
import { TokenAmount } from "./tokenAmount";
import { NetworkInfo, PENDLEMARKETNFO, YTINFO } from "../networks";
import { distributeConstantsByNetwork, isSameAddress, indexRange } from "../helpers";
import { utils } from "ethers";
import { YieldContract } from "./yieldContract";
import { RedeemProxy } from "./redeemProxy";
import { ChainSpecifics } from "./types";

export type YtOrMarketInterest = {
    address: string;
    interest: TokenAmount;
};

const YT_MARKET_FEED_NOT_FOUND = "No Market found with this YT "; 

export class Yt extends Token {

    public readonly yieldBearingAddress: string;
    public readonly priceFeedMarketAddress: string;

    public constructor(address: string, decimals: number, yieldBearingAddress: string, expiry: number, priceFeedMarketAddress: string) {
        super(address, decimals, expiry);
        this.yieldBearingAddress = yieldBearingAddress;
        this.priceFeedMarketAddress = priceFeedMarketAddress;
    }

    public static find(address: string, chainId?: number): Yt {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const ytInfo: YTINFO | undefined = networkInfo.contractAddresses.YTs.find((y: YTINFO) => {
            return isSameAddress(address, y.address);
        })
        if (ytInfo === undefined) {
            throw new Error(`No YT is found at the given address ${address}, at chainId ${chainId}`);
        }
        const markets: PENDLEMARKETNFO[] | undefined = networkInfo.contractAddresses.pendleMarkets;
        const marketInfo: PENDLEMARKETNFO | undefined = markets.find((m: PENDLEMARKETNFO) => isSameAddress(m.pair[0], address) || isSameAddress(m.pair[1], address));
        if (marketInfo === undefined) {
            throw new Error(YT_MARKET_FEED_NOT_FOUND + address);
        }
        const priceFeedMarketAddress: string = marketInfo.address;
        return new Yt(
            address.toLowerCase(),
            networkInfo.decimalsRecord[address.toLowerCase()],
            ytInfo.rewardTokenAddresses[0],
            ytInfo.expiry.toNumber(),
            priceFeedMarketAddress
        )
    }

    public static methods({signer, provider, chainId}: ChainSpecifics): Record<string, any> {

        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);

        const YTs: YTINFO[] = networkInfo.contractAddresses.YTs;

        const fetchInterests = async (
            userAddress: string,
        ): Promise<YtOrMarketInterest[]> => {

            const userInterests: TokenAmount[] = await RedeemProxy.methods({signer, provider, chainId}).callStatic.redeemXyts(
                YTs.map((YTInfo: any) => YTInfo.address),
                userAddress
            );
            
            const formattedResult: YtOrMarketInterest[] = indexRange(0, YTs.length).map((i: number) => {
                const YTInfo = YTs[i];
                return {
                    address: YTInfo.address,
                    interest: userInterests[i]
                }
            })
            return formattedResult;
        };
        return {
            fetchInterests,
        };
    }

    public yieldContract(chainId?: number): YieldContract {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const ytInfo: YTINFO[] = networkInfo.contractAddresses.YTs.filter((yt: YTINFO) => isSameAddress(yt.address, this.address));
        if (ytInfo.length === 0) {
            throw Error(`YT with address ${this.address} not found on this network`);
        }
        return new YieldContract(
            utils.parseBytes32String(ytInfo[0].forgeIdInBytes),
            new Token(
                ytInfo[0].underlyingAssetAddress,
                networkInfo.decimalsRecord[ytInfo[0].rewardTokenAddresses[0]]
            ),
            this.expiry!,
            chainId
        )
    }
}