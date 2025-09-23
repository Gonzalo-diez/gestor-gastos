import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FxService {
  constructor(private http: HttpService) {}
  private cache = new Map<string,{v:number,t:number}>();
  private ttlMs = 10*60_000;

  async getRate(base: string, quote: string): Promise<number> {
    if (!base || !quote) throw new Error('invalid pair');
    if (base === quote) return 1;
    const k = `${base}->${quote}`;
    const hit = this.cache.get(k);
    if (hit && Date.now()-hit.t < this.ttlMs) return hit.v;

    const { data } = await firstValueFrom(
      this.http.get('https://api.frankfurter.app/latest', { params: { from: base, to: quote } })
    );
    const rate = data?.rates?.[quote];
    if (!rate) throw new Error(`rate not found ${k}`);
    this.cache.set(k, { v: rate, t: Date.now() });
    return rate;
  }
}