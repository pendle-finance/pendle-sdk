import { fetchTokenPrice } from "../src/fetchers/priceFetcher";
import { ethers, BigNumber as BN, providers } from 'ethers';
import { fetchAaveYield, fetchBenqiYield, fetchCompoundYield, fetchSushiForkYield, fetchWonderlandYield, fetchXJOEYield, fetchBTRFLYYield } from "../src/fetchers/externalYieldRateFetcher";
import { avalancheContracts } from "../src/networks";
import { decimalFactor, getGasLimitWithETH, distributeConstantsByNetwork } from "../src/helpers";
import { EXP_2023, forgeIdsInBytes, Token, TokenAmount, YieldContract } from "../src";
import { getGasPrice } from "../src/fetchers/gasPriceFetcher";

import * as dotenv from 'dotenv';
dotenv.config();

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

    it.only('price', async() => {
        const res = await fetchTokenPrice({address: "0x4B16d95dDF1AE4Fe8227ed7B7E80CF13275e61c9", chainId: chainId});
        // const res = await fetchPENDLEPriceFromCache();
        console.log(res.toString());
    })

    it('external rate', async() => {
        // for (const om of avalancheContracts.otherMarkets!) {
        //     const res = await fetchSushiForkYield(om.address, 43114)
        //     console.log('market:', om.address);
        //     console.log('yield:', res);
        // }
        console.log(await fetchBTRFLYYield(provider, chainId))
    })

    it('gas price', async() => {
        console.log(await getGasPrice(chainId));
    })
})