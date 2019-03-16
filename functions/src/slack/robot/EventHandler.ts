/**
 * @file robot/EventHandler.ts
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

import { configs, getRepository } from '@puro/core';

import { Product } from '../../catalogue/entities/Product';

import {
  SearchEngine,
  NoResultsException,
  TooManyResultsException
} from '../../catalogue/managers/SearchEngine';

export class ExecutionInterruptedException extends Error {}

import { WebClient } from '@slack/client';

import axios from 'axios';

import { Writable } from 'stream';

export abstract class EventHandler {
  static testEvent(event: any): boolean {
    return false;
  }

  protected client: WebClient;
  protected searchEngine: SearchEngine;
  protected event: any;

  constructor(client: WebClient, event: any) {
    this.client = client;
    this.searchEngine = new SearchEngine();
    this.event = event;
  }

  abstract async execute(): Promise<void>;

  protected async getUser(userId: string) {
    const response = await this.client.users.info({ user: userId });
    return (response as any).user;
  }

  protected async searchProduct(query: string): Promise<Product> {
    try {
      return await this.searchEngine.searchProduct(query);
    } catch (e) {
      const { channel, user: userId } = this.event;

      if (e instanceof NoResultsException) {
        await this.postMessage({
          channel: channel,
          text: `<@${userId}>, I couldn’t find any dish matching that description!`
        });
      } else if (e instanceof TooManyResultsException) {
        await this.postMessage({
          channel: channel,
          text:
            `<@${userId}>, there are too many dishes matching that ` +
            `description! Be more specific!`
        });
      }

      throw new ExecutionInterruptedException();
    }
  }

  protected async saveProduct(product: Product) {
    const productRepository = await getRepository(Product);
    return productRepository.save(product);
  }

  protected async downloadFile(outStream: Writable, fileUrl: string) {
    const accessToken = configs.get('slack.accessToken');

    const response = await axios.get(fileUrl, {
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      responseType: 'stream'
    });

    response.data.pipe(outStream);

    return new Promise((resolve, reject) => {
      outStream.on('finish', resolve);
      outStream.on('error', reject);
    });
  }

  protected async postMessage(message: any) {
    return this.client.chat.postMessage(message);
  }
}
