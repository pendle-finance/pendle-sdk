import {TokenAmount as JoeTokenAmount, Token as JoeToken} from "@traderjoe-xyz/sdk"
import { providers, Contract } from "ethers";
import { contracts } from "../contracts";
import { getCreate2Address } from "@ethersproject/address";
import { pack, keccak256 } from '@ethersproject/solidity'
import { isSameAddress } from "../helpers";
import { distributeConstantsByNetwork, Call_MultiCall } from "../helpers";
import { NetworkInfo } from "../networks";
import tokens from './traderJoeTokens.json';
var chainId = 4314;

const JoeFactoryAddress = '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10';
const JOE_INIT_CODE_HASH = '0x0bbca9af0511ad1a1da383135cf3a8d2ac620e549ef9f6ae3a4c33c2fed0af91'

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

async function getOnePool(tokenI: any, tokenJ: any, provider: providers.JsonRpcProvider): Promise<PoolDetail> {
    const pairContract = new Contract(
        getCreate2Address(
            JoeFactoryAddress, 
            keccak256(['bytes'], [pack(['address', 'address'], [tokenI.address, tokenJ.address])]),
            JOE_INIT_CODE_HASH),
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
    const leng = tokens.length;
    var res = [];
    const promises = [];

    for (var i = 0; i < leng; i ++) {
        for (var j = i + 1; j < leng; j ++) {
            if (tokens[i].chainId != 43114 || tokens[j].chainId != 43114) continue;
            promises.push(getOnePool(tokens[i], tokens[j], provider));
        } 
    }
    res = await Promise.allSettled(promises).then((values) => {
        return values.filter((v) => v.status == "fulfilled").map((v: any)=> v.value);
    })
    return res;
}