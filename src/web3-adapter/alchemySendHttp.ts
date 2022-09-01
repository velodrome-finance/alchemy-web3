import fetchPonyfill from "fetch-ponyfill";
import { AlchemySendJsonRpcFunction } from "./alchemySend";

const { fetch, Headers } = fetchPonyfill();

const ALCHEMY_HEADERS = new Headers({
  Accept: "application/json",
  "Content-Type": "application/json",
});
const RATE_LIMIT_STATUS = 429;

export function makeJsonRpcHttpSender(url: string): AlchemySendJsonRpcFunction {
  return async (request) => {
    const response = await fetch(url, {
      method: "POST",
      headers: ALCHEMY_HEADERS,
      body: JSON.stringify(request),
    });
    const { status } = response;
    switch (status) {
      case 200:
        return { type: "jsonrpc", response: await response.json() };
      case RATE_LIMIT_STATUS:
        return { type: "rateLimit" };
      case 0:
        return {
          type: "networkError",
          status: 0,
          message: "Connection failed.",
        };
      default:
        return {
          status,
          type: "networkError",
          message: (await response.json()).error?.message,
        };
    }
  };
}
