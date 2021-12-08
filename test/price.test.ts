import { fetchTokenPrice } from "../src/fetchers/priceFetcher";
import { ethers, BigNumber as BN } from 'ethers';
import { fetchAaveYield, fetchBenqiYield, fetchCompoundYield, fetchSushiForkYield, fetchXJOEYield } from "../src/fetchers/externalYieldRateFetcher";
import { avalancheContracts } from "../src/networks";
import { decimalFactor, getGasLimitWithETH } from "../src/helpers";
import { EXP_2023, forgeIdsInBytes, Token, TokenAmount, YieldContract } from "../src";
import { getGasPrice } from "../src/fetchers/gasPriceFetcher";
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

    it.only('price', async() => {
        const res = await fetchTokenPrice({provider, address: "0x3cb265da2e7838b3ae2d9184d4223900761b1123", chainId: chainId});
        console.log(res.toString());
    })

    it.skip('external rate', async() => {
        // for (const om of avalancheContracts.otherMarkets!) {
        //     const res = await fetchSushiForkYield(om.address, 43114)
        //     console.log('market:', om.address);
        //     console.log('yield:', res);
        // }
        console.log(await fetchXJOEYield(signer, chainId))
    })

    it('gas price', async() => {
        console.log(await getGasPrice(chainId));
    })
})