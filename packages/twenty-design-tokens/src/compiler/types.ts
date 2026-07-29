export type DimensionValue = {
  readonly value: number;
  readonly unit: string;
};

export type TokenValue =
  | boolean
  | DimensionValue
  | number
  | Readonly<Record<string, unknown>>
  | string;

export type TokenNode = {
  readonly $description?: string;
  readonly $type: string;
  readonly $value: TokenValue;
};

export interface TokenDocument {
  readonly [key: string]: TokenDocument | TokenNode;
}

export type TokenRecords = {
  readonly marketing: {
    readonly common: TokenDocument;
    readonly dark: TokenDocument;
    readonly light: TokenDocument;
    readonly muted: TokenDocument;
  };
  readonly primitives: TokenDocument;
  readonly product: {
    readonly common: TokenDocument;
    readonly dark: TokenDocument;
    readonly light: TokenDocument;
  };
};

export type FlattenedToken = {
  readonly description?: string;
  readonly path: string;
  readonly type: string;
  readonly value: TokenValue;
};

export type ValidationResult = {
  readonly errors: readonly string[];
  readonly valid: boolean;
};

export type TokenRegistry = {
  readonly source: TokenRecords;
  readonly tokens: readonly FlattenedToken[];
  readonly values: Readonly<Record<string, TokenValue>>;
};
