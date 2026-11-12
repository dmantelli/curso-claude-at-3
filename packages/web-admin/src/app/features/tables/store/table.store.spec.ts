import { TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { TableStore } from './table.store'
import { TableService } from '../services/table.service'
import type { Table } from '../models/table.model'

const MESA: Table = { id: 't1', restaurantId: 'r1', number: 1, description: '', capacity: 2, status: 'libre' }

describe('TableStore', () => {
  let store: TableStore
  let service: { getAll: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    service = {
      getAll: vi.fn().mockReturnValue(of([MESA])),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
    TestBed.configureTestingModule({ providers: [{ provide: TableService, useValue: service }] })
    store = TestBed.inject(TableStore)
  })

  it('load rellena las mesas', async () => {
    await store.load('r1')
    expect(store.tables()).toEqual([MESA])
    expect(store.error()).toBeNull()
  })

  it('load deja el error legible si falla la petición', async () => {
    service.getAll.mockReturnValue(throwError(() => new Error('boom')))
    await store.load('r1')
    expect(store.error()).toBe('No se pudieron cargar las mesas.')
  })

  it('create propaga el error del API (409 número duplicado)', async () => {
    const error = { error: { error: 'DuplicatedTableNumberError', message: 'Ya existe una mesa con ese número' } }
    service.create.mockReturnValue(throwError(() => error))
    await expect(store.create('r1', { number: 1, description: '', capacity: 2 })).rejects.toBe(error)
    expect(store.tables()).toEqual([])
  })

  it('create añade la mesa creada a la lista', async () => {
    const nueva = { ...MESA, id: 't2', number: 2 }
    service.create.mockReturnValue(of(nueva))
    await store.create('r1', { number: 2, description: '', capacity: 4 })
    expect(store.tables()).toEqual([nueva])
  })

  it('remove quita la mesa de la lista', async () => {
    service.delete.mockReturnValue(of(undefined))
    await store.load('r1')
    await store.remove('r1', 't1')
    expect(store.tables()).toEqual([])
  })
})
