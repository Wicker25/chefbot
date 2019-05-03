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
import { SearchEngine } from '../../catalogue/managers/SearchEngine';
import { ChefBot } from './ChefBot';

export class ExecutionInterruptedException extends Error {}

import { WebClient } from '@slack/client';

import axios from 'axios';

import { Writable } from 'stream';

export abstract class EventHandler {
  static testEvent(event: any): boolean {
    return false;
  }

  protected robot: ChefBot;
  protected client: WebClient;
  protected searchEngine: SearchEngine;
  protected event: any;

  constructor(robot: ChefBot, event: any) {
    this.robot = robot;
    this.client = robot.client;
    this.searchEngine = new SearchEngine();
    this.event = event;
  }

  abstract async execute(): Promise<void>;

  protected async postMessage(options: any): Promise<any> {
    const { channel } = this.event;
    return this.client.chat.postMessage(Object.assign({ channel }, options));
  }

  protected async postEphemeral(options: any): Promise<any> {
    const { channel } = this.event;
    return this.client.chat.postEphemeral(Object.assign({ channel }, options));
  }

  protected async postProductMenu(products: Product[], callbackId: string) {
    const { channel, user: userId } = this.event;

    await this.postEphemeral({
      channel,
      user: userId,
      attachments: [
        {
          color: '#3aa3e3',
          text: `<@${userId}>, which one of these dishes?`,
          callback_id: callbackId,
          actions: [
            {
              name: 'productId',
              type: 'select',
              options: products.map(product =>
                this.createProductOption(product)
              )
            }
          ]
        }
      ]
    });
  }

  protected async addReaction(options: any): Promise<any> {
    return this.client.reactions.add(options);
  }

  protected async getUser(userId: string) {
    const response = (await this.client.users.info({ user: userId })) as any;
    return response.user;
  }

  protected async searchProducts(query: string): Promise<Product[]> {
    const products = await this.searchEngine.searchProduct(query);

    if (products.length) {
      return products;
    }

    const { channel, user: userId } = this.event;

    await this.postMessage({
      channel: channel,
      text: `<@${userId}>, I couldn’t find any dish matching that description!`
    });

    throw new ExecutionInterruptedException();
  }

  protected async saveProduct(product: Product) {
    const productRepository = await getRepository(Product);
    return productRepository.save(product);
  }

  protected createProductMessage(product: Product) {
    const productLegend = product.legend;
    const restaurant = product.restaurant;

    return (
      `*${product.name} by ${restaurant.name}*\n` +
      `${':star:'.repeat(product.rating)} ` +
      `${product.totalReviews} votes` +
      (product.totalDelayed ? ` ~ :stopwatch: ${product.totalDelayed}` : '') +
      (product.totalCold ? ` ~ :snowflake: ${product.totalCold}` : '') +
      `\n${product.description}\n` +
      `:watch: *Until*: ${restaurant.closeTime}` +
      (product.energy ? ` ~ :fire: *Energy*: ${product.energy} kcal` : '') +
      (productLegend.includes('VG') ? ` ~ :herb: Vegetarian` : '') +
      (productLegend.includes('VE') ? ` ~ :herb: Vegan` : '') +
      (productLegend.includes('P') ? ` ~ :pig: Pork` : '') +
      (product.allergens
        ? ` ~ :peanuts: *Allergens*: ${product.allergens}`
        : '')
    );
  }

  private createProductOption(product: Product) {
    const restaurant = product.restaurant;
    return { text: `${product.name} by ${restaurant.name}`, value: product.id };
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
}
