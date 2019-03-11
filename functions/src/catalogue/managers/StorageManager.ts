/**
 * @file tasks/StorageManager.ts
 *
 * Copyright (C) 2019 | Giacomo Trudu aka `Wicker25`
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as admin from 'firebase-admin';

import { Writable } from 'stream';

export class StorageManager {
  private app: admin.app.App;
  private storage: admin.storage.Storage;

  private bucketName: string = 'chefbot-images';

  constructor() {
    this.app = !admin.apps.length
      ? admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          storageBucket: this.bucketName
        })
      : admin.app();

    this.storage = this.app.storage();
  }

  createWriteStream(filename: string): Writable {
    const bucket = this.storage.bucket();
    return bucket.file(filename).createWriteStream();
  }

  getFileUrl(filename: string) {
    return `https://storage.googleapis.com/${this.bucketName}/${filename}`;
  }
}
