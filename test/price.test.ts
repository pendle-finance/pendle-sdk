import { fetchTokenPrice } from "../src/fetchers/priceFetcher";
import { ethers, Contract } from 'ethers';
import { fetchAaveYield, fetchCompoundYield } from "../src/fetchers/externalYieldRateFetcher";
const chainId: number = 1;

jest.setTimeout(300000);

describe("price fetcher", () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
    beforeAll(async () => {
        const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`
            : chainId == 42 ? `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`
                : `https://api.avax.network/ext/bc/C/rpc`;
        // const providerUrl = `http://127.0.0.1:8545`;
        provider = new ethers.providers.JsonRpcProvider(providerUrl);
        signer = provider.getSigner();
      });
    it.only('Pendle', async() => {
        const res = await fetchTokenPrice({signer: signer, address: "0x808507121b80c02388fad14726482e061b8da827", chainId: chainId});
        console.log(res.toString());
    })

    it('external rate', async() => {
        const res = await fetchAaveYield('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
        console.log(res);
    })
})