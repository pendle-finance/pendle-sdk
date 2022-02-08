import axios from 'axios';

export type PendleRewardDetails = { address: string; amount: string };

export async function fetchTotalPendleRewards(): Promise<PendleRewardDetails[]> {
  // TODO: Remove the commented lines below
  // const { data } = await axios.get('http://localhost:3000/merkle-distributor/');
  // const { data } = await axios.get('http://localhost:5000/merkle-distributor/');
  const { data } = await axios.get('https://api.pendle.dev/merkle-distributor/');
  return data as PendleRewardDetails[];
}
