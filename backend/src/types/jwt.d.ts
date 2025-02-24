import { Secret } from "jsonwebtoken";

declare module "jsonwebtoken" {
  export interface JwtPayload {
    id: number;
  }

  export interface SignOptions {
    expiresIn?: string | number;
  }

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: Secret,
    options?: SignOptions
  ): string;
}
