import * as crypto from 'crypto';
import { Transform, type TransformCallback } from 'stream';

export class HashPassThrough extends Transform {
  private hash = crypto.createHash('sha256');
  private byteCount = 0;
  private _digest: string | null = null;

  _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.hash.update(chunk);
    this.byteCount += chunk.length;
    this.push(chunk);
    callback();
  }

  _flush(callback: TransformCallback): void {
    this._digest = this.hash.digest('hex');
    this.push(null);
    callback();
  }

  get digest(): string {
    if (this._digest === null) {
      throw new Error('HashPassThrough digest not yet available (stream not finished)');
    }

    return this._digest;
  }

  get bytes(): number {
    return this.byteCount;
  }
}
