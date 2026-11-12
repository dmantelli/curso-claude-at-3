import { randomUUID } from 'crypto'
import type { Table } from '@models/table.model.js'
import { normalizeTableStatus } from '@models/table.model.js'
import type { TableRepository } from '@repositories/table.repository.js'
import {
    InvalidTableNumberError, InvalidTableCapacityError, InvalidPeopleError,
    DuplicatedTableNumberError, TableNotFoundError, TableNotAvailableError
} from '@errors/DomainErrors.js'

export interface TableInputDTO {
    number: number
    description?: string
    capacity: number
    status?: string
}

const isPositiveInteger = (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 1

export class TableService {
    constructor(private readonly tableRepository: TableRepository) {}

    async create(restaurantId: string, dto: TableInputDTO): Promise<Table> {
        this.validate(dto)
        const status = dto.status === undefined || dto.status === null ? 'libre' : normalizeTableStatus(dto.status)
        await this.ensureNumberIsFree(restaurantId, dto.number)

        const table: Table = {
            id: randomUUID(),
            restaurantId,
            number: dto.number,
            description: dto.description ?? '',
            capacity: dto.capacity,
            status
        }
        await this.tableRepository.save(table)
        return table
    }

    async update(restaurantId: string, id: string, dto: TableInputDTO): Promise<Table> {
        const existing = await this.findById(restaurantId, id)
        this.validate(dto)
        const status = dto.status === undefined || dto.status === null ? existing.status : normalizeTableStatus(dto.status)
        await this.ensureNumberIsFree(restaurantId, dto.number, id)

        const updated: Table = {
            id: existing.id,
            restaurantId: existing.restaurantId,
            number: dto.number,
            description: dto.description ?? '',
            capacity: dto.capacity,
            status
        }
        await this.tableRepository.save(updated)
        return updated
    }

    async delete(restaurantId: string, id: string): Promise<void> {
        await this.findById(restaurantId, id)
        await this.tableRepository.delete(id)
    }

    async findAll(restaurantId: string): Promise<Table[]> {
        return this.tableRepository.findByRestaurantId(restaurantId)
    }

    async findById(restaurantId: string, id: string): Promise<Table> {
        const table = await this.tableRepository.findById(id)
        if (!table || table.restaurantId !== restaurantId) {
            throw new TableNotFoundError()
        }
        return table
    }

    async changeStatus(restaurantId: string, id: string, status: string): Promise<Table> {
        const table = await this.findById(restaurantId, id)
        const updated: Table = { ...table, status: normalizeTableStatus(status) }
        await this.tableRepository.save(updated)
        return updated
    }

    async findAvailable(restaurantId: string, people: unknown): Promise<Table[]> {
        const count = this.parsePeople(people)
        const tables = await this.tableRepository.findByRestaurantId(restaurantId)
        return tables
            .filter(t => t.status === 'libre' && t.capacity >= count)
            .sort((a, b) => a.capacity - b.capacity || a.number - b.number)
    }

    async occupy(restaurantId: string, id: string): Promise<Table> {
        await this.findById(restaurantId, id)
        const occupied = await this.tableRepository.occupyIfFree(restaurantId, id)
        if (!occupied) {
            throw new TableNotAvailableError()
        }
        return this.findById(restaurantId, id)
    }

    private validate(dto: TableInputDTO): void {
        if (!isPositiveInteger(dto.number)) throw new InvalidTableNumberError()
        if (!isPositiveInteger(dto.capacity)) throw new InvalidTableCapacityError()
    }

    private async ensureNumberIsFree(restaurantId: string, number: number, ownId?: string): Promise<void> {
        const duplicated = await this.tableRepository.findByNumber(restaurantId, number)
        if (duplicated && duplicated.id !== ownId) {
            throw new DuplicatedTableNumberError()
        }
    }

    private parsePeople(people: unknown): number {
        const value = typeof people === 'string' && /^\d+$/.test(people.trim()) ? Number(people) : people
        if (!isPositiveInteger(value)) throw new InvalidPeopleError()
        return value
    }
}
