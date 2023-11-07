"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "ethers";
import { useAccount, useBalance, type Address } from "wagmi";
import qs from "qs";

export default function Page() {
  // const priceData = await getTxRelayPrice();
  // console.log(priceData);

  const { address } = useAccount();
  const takerAddress = address;

  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [tradeDirection, setTradeDirection] = useState("sell");
  const [finalize, setFinalize] = useState(false);

  console.log(sellAmount, 6, "<-sellAmount, decimals");
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
      sellToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
      buyToken: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
      sellAmount: parsedSellAmount,
      buyAmount: parsedBuyAmount,
      takerAddress,
    };

    async function main() {
      const response = await fetch(`/api/price?${qs.stringify(params)}`);
      const data = await response.json();
      console.log(data, typeof data);
      console.log(data.buyAmount, typeof data.buyAmount);
      console.log(formatUnits(data.buyAmount, 18), data);
      setBuyAmount(formatUnits(data.buyAmount, 18));
    }

    if (sellAmount !== "") {
      main();
    }
  }, [sellAmount, parsedBuyAmount, parsedSellAmount, takerAddress]);

  const { data, isError, isLoading } = useBalance({
    address: takerAddress,
    token: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
  });

  const disabled =
    data && sellAmount ? parseUnits(sellAmount, 6) > data.value : true;

  console.log(sellAmount);

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

        {/* Add custom button */}
        <div>{takerAddress}</div>

        {takerAddress ? (
          <ApproveOrReviewButton
            sellTokenAddress="0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
            takerAddress={takerAddress}
            onClick={() => {
              setFinalize(true);
            }}
            disabled={disabled}
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
                        <button onClick={openConnectModal} type="button">
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
}

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
  // TODO: Look up if the sellToken supports permit. If not (WMATIC), set allowance and pay for approvals with gas. If it does (USDC), just get the Tx Relay price
  return <></>;
}
// As the page expands, consider pulling these out as separate React components that's exported and imported.
// function Price() {
//   //
// }

// function Quote() {
//   //
// }
