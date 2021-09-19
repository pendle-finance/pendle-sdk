export async function fetchPendleUsdPrice() {
  const price = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=pendle&vs_currencies=usd'
  ).then((res) => res.json())

  return price?.pendle?.usd || 0
}

