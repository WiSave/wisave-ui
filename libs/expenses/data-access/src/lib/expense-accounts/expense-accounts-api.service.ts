import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { getApiBaseUrl } from '@wisave/platform/config';
import type { ICommandResponse } from '@wisave/shared/model';
import {
  type IExpenseAccount,
  type IExpenseAccountWritePayload,
  type IFundingAccountApiDto,
  type IFundingPaymentInstrumentApiDto,
  type IFundingPaymentInstrumentWritePayload,
  type IFundingTransferWritePayload,
} from '@wisave/shared/model';
import { type ExpenseAccountId, type FundingPaymentInstrumentId } from '@wisave/shared/model';

import { ExpenseAccountsMapperService } from './expense-accounts-mapper.service';

@Injectable({ providedIn: 'root' })
export class ExpenseAccountsApiService {
  #http = inject(HttpClient);
  #mapper = inject(ExpenseAccountsMapperService);
  readonly #fundingUrl = `${getApiBaseUrl()}/expenses/funding-accounts`;

  getAll(): Observable<IExpenseAccount[]> {
    return this.#http.get<IFundingAccountApiDto[]>(this.#fundingUrl).pipe(
      map((fundingAccounts) => this.#mapper.mapToAccounts(fundingAccounts)),
    );
  }

  getById(id: ExpenseAccountId): Observable<IExpenseAccount> {
    return this.#http.get<IFundingAccountApiDto>(`${this.#fundingUrl}/${id}`).pipe(
      map((dto) => this.#mapper.mapToFundingAccount(dto)),
    );
  }

  create(account: IExpenseAccountWritePayload): Observable<ICommandResponse> {
    return this.#http.post<ICommandResponse>(this.#fundingUrl, this.#mapper.mapFundingAccountToApiRequest(account, true));
  }

  update(id: ExpenseAccountId, changes: IExpenseAccountWritePayload): Observable<ICommandResponse> {
    return this.#http.put<ICommandResponse>(`${this.#fundingUrl}/${id}`, this.#mapper.mapFundingAccountToApiRequest(changes, false));
  }

  delete(id: ExpenseAccountId): Observable<ICommandResponse> {
    return this.#http.delete<ICommandResponse>(`${this.#fundingUrl}/${id}`);
  }

  getFundingPaymentInstruments(fundingAccountId: ExpenseAccountId) {
    return this.#http.get<IFundingPaymentInstrumentApiDto[]>(`${this.#fundingUrl}/${fundingAccountId}/payment-instruments`).pipe(
      map((dtos) => dtos.map((dto) => this.#mapper.mapToPaymentInstrument(dto))),
    );
  }

  addFundingPaymentInstrument(fundingAccountId: ExpenseAccountId, payload: IFundingPaymentInstrumentWritePayload): Observable<ICommandResponse> {
    return this.#http.post<ICommandResponse>(
      `${this.#fundingUrl}/${fundingAccountId}/payment-instruments`,
      this.#mapper.mapPaymentInstrumentToApiRequest(payload),
    );
  }

  updateFundingPaymentInstrument(
    fundingAccountId: ExpenseAccountId,
    paymentInstrumentId: FundingPaymentInstrumentId,
    payload: IFundingPaymentInstrumentWritePayload,
  ): Observable<ICommandResponse> {
    return this.#http.put<ICommandResponse>(
      `${this.#fundingUrl}/${fundingAccountId}/payment-instruments/${paymentInstrumentId}`,
      this.#mapper.mapPaymentInstrumentToApiRequest(payload),
    );
  }

  removeFundingPaymentInstrument(
    fundingAccountId: ExpenseAccountId,
    paymentInstrumentId: FundingPaymentInstrumentId,
  ): Observable<ICommandResponse> {
    return this.#http.delete<ICommandResponse>(`${this.#fundingUrl}/${fundingAccountId}/payment-instruments/${paymentInstrumentId}`);
  }

  postFundingTransfer(fundingAccountId: ExpenseAccountId, payload: IFundingTransferWritePayload): Observable<ICommandResponse & { transferId: string }> {
    return this.#http.post<ICommandResponse & { transferId: string }>(
      `${this.#fundingUrl}/${fundingAccountId}/transfers`,
      this.#mapper.mapTransferToApiRequest(payload),
    );
  }
}
