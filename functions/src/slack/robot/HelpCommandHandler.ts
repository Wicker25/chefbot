/**
 * @file robot/HelpCommandHandler.ts
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

import { EventHandler } from './EventHandler';

export class HelpCommandHandler extends EventHandler {
  static testEvent(event: any) {
    const { type, text } = event;
    return type === 'app_mention' && text.match(/\bhelp\s*/gi);
  }

  async execute() {
    await this.postMessage({
      text:
        '_All commands_\n\n' +
        '• *@chefbot show suggestions* - shows the suggestions for today;\n' +
        '• *@chefbot show <dish>* - shows a dish from the catalogue;\n' +
        '• *@chefbot rate <dish>* - starts a survey on a dish in the catalogue;\n' +
        '• *@chefbot help* - shows this message;\n'
    });
  }
}
