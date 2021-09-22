import { fetchPendleUsdPrice } from "../src/fetchers/priceFetcher";
jest.setTimeout(30000);

describe("price fetcher", () => {
    it('Pendle', async() => {
        const res = await fetchPendleUsdPrice();
        console.log(res.toString());
    })
})