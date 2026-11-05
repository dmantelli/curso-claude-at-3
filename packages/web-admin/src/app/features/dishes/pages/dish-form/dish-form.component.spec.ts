import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { ActivatedRoute, provideRouter } from '@angular/router'
import { LucideAngularModule, ChevronLeft, Plus, Trash2 } from 'lucide-angular'
import { DishFormComponent } from './dish-form.component'
import { DishStore } from '../../store/dish.store'
import { IngredientStore } from '../../../ingredients/store/ingredient.store'

export const INGREDIENTES = [
  { id: 'i1', name: 'Tomate', unit: 'kg' },
  { id: 'i2', name: 'Queso', unit: 'kg' }
]

export async function crearFormulario(): Promise<{
  fixture: ComponentFixture<DishFormComponent>
  el: HTMLElement
  store: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
}> {
  const store = { create: vi.fn().mockResolvedValue(undefined), update: vi.fn().mockResolvedValue(undefined) }
  TestBed.configureTestingModule({
    imports: [DishFormComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      importProvidersFrom(LucideAngularModule.pick({ ChevronLeft, Plus, Trash2 })),
      { provide: DishStore, useValue: store },
      { provide: IngredientStore, useValue: { ingredients: signal(INGREDIENTES), loadByRestaurant: vi.fn() } },
      {
        provide: ActivatedRoute,
        useValue: { parent: { snapshot: { params: { restaurantId: 'r1' } } }, snapshot: { paramMap: { get: () => null } } }
      }
    ]
  })
  const fixture = TestBed.createComponent(DishFormComponent)
  await fixture.whenStable()
  fixture.detectChanges()
  await fixture.whenStable()
  return { fixture, el: fixture.nativeElement as HTMLElement, store }
}

describe('DishFormComponent (humo)', () => {
  it('se monta y muestra el título de la página', async () => {
    const { el } = await crearFormulario()
    expect(el.textContent).toContain('Nuevo plato')
  })
})

function controlDeEtiqueta(el: HTMLElement, texto: string): HTMLElement | null {
  const label = Array.from(el.querySelectorAll('label')).find(l => l.textContent?.trim().startsWith(texto))
  const id = label?.getAttribute('for')
  return id ? el.querySelector<HTMLElement>(`#${id}`) : null
}

describe('DishFormComponent - etiquetas', () => {
  it.each([
    ['Nombre del plato', 'INPUT'],
    ['Precio', 'INPUT'],
    ['Categoría', 'SELECT'],
    ['Disponible', 'SELECT'],
    ['Descripción', 'TEXTAREA']
  ])('el campo "%s" tiene un <label for> asociado a un %s', async (texto, tag) => {
    const { el } = await crearFormulario()
    expect(controlDeEtiqueta(el, texto)?.tagName).toBe(tag)
  })

  it('no quedan etiquetas falsas (div.fake-label)', async () => {
    const { el } = await crearFormulario()
    expect(el.querySelector('.fake-label')).toBeNull()
  })
})
