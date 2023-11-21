import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "ethers";
import { erc20ABI, useBalance, useContractRead, type Address } from "wagmi";
import { exchangeProxy } from "../../src/constants";
import MATIC_PERMIT_TOKENS from "../../src/supports-permit/137.json";
import type { TokenSupportsPermit } from "../../src/utils/eip712_utils.types";

import qs from "qs";

export default function PriceView({
  takerAddress,
  setPrice,
  setFinalize,
  setCheckApproval,
}: {
  takerAddress: Address | undefined;
  setPrice: (price: any) => void;
  setFinalize: (finalize: boolean) => void;
  setCheckApproval: (data: boolean) => void;
}) {
  const maticPermitTokensDataTyped = MATIC_PERMIT_TOKENS as TokenSupportsPermit;

  const sellToken = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";

  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [tradeDirection] = useState("sell");

  const parsedSellAmount =
    sellAmount && tradeDirection === "sell"
      ? parseUnits(sellAmount, 6).toString()
      : undefined;

  const parsedBuyAmount =
    buyAmount && tradeDirection === "buy"
      ? parseUnits(buyAmount, 18).toString()
      : undefined;

  // Fetch price data and set the buyAmount whenever the sellAmount changes
  useEffect(() => {
    const params = {
      sellToken: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
      buyToken: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
      sellAmount: parsedSellAmount,
      buyAmount: parsedBuyAmount,
      takerAddress,
    };

    async function main() {
      const response = await fetch(`/api/price?${qs.stringify(params)}`);
      const data = await response.json();

      setBuyAmount(formatUnits(data.buyAmount, 18));
      setPrice(data);
    }

    if (sellAmount !== "") {
      main();
    }
  }, [sellAmount, parsedBuyAmount, parsedSellAmount, takerAddress, setPrice]);

  // Hook for fetching balance information for specified token for a specific takerAddress
  const { data, isError, isLoading } = useBalance({
    address: takerAddress,
    token: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
  });

  const inSufficientBalance =
    data && sellAmount ? parseUnits(sellAmount, 6) > data.value : true;

  const isSellTokenPermit = Boolean(maticPermitTokensDataTyped[sellToken]);

  const { data: allowance, refetch } = useContractRead({
    address: sellToken,
    abi: erc20ABI,
    functionName: "allowance",
    args: takerAddress ? [takerAddress, exchangeProxy] : undefined,
  });

  // Check if there is sufficient allowance
  const hasSufficientAllowance =
    takerAddress && allowance ? allowance == 0n : false;

  const checkApproval = isSellTokenPermit && !hasSufficientAllowance;

  useEffect(() => {
    setCheckApproval(checkApproval);
  }, [checkApproval, setCheckApproval]);

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
      <h1 className="text-2xl font-extrabold">
        Sell USDC to buy WMATIC on Polygon
      </h1>

      <form className="my-4">
        <div className="my-4">
          <label htmlFor="sell" className="mr-1">
            Sell USDC
          </label>
          <input
            id="sell-amount"
            type="number"
            value={sellAmount}
            onChange={(e) => {
              setSellAmount(e.target.value);
            }}
            className="border border-slate-500 rounded-md"
          />
        </div>

        <div className="my-4">
          <label htmlFor="buy-amount" className="mr-1">
            Buy WMATIC
          </label>
          <input
            type="number"
            id="buy-amount"
            className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 cursor-not-allowed"
            value={buyAmount}
            readOnly
          />
        </div>
        {takerAddress ? (
          <ApproveOrReviewButton
            sellTokenAddress={sellToken}
            takerAddress={takerAddress}
            onClick={() => {
              setFinalize(true);
            }}
            disabled={inSufficientBalance}
          />
        ) : (
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
                          onClick={openConnectModal}
                          type="button"
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button onClick={openChainModal} type="button">
                          Wrong network
                        </button>
                      );
                    }

                    return (
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          onClick={openChainModal}
                          style={{ display: "flex", alignItems: "center" }}
                          type="button"
                        >
                          {chain.hasIcon && (
                            <div
                              style={{
                                background: chain.iconBackground,
                                width: 12,
                                height: 12,
                                borderRadius: 999,
                                overflow: "hidden",
                                marginRight: 4,
                              }}
                            >
                              {chain.iconUrl && (
                                <img
                                  alt={chain.name ?? "Chain icon"}
                                  src={chain.iconUrl}
                                  style={{ width: 12, height: 12 }}
                                />
                              )}
                            </div>
                          )}
                          {chain.name}
                        </button>

                        <button onClick={openAccountModal} type="button">
                          {account.displayName}
                          {account.displayBalance
                            ? ` (${account.displayBalance})`
                            : ""}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        )}
      </form>
    </div>
  );

  function ApproveOrReviewButton({
    takerAddress,
    onClick,
    sellTokenAddress,
    disabled,
  }: {
    takerAddress: Address;
    onClick: () => void;
    sellTokenAddress: Address;
    disabled?: boolean;
  }) {
    const { data: allowance, refetch } = useContractRead({
      address: sellTokenAddress,
      abi: erc20ABI,
      functionName: "allowance",
      args: [takerAddress, exchangeProxy],
    });

    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          // fetch data, when finished, show quote view
          setFinalize(true);
        }}
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
      >
        Review Trade
      </button>
    );
  }
}
