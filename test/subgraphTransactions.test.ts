import { Transaction } from '../src';

// import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

describe('Transaction Entity', () => {
    let transaction:Transaction;
    const network = 1;
    beforeAll(() => {
        transaction = new Transaction(network)
    })

    it('Transaction.getMintTransactions', async () => {
        const result = await transaction.getMintTransactions({page:1, limit:1})
        console.log('getMintTransactions', result)
    })

    it('Transaction.getRedeemTransactions', async () => {
        const result = await transaction.getRedeemTransactions({page:1, limit:1})
        console.log('getRedeemTransactions', result)
    })

    it('Transaction.getSwapTransactions', async () => {
        const result = await transaction.getSwapTransactions({page:1, limit:1})
        console.log('getSwapTransactions', result)
    })

    it('Transaction.getLiquidityTransactions', async () => {
        const result = await transaction.getLiquidityTransactions({page:1, limit:1})
        console.log('getLiquidityTransactions', result)
    })
})