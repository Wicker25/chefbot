/**
 * @file models/Restaurant.ts
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

import { YesOrNoValue } from './YesOrNoValue';
import { OpenOrCloseValue } from './OpenOrCloseValue';
import { ProductCategory } from './ProductCategory';

export interface Restaurant {
  id: number;
  name: string;
  status: OpenOrCloseValue;
  address: string;
  acceptCC: YesOrNoValue;
  acceptCash: YesOrNoValue;
  acceptOnAccount: YesOrNoValue;
  taxDelivery: 0;
  forCollection: YesOrNoValue;
  currency: string;
  currencySymbol: string;
  isCorporate: boolean;
  platter: boolean;
  statusReg: string; // TODO: figure out the symbols
  isOpen: false;
  openingHour: {
    day: string;
    openHour: string;
    closeHour: string;
    codeDay: 6;
  };
  categoryType: ProductCategory[];
}
