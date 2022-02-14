import axios from 'axios';

export type PendleRewardDetails = { address: string; amount: string };

export async function fetchTotalPendleRewards(): Promise<PendleRewardDetails[]> {
  const { data } = await axios.get('https://api.pendle.finance/merkle-distributor/');
  return data as PendleRewardDetails[];
}
