import { useEffect, useState, useRef } from "react";
import qs from "qs";

type StatusResponse = {
  transactions: { hash: string; timestamp: number }[];
} & (
  | { status: "pending" | "submitted" | "succeeded" | "confirmed" }
  | { status: "failed"; reason: string }
);

export default function StatusView({ tradeHash }: { tradeHash: string }) {
  const [statusData, setStatusData] = useState<StatusResponse>();

  const statusDataRef = useRef(); // useRef to keep track of statusData

  // Check the status of a trade
  useEffect(() => {
    async function fetchStatus() {
      const response = await fetch(`/api/status?tradeHash=${tradeHash}`);
      const data = await response.json();

      return data;
    }

    const intervalId = setInterval(async () => {
      const data = await fetchStatus();
      // console.log(statusData, typeof statusData, "<-statusData type");

      statusDataRef.current = data; // Update ref with the latest data
      setStatusData(data);

      console.log(statusDataRef.current, "<-statusDataRef.current");

      if (data.status === "confirmed") {
        window.clearInterval(intervalId);
      }
    }, 3000);
    return () => clearInterval(intervalId); // Clear the interval when the component unmounts
  }, [tradeHash]);

  return (
    <div>
      <h1>Checking Trade Status</h1>

      <div>
        {statusData?.status === "confirmed" ? <p>Success!</p> : <p>Pending!</p>}
      </div>
    </div>
  );
}
