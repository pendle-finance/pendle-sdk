
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { generateTJPoolDetails } from '../src';

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
    
    it('generate', async() => {
        const res = await generateTJPoolDetails(provider)
        console.log(JSON.stringify(res, null, '  '));
        console.log(res.length)
    })
})