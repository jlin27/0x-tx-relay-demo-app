"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "ethers";
import useSWR from "swr";
import qs from "qs";

function Page() {
  // const priceData = await getTxRelayPrice();
  // console.log(priceData);

  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [tradeDirection, setTradeDirection] = useState("sell");

  console.log(sellAmount, 6, "<-sellAmount, decimals");
  const parsedSellAmount =
    sellAmount && tradeDirection === "sell"
      ? parseUnits(sellAmount, 6).toString()
      : undefined;

  const parsedBuyAmount =
    buyAmount && tradeDirection === "buy"
      ? parseUnits(buyAmount, 18).toString()
      : undefined;

  // Fetch price data
  useEffect(() => {
    const params = {
      sellToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
      buyToken: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
      sellAmount: parsedSellAmount,
      buyAmount: parsedBuyAmount,
      takerAddress: "0x4D2A422dB44144996E855ce15FB581a477dbB947",
    };

    async function main() {
      const response = await fetch(`/api/price?${qs.stringify(params)}`);
      const data = await response.json();

      console.log(data, typeof data);
      // console.log(data.buyAmount, typeof data.buyAmount);
      // console.log(formatUnits(data.buyAmount, 18), data);
    }

    main();
  }, [sellAmount, parsedBuyAmount, parsedSellAmount]);

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: 12,
        }}
      >
        ICON
        <ConnectButton />
      </header>
      <h1>sell USDC to buy WMATIC on Polygon</h1>

      <form>
        <label htmlFor="sell">sell</label>
        <input
          id="sell-amount"
          type="number"
          value={sellAmount}
          onChange={(e) => {
            console.log(e);
            setSellAmount(e.target.value);
          }}
        />
        <label htmlFor="sell">USDC</label>
        <br />
        <label htmlFor="buy">buy</label>
        <input
          id="buy-amount"
          type="number"
          className="cursor-not-allowed"
          readOnly
          value={buyAmount}
        />
        <label htmlFor="sell">WMATIC</label>
        <br />
        <button>Review order</button>
      </form>
    </div>
  );
}

export default Page;

// As the page expands, consider pulling these out as separate React components that's exported and imported.
// function Price() {
//   //
// }

// function Quote() {
//   //
// }
