type IFlat = Record<string, string | number>;

const AvaxFlat: IFlat = require('./AVAX-flat.json');
const MainnetFlat: IFlat = require('./mainnet-flat.json');

export const flat = {
  AvaxFlat,
  MainnetFlat,
};
