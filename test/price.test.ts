import { fetchPriceFromCoingecko } from "../src/fetchers/priceFetcher";
jest.setTimeout(30000);

describe("price fetcher", () => {
    it('Pendle', async() => {
        const res = await fetchPriceFromCoingecko("ethereum");
        console.log(res.toString());
    })
})