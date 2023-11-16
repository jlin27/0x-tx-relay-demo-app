import {
  erc20ABI,
  useAccount,
  useBalance,
  useContractRead,
  type Address,
} from "wagmi";
import { useEffect, useState } from "react";
import qs from "qs";

import {
  TxRelayPriceResponse,
  TxRelayQuoteResponse,
} from "../../src/utils/types";

export default function QuoteView({
  checkApproval,
  price,
  quote,
  setQuote,
  takerAddress,
}: {
  checkApproval: boolean;
  price: TxRelayPriceResponse;
  quote: TxRelayQuoteResponse;
  setQuote: (price: any) => void;
  takerAddress: Address | undefined;
}) {
  // Fetch quote data
  useEffect(() => {
    const params = {
      sellToken: price.sellTokenAddress,
      buyToken: price.buyTokenAddress,
      sellAmount: price.sellAmount,
      takerAddress,
      checkApproval: checkApproval,
    };

    async function main() {
      const response = await fetch(`/api/quote?${qs.stringify(params)}`);
      const data = await response.json();
    }
  }, []);

  return (
    <div>
      <form>
        <h1>We are in quote</h1>
      </form>
    </div>
  );
}
