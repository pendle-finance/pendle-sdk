import * as dotenv from 'dotenv';
import BigNumber from 'bignumber.js';
import { Contract, providers } from 'ethers';
import { Token, TokenAmount, contracts, distributeConstantsByNetwork, fetchTokenPrice } from '../src';
import { flat } from '../scripts/flat';

dotenv.config();
jest.setTimeout(30000);

describe('Get funds from treasury', () => {
  it('Gets funds from treasury', async () => {
    await main();
  });
});

const ChainIds: Record<string, number> = {
  ETHEREUM: 1,
  AVALANCHE: 43114,
};

const NetworkConstants = {
  [ChainIds.ETHEREUM]: {
    ...distributeConstantsByNetwork(ChainIds.ETHEREUM),
    provider: new providers.JsonRpcProvider(`https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`),
    flat: flat.MainnetFlat,
  },
  [ChainIds.AVALANCHE]: {
    ...distributeConstantsByNetwork(ChainIds.AVALANCHE),
    provider: new providers.JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc'),
    flat: flat.AvaxFlat,
  },
};

async function main(): Promise<void> {
  const totalFunds = await getTotalFunds();
  console.log(`Total funds in treasury: $${totalFunds}`);
}

async function getTotalFunds(): Promise<string> {
  const treasuryFunds = await getTreasuryMultisigFunds();
  const marketSwapFees = await getMarketSwapFees();
  const total = treasuryFunds.plus(marketSwapFees);
  return total.toString();
}

async function getTreasuryMultisigFunds(): Promise<BigNumber> {
  const treasuries = {
    [ChainIds.ETHEREUM]: '0x8270400d528c34e1596ef367eedec99080a1b592',
    [ChainIds.AVALANCHE]: '0xA605617511d2A540f418BFBc1CECafB15582B77A',
  };
  const fundsPerChain = await Promise.all(
    Object.entries(treasuries).map(async ([chainId, treasury]) => {
      const chainIdInt = parseInt(chainId);
      const { provider, decimalsRecord, flat } = NetworkConstants[chainIdInt];
      const pools = Object.entries(flat)
        .filter(([key, value]) => key.startsWith('POOL_'))
        .map(([key, value]) => value) as string[];
      const fundsPerPool = pools.map(async (pool) => {
        const poolAddress = pool.toLowerCase();
        const token = new Token(poolAddress, decimalsRecord[poolAddress]);
        const tokenContract = new Contract(poolAddress, contracts.IERC20.abi, provider);
        const amount = await tokenContract.callStatic.balanceOf(treasury);
        const tokenAmount = new TokenAmount(token, amount.toString());
        const price = await fetchTokenPrice({ chainId: chainIdInt, address: poolAddress, provider });
        return price.times(tokenAmount.formattedAmount());
      });
      return await Promise.all(fundsPerPool);
    })
  );

  return sumArray(fundsPerChain.flat());
}

async function getMarketSwapFees(): Promise<BigNumber>{
  type MarketInfo = {
    forge: string;
    tokens: string[];
  };
  const markets = {
    [ChainIds.ETHEREUM]: {
      AAVE: {
        forge: flat.MainnetFlat.FORGE_AAVE_V2,
        tokens: ['USDC'],
      },
      COMPOUND: {
        forge: flat.MainnetFlat.FORGE_COMPOUND,
        tokens: ['DAI'],
      },
      COMPOUND_V2: {
        forge: flat.MainnetFlat.FORGE_COMPOUND_V2,
        tokens: ['DAI'],
      },
      SUSHISWAPSIMPLE: {
        forge: flat.MainnetFlat.FORGE_SUSHISWAPSIMPLE,
        tokens: ['SLP_PENDLE_WETH'],
      },
      SUSHISWAPCOMPLEX: {
        forge: flat.MainnetFlat.FORGE_SUSHISWAPCOMPLEX,
        tokens: ['SLP_USDC_WETH'],
      },
    },
    [ChainIds.AVALANCHE]: {
      BENQI: {
        forge: flat.AvaxFlat.FORGE_BENQI,
        tokens: ['USDC', 'WAVAX'],
      },
      XJOE: {
        forge: flat.AvaxFlat.FORGE_XJOE,
        tokens: ['JOE'],
      },
      TRADERJOESIMPLE: {
        forge: flat.AvaxFlat.FORGE_TRADERJOESIMPLE,
        tokens: ['JLP_WAVAX_PENDLE'],
      },
      WONDERLAND: {
        forge: flat.AvaxFlat.FORGE_WONDERLAND,
        tokens: ['MEMO'],
      },
    },
  } as Record<number, Record<string, MarketInfo>>;

  const computeFeesOnChain = async (chainId: string, market: Record<string, MarketInfo>) => {
    const chainIdInt = parseInt(chainId);
    const { provider, decimalsRecord, flat } = NetworkConstants[chainIdInt];
    const expiries = Object.entries(flat)
      .filter(([key, value]) => key.startsWith('TIME_'))
      .map(([key, value]) => value);
    return await Promise.all(
      Object.values(market).map(async ({ forge, tokens }) => {
        const forgeContract = new Contract(forge, contracts.PendleCompoundV2Forge.abi, provider);
        const feesForForge = await Promise.all(
          tokens.map(async (t: string) => {
            const tokenAddress = (flat[`TOKEN_${t.toUpperCase()}`] as string).toLowerCase();
            const token = new Token(tokenAddress, decimalsRecord[tokenAddress]);
            const price = await fetchTokenPrice({ chainId: chainIdInt, provider, address: tokenAddress });
            const feesInUSD = await expiries
              .map(async (expiry) => await forgeContract.callStatic.totalFee(tokenAddress, expiry))
              .map(async (amount) => new TokenAmount(token, (await amount).toString()).formattedAmount())
              .map(async (amount) => price.times(await amount))
              .reduce(async (acc, curr) => (await acc).plus(await curr));
            return feesInUSD;
          })
        );
        return feesForForge;
      })
    );
  };
  const feesOnAllChains = await Promise.all(
    Object.entries(markets).map(async ([chainId, details]) => await computeFeesOnChain(chainId, details))
  );

  return sumArray(feesOnAllChains.flat(2));
}

function sumArray(arr: BigNumber[]): BigNumber {
  return arr.reduce((acc, curr) => acc.plus(curr), new BigNumber(0));
}
