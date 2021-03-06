import { TransactionFetcher } from '../src/entities/transactionFetcher';

// import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

describe('Transaction Entity', () => {
  let transaction: TransactionFetcher;
  const network = 43114;
  beforeAll(() => {
    transaction = new TransactionFetcher(network);
  });

  it('Transaction.getMintTransactions', async () => {
    const result = await transaction.getMintTransactions({
      page: 1,
      limit: 1,
      underlyingTokenAddress: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
      expiry: 1672272000,
      forgeId: 'SushiswapComplex',
    });
    console.log('getMintTransactions', result);
  });

  it.only('Transaction.getRedeemTransactions', async () => {
    const result = await transaction.getRedeemTransactions({
      page: 1,
      limit: 1,
      underlyingTokenAddress: '0x136acd46c134e8269052c62a67042d6bdedde3c9',
      expiry: 1645660800,
      forgeId: 'Wonderland',
    });
    console.log('getRedeemTransactions', JSON.stringify(result, null, '  '));
  });

  it('Transaction.getSwapTransactions', async () => {
    const result = await transaction.getSwapTransactions({
      page: 1,
      limit: 1,
      marketAddress: '0x685d32f394a5F03e78a1A0F6A91B4E2bf6F52cfE',
    });
    console.log('getSwapTransactions', result);
  });

  it('Transaction.getLiquidityTransactions', async () => {
    const result = await transaction.getLiquidityTransactions({
      page: 1,
      limit: 1,
      marketAddress: '0x685d32f394a5F03e78a1A0F6A91B4E2bf6F52cfE',
    });
    console.log('getLiquidityTransactions', result);
  });
});
