import { type NextRequest } from "next/server";
// import qs from "qs";

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse the incoming request body
  const payload = await request.json();

  console.log(payload);

  const res = await fetch(
    `https://api.0x.org/tx-relay/v1/swap/submit?${searchParams}`,
    {
      method: "POST",
      headers: {
        "0x-api-key": "57b28c7c-3bea-4367-be35-34f15013317c",
        "0x-chain-id": "137",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Construct the payload using paylod
        approval: payload.approval,
        trade: payload.trade,
      }),
    }
  );
  const data = await res.json();

  return Response.json({});
}
