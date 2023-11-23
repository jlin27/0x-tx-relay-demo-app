import { useSignTypedData, type Address } from "wagmi";
import { useEffect, useState } from "react";
import qs from "qs";
import {
  TxRelayPriceResponse,
  TxRelayQuoteResponse,
} from "../../src/utils/types";
import { Hex } from "viem";
import { formatUnits } from "ethers";
import { SignatureType, splitSignature } from "../../src/utils/signature";

export default function QuoteView({
  checkApproval,
  price,
  quote,
  setQuote,
  onSubmitSuccess,
  takerAddress,
}: {
  checkApproval: boolean;
  price: TxRelayPriceResponse;
  quote: TxRelayQuoteResponse | undefined;
  setQuote: (price: any) => void;
  onSubmitSuccess: (tradeHash: string) => void;
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
    }
    main();
  }, [
    price.sellTokenAddress,
    price.buyTokenAddress,
    price.sellAmount,
    takerAddress,
    checkApproval,
    setQuote,
  ]);

  if (!quote) {
    return <div>Getting best quote...</div>;
  }

  const { approval, trade } = quote; // grabbing the approval and trade objects
  const { eip712: approvalEip712 } = approval || {}; // if approval object exists, rename the eip712 object to approvalEip712; otherwise, empty
  const { type: approvalType } = approval || {}; // if approval object exists, rename the type key to approvalType; otherwise, empty
  const { eip712: tradeEip712 } = trade; // for trade object, rename the eip712 object to tradeEip712
  const { type: tradeType } = trade; // for trade object, rename the type key to tradeType

  return (
    <div className="p-3 mx-auto max-w-screen-sm">
      <form>
        <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-sm mb-3">
          <div className="text-xl mb-2 text-white">You pay</div>
          <div className="flex items-center text-3xl text-white">
            <span>{formatUnits(quote.sellAmount, 6)}</span>
            <div className="ml-2">USDC</div>
          </div>
        </div>
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
        <div>Approval Already Signed</div>
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
        <div>Trade Already Signed</div>
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
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold mt-2 py-2 px-4 rounded w-full"
        onClick={async () => {
          let approvalDataToSubmit;
          let tradeDataToSubmit;
          let succeessfulTradeHash;

          // if approval exists, split signature for approval
          if (gaslessApprovalSignature) {
            const approvalSplitSig = splitSignature(gaslessApprovalSignature);
            console.log(approvalSplitSig, "<-approvalSplitSig");

            approvalDataToSubmit = {
              type: approvalType,
              eip712: approvalEip712,
              signature: {
                ...approvalSplitSig,
                v: Number(approvalSplitSig.v),
                signatureType: SignatureType.EIP712,
              },
            };
          }
          // split signature for trade
          if (tradeSignature) {
            const tradeSplitSig = splitSignature(tradeSignature);
            console.log(tradeSplitSig, "<-tradeSplitSig");

            tradeDataToSubmit = {
              type: tradeType,
              eip712: tradeEip712,
              signature: {
                ...tradeSplitSig,
                v: Number(tradeSplitSig.v),
                signatureType: SignatureType.EIP712,
              },
            };
          }
          console.log(
            approvalDataToSubmit,
            tradeDataToSubmit,
            "<-Can we access both data objects?"
          );

          try {
            // POST approval and trade data to submit trade
            const response = await fetch("/api/submit", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                trade: tradeDataToSubmit,
                approval: approvalDataToSubmit,
              }),
            });
            const data = await response.json();
            succeessfulTradeHash = data.tradeHash;
            onSubmitSuccess(succeessfulTradeHash);
            console.log(succeessfulTradeHash, "<- tradeHash");
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
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
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
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-2 rounded w-full"
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
