import {TokenAmount as JoeTokenAmount, Token as JoeToken} from "@traderjoe-xyz/sdk"
import { providers, Contract } from "ethers";
import { contracts } from "../contracts";
import { getCreate2Address } from "@ethersproject/address";
import { pack, keccak256 } from '@ethersproject/solidity'
import { isSameAddress } from "../helpers";


var tokens: string[];

const JoeFactoryAddress = '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10';
const JOE_INIT_CODE_HASH = '0x0bbca9af0511ad1a1da383135cf3a8d2ac620e549ef9f6ae3a4c33c2fed0af91'

async function generate(provider: providers.JsonRpcProvider) {
    const leng = tokens.length;
    var res = [];
    for (var i = 0; i < leng; i ++) {
        for (var j = i + 1; j < leng; j ++) {
            try {
                const pairContract = new Contract(
                    getCreate2Address(
                        JoeFactoryAddress, 
                        keccak256(['bytes'], [pack(['address', 'address'], [tokens[i], tokens[j]])]),
                        JOE_INIT_CODE_HASH),
                    contracts.UniswapV2Pair.abi,
                    provider);
                const reserves = await pairContract.getReserves();
                const token0 = await pairContract.token0();
                const token0Contract = new Contract(token0, contracts.IERC20.abi, provider);
                const token1 = await pairContract.token1();
                const token1Contract = new Contract(token1, contracts.IERC20.abi, provider);
                const decimals0 = await token0Contract.decimals();
                const decimals1 = await token1Contract.decimals();
                const decimals = await pairContract.decimals();
                res.push({
                    address: pairContract.address,
                    token0: {
                        address: token0,
                        decimals: decimals0,
                        reserve: reserves.reserve0.toString(),
                    },
                    token1: {
                        address: token1,
                        decimals: decimals1,
                        reserve: reserves.reserve1.toString()
                    },
                    decimals: decimals
                })
            } catch (err) {}
        } 
    }
}