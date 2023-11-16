"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import PriceView from "./components/price";
import QuoteView from "./components/quote";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "ethers";
import {
  useAccount,
  useBalance,
  useContractRead,
  erc20ABI,
  type Address,
} from "wagmi";
import { MAX_ALLOWANCE, exchangeProxy } from "../src/constants";
import MATIC_PERMIT_TOKENS from "../src/supports-permit/137.json";
import type { TokenSupportsPermit } from "../src/utils/eip712_utils.types";
import { TxRelayPriceResponse, TxRelayQuoteResponse } from "../src/utils/types";

export default function Page() {
  const [price, setPrice] = useState<TxRelayPriceResponse | undefined>();
  const [finalize, setFinalize] = useState(false);
  const [checkAppoval, setCheckApproval] = useState(false);
  console.log(price, finalize, checkAppoval, "<- price, finalize");

  return (
    <div>
      {price && finalize ? (
        <h1>QUOTE VIEW</h1>
      ) : (
        <PriceView
          price={price}
          setPrice={setPrice}
          setCheckApproval={setCheckApproval}
        />
      )}
    </div>
  );
}
