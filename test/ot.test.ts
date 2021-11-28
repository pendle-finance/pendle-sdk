
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { dummyAddress, Ot } from '../src';

dotenv.config()
jest.setTimeout(300000);

var chainId = 43114;

describe("Staking pools", () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
    beforeAll(async () => {
        const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}` : `https://api.avax.network/ext/bc/C/rpc`;

        // const providerUrl = `http://127.0.0.1:8545`;
        provider = new ethers.providers.JsonRpcProvider(providerUrl);
        signer = provider.getSigner();
    });
    
    it('get rewards', async() => {
        const res = await Ot.methods({signer, provider, chainId}).fetchRewards('0xECC5748b1fF6b23f284EC81E8bf034409961d8Dc');
        console.log(JSON.stringify(res, null, '  '));
    })
})