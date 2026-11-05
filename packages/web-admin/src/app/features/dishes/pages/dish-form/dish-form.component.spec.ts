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

describe('DishFormComponent - encabezados y enlace de volver', () => {
  it('tiene un h1 con el título de la página', async () => {
    const { el } = await crearFormulario()
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Nuevo plato')
  })

  it('tiene un h2 "Ingredientes del plato"', async () => {
    const { el } = await crearFormulario()
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('Ingredientes del plato')
  })

  it('no quedan títulos falsos (fake-title / fake-subtitle)', async () => {
    const { el } = await crearFormulario()
    expect(el.querySelector('.fake-title, .fake-subtitle')).toBeNull()
  })

  it('el enlace de volver tiene nombre accesible', async () => {
    const { el } = await crearFormulario()
    expect(el.querySelector('a.back-link')?.getAttribute('aria-label')).toBe('Volver a la lista de platos')
  })

  it('los iconos decorativos están ocultos a los lectores de pantalla', async () => {
    const { el } = await crearFormulario()
    const iconos = Array.from(el.querySelectorAll('lucide-icon'))
    expect(iconos.length).toBeGreaterThan(0)
    expect(iconos.every(i => i.getAttribute('aria-hidden') === 'true')).toBe(true)
  })
})

describe('DishFormComponent - envío por teclado', () => {
  it('es un <form> con un botón de envío "Guardar"', async () => {
    const { el } = await crearFormulario()
    const boton = el.querySelector<HTMLButtonElement>('form button[type="submit"]')
    expect(boton?.textContent?.trim()).toBe('Guardar')
  })

  it('el evento submit del formulario (Enter en un campo) llama a onSubmit()', async () => {
    const { fixture, el } = await crearFormulario()
    const espia = vi.spyOn(fixture.componentInstance, 'onSubmit').mockResolvedValue()
    el.querySelector('form')!.dispatchEvent(new Event('submit'))
    expect(espia).toHaveBeenCalledTimes(1)
  })

  it('"Cancelar" es un enlace enfocable a la lista de platos', async () => {
    const { el } = await crearFormulario()
    const cancelar = Array.from(el.querySelectorAll('a')).find(a => a.textContent?.trim() === 'Cancelar')
    expect(cancelar?.getAttribute('href')).toBe('/restaurants/r1/dishes')
  })

  it('las acciones del formulario no son div.btn clicables', async () => {
    const { el } = await crearFormulario()
    expect(el.querySelector('.form-actions div.btn')).toBeNull()
  })
})
