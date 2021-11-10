import { fetchTokenPrice } from "../src/fetchers/priceFetcher";
import { ethers, BigNumber as BN } from 'ethers';
import { fetchAaveYield, fetchCompoundYield, fetchSushiForkYield } from "../src/fetchers/externalYieldRateFetcher";
import { avalancheContracts } from "../src/networks";
import { getGasLimitWithETH } from "../src/helpers";
const chainId: number = 43114;

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
        const res = await fetchTokenPrice({signer: signer, address: "0x095933f3c6dcdd666f8b65b032a2fc6f529fd074", chainId: chainId});
        console.log(res.toString());
    })

    it('external rate', async() => {
        for (const om of avalancheContracts.otherMarkets!) {
            const res = await fetchSushiForkYield(om.address, 43114)
            console.log('market:', om.address);
            console.log('yield:', res);
        }
    })

    it('gas price', async() => {
        console.log(getGasLimitWithETH(BN.from(123456789), BN.from(0)))
    })
})