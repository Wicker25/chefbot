/**
 * @file Client.ts
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

import axios, { AxiosInstance } from 'axios';

import { User } from './models/User';
import { Catalogue } from './models/Catalogue';
import { Restaurant } from './models/Restaurant';
import { ProductCategory } from './models/ProductCategory';
import { Product } from './models/Product';

export class Client {
  private BASE_URL = 'https://api.lunch.team';

  private user!: User;
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: this.BASE_URL });
  }

  async login(email: string, password: string) {
    const authorizationPayload = Buffer.from(`${email}:${password}`);

    const response = await this.client.post('/user/v1/login', null, {
      headers: {
        authorization: 'Basic ' + authorizationPayload.toString('base64')
      }
    });

    this.user = response.data;

    // Create the authenticated client
    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'x-auth-token': response.headers['x-auth-token']
      }
    });
  }

  async getCatalogue(): Promise<Catalogue> {
    const { idBusiness } = this.user;

    const response = await this.client.get(
      `/menu/v1/menu/business/${idBusiness}`
    );

    return response.data;
  }

  async getProducts(
    restaurant: Restaurant,
    productCategory: ProductCategory
  ): Promise<Product[]> {
    const response = await this.client.get(
      `/menu/v1/product/0/categoryType/${productCategory.id}/restaurant/${
        restaurant.id
      }`
    );

    return response.data;
  }
}
