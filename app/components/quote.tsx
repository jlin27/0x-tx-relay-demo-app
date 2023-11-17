import { useSignTypedData, type Address } from "wagmi";
import { useEffect } from "react";
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

  // if (!quote) {
  //   return <div>Getting best quote...</div>;
  // }

  if (!quote) return "Getting best quote...!";

  const { approval, trade } = quote; // grabbing the approval and trade objects
  const { eip712: approvalEip712 } = approval || {}; // if approval object exists, rename the eip712 object to approvalEip712; otherwise, empty
  const { eip712: tradeEip712 } = trade; // if trade object exists, rename the eip712 object to tradeEip712

  return (
    <div className="p-3 mx-auto max-w-screen-sm ">
      <form>
        <h1>We are in quote</h1>
        <div>{quote.sellAmount}</div>
      </form>
      {approvalEip712 ? (
        <SignApproval approvalEip712={approvalEip712} />
      ) : (
        <div>Getting best quote...</div>
      )}
    </div>
  );

  function PlaceOrderButton({ quote }: { quote: TxRelayQuoteResponse }) {
    return <button>Place Order</button>;
  }

  function SignApproval({ approvalEip712 }: { approvalEip712: any }) {
    console.log(approvalEip712, "<-approvalEip712");

    const { data, isError, isLoading, isSuccess, signTypedData } =
      useSignTypedData({
        domain: approvalEip712.domain,
        message: approvalEip712.message,
        primaryType: approvalEip712.primaryType,
        types: approvalEip712.types,
      });
    return (
      <div>
        <button disabled={isLoading} onClick={() => signTypedData()}>
          Sign Gasless Approval
        </button>
        {isSuccess && <div>Signature: {data}</div>}
        {isError && <div>Error signing message</div>}
      </div>
    );
  }
}
