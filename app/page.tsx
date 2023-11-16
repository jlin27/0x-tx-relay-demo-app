"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import PriceView from "./components/price";
import QuoteView from "./components/quote";
import { useEffect, useState, useCallback } from "react";
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
  const { address } = useAccount();

  console.log(
    price,
    finalize,
    checkAppoval,
    address,
    "<- price, finalize, checkApproval, address"
  );

  return (
    <div>
      {price && finalize ? (
        <h1>QUOTE VIEW</h1>
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
