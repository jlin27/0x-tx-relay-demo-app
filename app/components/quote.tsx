import { useSignTypedData, type Address } from "wagmi";
import { useEffect, useState } from "react";
import qs from "qs";
import {
  TxRelayPriceResponse,
  TxRelayQuoteResponse,
} from "../../src/utils/types";
import { secp256k1 } from "@noble/curves/secp256k1";
import { Hex, hexToNumber } from "viem";

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
  // signature for approval (if gasless approval)
  const [gaslessApprovalSignature, setGaslessApprovalSignature] =
    useState<Hex>();

  // signature for trade (always required)
  const [tradeSignature, setTradeSignature] = useState<Hex>();

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
      setQuote(data);
      // console.log(data, "<-quote");
      // console.log(data.approval.eip712, "<-approval.eip712");
    }
    main();
  }, [
    price.sellTokenAddress,
    price.buyTokenAddress,
    price.sellAmount,
    takerAddress,
    checkApproval,
    setQuote, // is setQuote stable enough to add here?
  ]);

  if (!quote) {
    return <div>Getting best quote...</div>;
  }

  const { approval, trade } = quote; // grabbing the approval and trade objects
  const { eip712: approvalEip712 } = approval || {}; // if approval object exists, rename the eip712 object to approvalEip712; otherwise, empty
  const { type: approvalType } = approval || {}; // if approval object exists, rename the type key to approvalType; otherwise, empty
  const { eip712: tradeEip712 } = trade; // for trade object, rename the eip712 object to tradeEip712
  const { eip712: tradeType } = trade; // for trade object, rename the type key to tradeType

  return (
    <div className="p-3 mx-auto max-w-screen-sm ">
      <form>
        <h1>We are in quote</h1>
        <div>{quote.sellAmount}</div>
      </form>
      <div>{gaslessApprovalSignature}</div>
      <div>{tradeSignature}</div>

      {approvalEip712 ? (
        <SignApproval
          approvalEip712={approvalEip712}
          onSign={(signature) => {
            // set state
            setGaslessApprovalSignature(signature);
          }}
        />
      ) : (
        <div>Getting best quote...</div>
      )}

      {tradeEip712 ? (
        <SignTrade
          tradeEip712={tradeEip712}
          onSign={(signature) => {
            // set state
            setTradeSignature(signature);
          }}
        />
      ) : (
        <div>Getting best quote...</div>
      )}

      <SubmitOrderButton
        gaslessApprovalSignature={gaslessApprovalSignature}
        tradeSignature={tradeSignature}
      />
    </div>
  );

  function SubmitOrderButton({
    gaslessApprovalSignature,
    tradeSignature,
  }: {
    gaslessApprovalSignature?: Hex;
    tradeSignature?: Hex;
  }) {
    return (
      <button
        onClick={async () => {
          /* if approval exists, split signature for approval */
          if (gaslessApprovalSignature) {
            const { r, s } = secp256k1.Signature.fromCompact(
              gaslessApprovalSignature.slice(2, 130)
            );
            const v = hexToNumber(`0x${gaslessApprovalSignature.slice(130)}`);
            console.log(v, r, s, "<-approval v,r, s");

            /* setup approval object */
            let approval = {
              type: approvalType,
              eip712: approvalEip712,
              signature: {
                v: v,
                r: r,
                s: s,
              },
            };
            console.log(approval, "<-approval object");
          }
          /* split signature for trade */
          if (tradeSignature) {
            const { r, s } = secp256k1.Signature.fromCompact(
              tradeSignature.slice(2, 130)
            );
            const v = hexToNumber(`0x${tradeSignature.slice(130)}`);
            // console.log(v, r, s, "<-trade v,r, s");
            /* setup approval object */
            let trade = {
              type: tradeType,
              eip712: tradeEip712,
              signature: {
                v: v,
                r: r,
                s: s,
              },
            };
            console.log(trade, "<-trade object");
          }
          try {
            const response = await fetch("/api/submit", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ approval, trade }), // Send approval and trade data
            });
            const data = await response.json();
            console.log(data, "<- POST data"); // Log the response from your API
          } catch (error) {
            console.error("Error:", error);
          }
        }}
      >
        Submit Order
      </button>
    );
  }

  function SignApproval({
    approvalEip712,
    onSign,
  }: {
    approvalEip712: any;
    onSign: (sig: Hex) => void;
  }) {
    // console.log(approvalEip712, "<-approvalEip712");

    const { data, isError, isLoading, isSuccess, signTypedDataAsync } =
      useSignTypedData({
        domain: approvalEip712.domain,
        message: approvalEip712.message,
        primaryType: approvalEip712.primaryType,
        types: approvalEip712.types,
      });

    return (
      <div>
        <button
          disabled={isLoading}
          hidden={isSuccess}
          onClick={async () => {
            const sig = await signTypedDataAsync();
            onSign(sig);
          }}
        >
          Sign Gasless Approval
        </button>
        {isSuccess && <div>Signature: {data}</div>}
        {isError && <div>Error signing message</div>}
      </div>
    );
  }

  function SignTrade({
    tradeEip712,
    onSign,
  }: {
    tradeEip712: any;
    onSign: (sig: Hex) => void;
  }) {
    // console.log(tradeEip712, "<-tradeEip712");

    const { data, isError, isLoading, isSuccess, signTypedDataAsync } =
      useSignTypedData({
        domain: tradeEip712.domain,
        message: tradeEip712.message,
        primaryType: tradeEip712.primaryType,
        types: tradeEip712.types,
      });
    return (
      <div>
        <button
          disabled={isLoading}
          hidden={isSuccess}
          onClick={async () => {
            const sig = await signTypedDataAsync();
            onSign(sig);
          }}
        >
          Sign Trade
        </button>
        {isSuccess && <div>Signature: {data}</div>}
        {isError && <div>Error signing message</div>}
      </div>
    );
  }
}
