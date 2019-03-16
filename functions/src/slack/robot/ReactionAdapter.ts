/**
 * @file robot/ReactionAdapter.ts
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

export class ReactionAdapter {
  readonly name?: '+1' | '-1' | 'stopwatch' | 'snowflake';

  constructor(name: string) {
    this.name = this.normalize(name);
  }

  private normalize(name: string) {
    switch (name) {
      case '+1':
      case '+1::skin-tone-2':
      case '+1::skin-tone-3':
      case '+1::skin-tone-4':
      case '+1::skin-tone-5':
      case '+1::skin-tone-6':
      case 'thumbsup': {
        return '+1';
      }

      case '-1':
      case '-1::skin-tone-2':
      case '-1::skin-tone-3':
      case '-1::skin-tone-4':
      case '-1::skin-tone-5':
      case '-1::skin-tone-6':
      case 'thumbsdown': {
        return '-1';
      }

      case 'stopwatch':
      case 'watch': {
        return 'stopwatch';
      }

      case 'snowflake': {
        return 'snowflake';
      }
    }
  }
}
