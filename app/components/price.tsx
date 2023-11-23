import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "ethers";
import { erc20ABI, useBalance, useContractRead, type Address } from "wagmi";
import { exchangeProxy } from "../../src/constants";
import MATIC_PERMIT_TOKENS from "../../src/supports-permit/137.json";
import type { TokenSupportsPermit } from "../../src/utils/eip712_utils.types";
import ZeroExLogo from "../../src/images/white-0x-logo.png";
import Image from "next/image";
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
        }}
      >
        <a href="https://0x.org/" target="_blank" rel="noopener noreferrer">
          <Image src={ZeroExLogo} alt="Icon" width={50} height={50} />
        </a>
        <ConnectButton />
      </header>

      <div className="container mx-auto p-10">
        <header className="text-center py-4">
          <h1 className="text-2xl font-bold">0x Tx Relay Swap Demo</h1>
        </header>

        <div className="max-w-md mx-auto bg-slate-800 shadow-lg rounded-lg p-6">
          <form>
            <div className="mb-4">
              <label htmlFor="sell" className="block text-gray-200">
                Sell USDC
              </label>
              <input
                id="sell-amount"
                type="number"
                value={sellAmount}
                placeholder="Amount"
                className="w-full p-2 border border-gray-300 rounded mt-1"
                onChange={(e) => {
                  setSellAmount(e.target.value);
                }}
              />
              {/* Dropdown or modal for token selection */}
            </div>

            <div className="mb-4">
              <label htmlFor="buy-amount" className="block text-gray-200">
                Buy WMATIC
              </label>
              <input
                id="buy-amount"
                type="number"
                placeholder="Amount"
                className="w-full p-2 border border-gray-300 rounded mt-1 cursor-not-allowed"
                value={buyAmount}
                readOnly // we want buyAmount to be auto-calculated
              />
              {/* Dropdown or modal for token selection */}
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
                              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
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
        <p className="text-md text-center p-4">
          Check out the{" "}
          <u className="underline">
            <a href="https://0x.org/docs/">0x Docs</a>
          </u>{" "}
          and{" "}
          <u className="underline">
            <a href="https://0x.org/docs/">Code</a>
          </u>{" "}
          to build your own
        </p>
      </div>
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
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-25"
      >
        {disabled ? "Insufficient Balance" : "Review Trade"}
      </button>
    );
  }
}
