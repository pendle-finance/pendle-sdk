import { providers, Contract } from "ethers";
import { contracts } from "../contracts";
import { isSameAddress } from "../helpers";
import cachedTokens from './traderJoeTokens.json';
const axios = require('axios');
var chainId = 43114;

const JoeFactoryAddress = '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10';
const JoeFactoryContract = new Contract(JoeFactoryAddress, contracts.UniForkFactory.abi);

export type PoolDetail = {
    address: string,
    token0: {
        address: string,
        decimals: number,
        reserve: string
    },
    token1: {
        address: string,
        decimals: number,
        reserve: string
    },
    decimals: number
}

export async function getTokens() {
    var url = "https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/joe.tokenlist.json";

    const tokens = axios.get(url).then((res: any) => {
        return res.data.tokens;
    }).catch((err: any) => {
        return cachedTokens.tokens;
    });
    return tokens;
}

export async function getOnePool(tokenI: any, tokenJ: any, provider: providers.JsonRpcProvider): Promise<PoolDetail> {
    const pairContract = new Contract(
        await JoeFactoryContract.connect(provider).getPair(tokenI.address, tokenJ.address),
        contracts.UniswapV2Pair.abi,
        provider);
    const reserves = await pairContract.getReserves();
    const token0 = await pairContract.token0();
    const token1 = await pairContract.token1();
    return ({
        address: pairContract.address,
        token0: {
            address: token0,
            decimals: (isSameAddress(tokenI.address, token0))? tokenI.decimals : tokenJ.decimals,
            reserve: reserves.reserve0.toString(),
        },
        token1: {
            address: token1,
            decimals: (isSameAddress(tokenI.address, token1))? tokenI.decimals : tokenJ.decimals,
            reserve: reserves.reserve1.toString()
        },
        decimals: 18
    })
}
export async function generateTJPoolDetails(provider: providers.JsonRpcProvider) {
    const tokens = await getTokens();
    const leng = tokens.length; 
    var res = [];
    const promises = [];

    for (var i = 0; i < leng; i ++) {
        for (var j = i + 1; j < leng; j ++) {
            if (tokens[i].chainId != chainId || tokens[j].chainId != chainId) continue;
            promises.push(getOnePool(tokens[i], tokens[j], provider));
        } 
    }

    
    res = await Promise.allSettled(promises).then((values) => {
        return values.filter((v) => v.status == "fulfilled").map((v: any)=> v.value);
    })
    return res;
}