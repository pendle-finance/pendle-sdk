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
        console.log('result', result)
    })
})