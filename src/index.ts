const IPendleMarket = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleMarket.sol/IPendleMarket.json');
import { ethers } from 'ethers';

export const sum = (a: number, b: number) => {
  console.log(`env = ${process.env.NODE_ENV}`);
  if ('development' === process.env.NODE_ENV) {
    console.log('boop');
  }
  return a + b;
};

export const readMarketDetails = (provider: any, marketAddress: string) => {
  const marketContract = new ethers.Contract(marketAddress, IPendleMarket.abi, provider);
  console.log(`marketContract = ${marketContract.address}`);
};
