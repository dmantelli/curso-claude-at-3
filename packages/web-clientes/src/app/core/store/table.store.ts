import { Injectable, signal } from '@angular/core'
import { Table } from '../models/table.model'

@Injectable({ providedIn: 'root' })
export class TableStore {
  private readonly _table = signal<Table | null>(null)
  private readonly _restaurantId = signal<string | null>(null)

  readonly table = this._table.asReadonly()
  readonly restaurantId = this._restaurantId.asReadonly()

  select(restaurantId: string, table: Table): void {
    this._restaurantId.set(restaurantId)
    this._table.set(table)
  }

  hasTableFor(restaurantId: string): boolean {
    return this._restaurantId() === restaurantId && this._table() !== null
  }

  clear(): void {
    this._table.set(null)
    this._restaurantId.set(null)
  }
}
