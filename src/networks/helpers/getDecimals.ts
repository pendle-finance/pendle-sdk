import { Contract, ethers } from "ethers";
import { avalancheContracts } from "..";
import { contracts, ETHAddress } from "../..";
import { NetworkContractAddresses } from "../types";

var chainId = 43114;
const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`
            : chainId == 42 ? `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`
            : `https://api.avax.network/ext/bc/C/rpc`;

// const providerUrl = `http://127.0.0.1:8545`;
const provider = new ethers.providers.JsonRpcProvider(providerUrl);

export async function getDecimals(contractAddresses: NetworkContractAddresses = avalancheContracts) {
    const decimals: Record<string, number> = {}
    decimals[ETHAddress.toLowerCase()] = 18;

    async function record(address: string): Promise<void> {
        if (decimals[address] === undefined) {
            const c: Contract = new Contract(address, contracts.IERC20.abi, provider)
            decimals[address] = (await c.decimals()).toNumber();
        }
    }

    async function recordAll(addresses: string[] | undefined): Promise<void[]> {
        if (addresses === undefined) return [];
        return Promise.all(addresses.map((t: string) => record(t)));
    }

    for (const yt of contractAddresses.YTs) {
        await record(yt.address);
        await recordAll(yt.rewardTokenAddresses);
        await record(yt.underlyingAssetAddress);
    }
    for (const ot of contractAddresses.OTs) {
        await record(ot.address);
        await recordAll(ot.rewardTokenAddresses);
        await record(ot.yieldTokenAddress);
    }
    for (const market of contractAddresses.pendleMarkets) {
        await record(market.address);
        await recordAll(market.pair);
        await recordAll(market.rewardTokenAddresses);
    }
    if (contractAddresses.otherMarkets !== undefined) {
        for (const otherMarket of contractAddresses.otherMarkets) {
            await record(otherMarket.address);
            await recordAll(otherMarket.pair);
        }
    }
    for (const stakingPool of contractAddresses.stakingPools) {
        await recordAll(stakingPool.interestTokensAddresses);
        await recordAll(stakingPool.rewardTokenAddresses);
    }
    for (const t in contractAddresses.tokens) {
        await record(contractAddresses.tokens[t]);
    }
    console.log(JSON.stringify(decimals, null, '  '));
}