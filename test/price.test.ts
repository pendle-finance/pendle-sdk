import { fetchTokenPrice } from "../src/fetchers/priceFetcher";
import { ethers, Contract } from 'ethers';
import { fetchAaveYield, fetchCompoundYield } from "../src/fetchers/externalYieldRateFetcher";
jest.setTimeout(30000);

describe("price fetcher", () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
    beforeAll(async () => {
        const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;
    
        // const providerUrl = `http://127.0.0.1:8545`;
        provider = new ethers.providers.JsonRpcProvider(providerUrl);
        signer = provider.getSigner();
      });
    it('Pendle', async() => {
        const res = await fetchTokenPrice({signer: signer, address: "0x37922c69b08babcceae735a31235c81f1d1e8e43", chainId: 1});
        console.log(res.toString());
    })

    it.only('external rate', async() => {
        const res = await fetchAaveYield('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
        console.log(res);
    })
})