import { describe, it, expect } from 'vitest'
import { normalizeTableStatus } from './table.model.js'
import { InvalidTableStatusError } from '@errors/DomainErrors.js'

describe('normalizeTableStatus', () => {
    it('acepta los estados válidos', () => {
        expect(normalizeTableStatus('libre')).toBe('libre')
        expect(normalizeTableStatus('ocupada')).toBe('ocupada')
        expect(normalizeTableStatus('reservada')).toBe('reservada')
    })

    it('normaliza mayúsculas y espacios', () => {
        expect(normalizeTableStatus('  OCUPADA ')).toBe('ocupada')
    })

    it('rechaza estados desconocidos', () => {
        expect(() => normalizeTableStatus('rota')).toThrow(InvalidTableStatusError)
    })

    it('rechaza valores vacíos o que no son texto', () => {
        expect(() => normalizeTableStatus('')).toThrow(InvalidTableStatusError)
        expect(() => normalizeTableStatus(undefined as any)).toThrow(InvalidTableStatusError)
        expect(() => normalizeTableStatus(3 as any)).toThrow(InvalidTableStatusError)
    })
})
