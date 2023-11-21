"use client";

import PriceView from "./components/price";
import QuoteView from "./components/quote";
import StatusView from "./components/status";

import { useState } from "react";
import { useAccount } from "wagmi";
import { TxRelayPriceResponse } from "../src/utils/types";

export default function Page() {
  const { address } = useAccount();
  const [finalize, setFinalize] = useState(false);
  const [checkAppoval, setCheckApproval] = useState(false);
  const [price, setPrice] = useState<TxRelayPriceResponse | undefined>();
  const [quote, setQuote] = useState();
  const [tradeHash, setTradeHash] = useState<string | undefined>();

  console.log(
    price,
    finalize,
    checkAppoval,
    address,
    "<- price, finalize, checkApproval, address"
  );

  if (tradeHash) {
    return <StatusView tradeHash={tradeHash} />;
  }
  console.log(quote, "<-quote");
  return (
    <div>
      {price && finalize ? (
        <QuoteView
          checkApproval={checkAppoval}
          price={price}
          quote={quote}
          setQuote={setQuote}
          onSubmitSuccess={setTradeHash}
          takerAddress={address}
        />
      ) : (
        <PriceView
          takerAddress={address}
          price={price}
          setPrice={setPrice}
          setFinalize={setFinalize}
          setCheckApproval={setCheckApproval}
        />
      )}
    </div>
  );
}
