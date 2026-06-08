declare module "jsonwebtoken" {
  export interface SignOptions {
    expiresIn?: string | number;
    algorithm?: string;
    issuer?: string;
    audience?: string | string[];
  }

  export interface VerifyOptions {
    algorithms?: string[];
    audience?: string | string[];
    issuer?: string;
  }

  export type Secret = string | Buffer;

  export function sign(
    payload: object,
    secret: Secret,
    options?: SignOptions
  ): string;

  export function verify(
    token: string,
    secret: Secret,
    options?: VerifyOptions
  ): object;

  export function decode(token: string): object | null;
}
