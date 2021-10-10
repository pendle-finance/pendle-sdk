import { fetchTokenPrice } from "../src/fetchers/priceFetcher";
import { ethers, Contract } from 'ethers';
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
})