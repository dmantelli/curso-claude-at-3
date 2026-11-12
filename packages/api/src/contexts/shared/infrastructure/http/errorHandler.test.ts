import { describe, it, expect, vi } from 'vitest'
import { errorHandler } from './errorHandler.js'
import {
    TableNotFoundError, TableNotAvailableError, DuplicatedTableNumberError, InvalidTableNumberError, InvalidTableError
} from '@errors/DomainErrors.js'

const run = (err: unknown) => {
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    errorHandler(err, {} as any, res, vi.fn())
    return res
}

describe('errorHandler (mesas)', () => {
    it.each([
        [new TableNotFoundError(), 404, 'TableNotFoundError'],
        [new TableNotAvailableError(), 409, 'TableNotAvailableError'],
        [new DuplicatedTableNumberError(), 409, 'DuplicatedTableNumberError'],
        [new InvalidTableNumberError(), 400, 'InvalidTableNumberError'],
        [new InvalidTableError(), 400, 'InvalidTableError']
    ])('mapea %o a %i', (err, status, name) => {
        const res = run(err)
        expect(res.status).toHaveBeenCalledWith(status)
        expect(res.json.mock.calls[0][0].error).toBe(name)
    })
})
