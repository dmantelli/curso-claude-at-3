import { describe, it, expect, beforeEach } from 'vitest'
import { TableService } from './table.service.js'
import { MockTableRepository } from '@repositories/mocks/MockTableRepository.js'
import {
    InvalidTableNumberError, InvalidTableCapacityError, InvalidTableStatusError, DuplicatedTableNumberError,
    TableNotFoundError, InvalidPeopleError, TableNotAvailableError
} from '@errors/DomainErrors.js'

describe('TableService', () => {
    let repo: MockTableRepository
    let service: TableService

    const input = { number: 1, description: 'Terraza', capacity: 4 }

    beforeEach(() => {
        repo = new MockTableRepository()
        service = new TableService(repo)
    })

    describe('create', () => {
        it('crea una mesa con estado libre por defecto', async () => {
            const t = await service.create('r1', input)
            expect(t).toMatchObject({ restaurantId: 'r1', number: 1, description: 'Terraza', capacity: 4, status: 'libre' })
            expect(t.id).toBeTruthy()
            expect(await repo.findById(t.id)).not.toBeNull()
        })

        it('usa descripción vacía por defecto y normaliza el estado', async () => {
            const t = await service.create('r1', { number: 2, capacity: 2, status: ' RESERVADA ' })
            expect(t.description).toBe('')
            expect(t.status).toBe('reservada')
        })

        it.each([undefined, null, 0, -1, 1.5, '3', NaN])('rechaza número %s', async (n) => {
            await expect(service.create('r1', { ...input, number: n as any })).rejects.toThrow(InvalidTableNumberError)
        })

        it.each([undefined, 0, -2, 2.5, '4'])('rechaza capacidad %s', async (c) => {
            await expect(service.create('r1', { ...input, capacity: c as any })).rejects.toThrow(InvalidTableCapacityError)
        })

        it('rechaza estado inválido', async () => {
            await expect(service.create('r1', { ...input, status: 'rota' })).rejects.toThrow(InvalidTableStatusError)
        })

        it('rechaza número duplicado en el mismo restaurante y lo permite en otro', async () => {
            await service.create('r1', input)
            await expect(service.create('r1', input)).rejects.toThrow(DuplicatedTableNumberError)
            await expect(service.create('r2', input)).resolves.toBeDefined()
        })
    })

    describe('update', () => {
        it('reemplaza los campos y conserva el estado si no se envía', async () => {
            const t = await service.create('r1', { ...input, status: 'ocupada' })
            const u = await service.update('r1', t.id, { number: 5, description: 'Interior', capacity: 6 })
            expect(u).toMatchObject({ id: t.id, number: 5, description: 'Interior', capacity: 6, status: 'ocupada' })
        })

        it('permite conservar su propio número pero no el de otra mesa', async () => {
            const a = await service.create('r1', input)
            await service.create('r1', { ...input, number: 2 })
            await expect(service.update('r1', a.id, { ...input, capacity: 8 })).resolves.toBeDefined()
            await expect(service.update('r1', a.id, { ...input, number: 2 })).rejects.toThrow(DuplicatedTableNumberError)
        })

        it('valida los datos', async () => {
            const t = await service.create('r1', input)
            await expect(service.update('r1', t.id, { ...input, number: 0 })).rejects.toThrow(InvalidTableNumberError)
            await expect(service.update('r1', t.id, { ...input, capacity: 0 })).rejects.toThrow(InvalidTableCapacityError)
        })

        it('falla si la mesa no existe o es de otro restaurante', async () => {
            const t = await service.create('r1', input)
            await expect(service.update('r1', 'nope', input)).rejects.toThrow(TableNotFoundError)
            await expect(service.update('r2', t.id, input)).rejects.toThrow(TableNotFoundError)
        })
    })

    describe('delete', () => {
        it('elimina la mesa', async () => {
            const t = await service.create('r1', input)
            await service.delete('r1', t.id)
            expect(await repo.findById(t.id)).toBeNull()
        })

        it('falla si no existe o es de otro restaurante', async () => {
            const t = await service.create('r1', input)
            await expect(service.delete('r1', 'nope')).rejects.toThrow(TableNotFoundError)
            await expect(service.delete('r2', t.id)).rejects.toThrow(TableNotFoundError)
        })
    })

    describe('findAll / findById', () => {
        it('lista las mesas del restaurante ordenadas por número', async () => {
            await service.create('r1', { ...input, number: 2 })
            await service.create('r1', { ...input, number: 1 })
            await service.create('r2', input)
            expect((await service.findAll('r1')).map(t => t.number)).toEqual([1, 2])
        })

        it('findById falla con 404 si no existe o es de otro restaurante', async () => {
            const t = await service.create('r1', input)
            await expect(service.findById('r1', t.id)).resolves.toMatchObject({ id: t.id })
            await expect(service.findById('r2', t.id)).rejects.toThrow(TableNotFoundError)
            await expect(service.findById('r1', 'nope')).rejects.toThrow(TableNotFoundError)
        })
    })

    describe('changeStatus', () => {
        it('cambia a cualquier estado válido (normalizado)', async () => {
            const t = await service.create('r1', input)
            expect((await service.changeStatus('r1', t.id, 'OCUPADA')).status).toBe('ocupada')
            expect((await service.changeStatus('r1', t.id, 'libre')).status).toBe('libre')
        })

        it.each([undefined, null, 5, 'rota', ''])('rechaza estado %s', async (s) => {
            const t = await service.create('r1', input)
            await expect(service.changeStatus('r1', t.id, s as any)).rejects.toThrow(InvalidTableStatusError)
        })

        it('falla si la mesa no existe o es de otro restaurante', async () => {
            const t = await service.create('r1', input)
            await expect(service.changeStatus('r1', 'nope', 'libre')).rejects.toThrow(TableNotFoundError)
            await expect(service.changeStatus('r2', t.id, 'libre')).rejects.toThrow(TableNotFoundError)
        })
    })

    describe('findAvailable', () => {
        beforeEach(async () => {
            await service.create('r1', { number: 1, capacity: 6 })
            await service.create('r1', { number: 2, capacity: 2 })
            await service.create('r1', { number: 3, capacity: 4 })
            await service.create('r1', { number: 4, capacity: 4 })
            await service.create('r1', { number: 5, capacity: 4, status: 'ocupada' })
            await service.create('r1', { number: 6, capacity: 8, status: 'reservada' })
            await service.create('r2', { number: 1, capacity: 4 })
        })

        it('devuelve solo libres con capacidad suficiente, por capacidad y número', async () => {
            const res = await service.findAvailable('r1', 3)
            expect(res.map(t => t.number)).toEqual([3, 4, 1])
        })

        it('acepta people como texto numérico (query string)', async () => {
            expect((await service.findAvailable('r1', '5')).map(t => t.number)).toEqual([1])
        })

        it('sin mesas devuelve lista vacía', async () => {
            expect(await service.findAvailable('r1', 20)).toEqual([])
        })

        it.each([undefined, 0, -1, 2.5, 'abc', '2.5', '', NaN])('rechaza people %s', async (p) => {
            await expect(service.findAvailable('r1', p as any)).rejects.toThrow(InvalidPeopleError)
        })
    })

    describe('occupy', () => {
        it('ocupa una mesa libre y devuelve la mesa ocupada', async () => {
            const t = await service.create('r1', input)
            const occupied = await service.occupy('r1', t.id)
            expect(occupied).toMatchObject({ id: t.id, status: 'ocupada' })
        })

        it('la segunda vez falla con TableNotAvailableError', async () => {
            const t = await service.create('r1', input)
            await service.occupy('r1', t.id)
            await expect(service.occupy('r1', t.id)).rejects.toThrow(TableNotAvailableError)
        })

        it('falla con TableNotAvailableError si está reservada', async () => {
            const t = await service.create('r1', { ...input, status: 'reservada' })
            await expect(service.occupy('r1', t.id)).rejects.toThrow(TableNotAvailableError)
        })

        it('falla con TableNotFoundError si no existe o es de otro restaurante', async () => {
            const t = await service.create('r1', input)
            await expect(service.occupy('r1', 'nope')).rejects.toThrow(TableNotFoundError)
            await expect(service.occupy('r2', t.id)).rejects.toThrow(TableNotFoundError)
        })
    })
})
