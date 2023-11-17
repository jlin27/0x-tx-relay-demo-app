import { TypedData, TypedDataDomain } from "abitype";
import { secp256k1 } from "@noble/curves/secp256k1";
import { Hex, hexToNumber } from "viem";

export interface EIP712TypedData {
  types: TypedData;
  domain: TypedDataDomain;
  message: {
    [key: string]: unknown;
  };
  primaryType: string;
}

export function splitSignature(signatureHex: Hex) {
  const { r, s } = secp256k1.Signature.fromCompact(signatureHex.slice(2, 130));
  const v = hexToNumber(`0x${signatureHex.slice(130)}`);
}
