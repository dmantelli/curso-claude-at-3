import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core'
import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { ActivatedRoute, Router, provideRouter } from '@angular/router'
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

describe('DishFormComponent - añadir ingrediente', () => {
  it('el botón es un <button type="button"> con nombre accesible', async () => {
    const { el } = await crearFormulario()
    const boton = el.querySelector('button[aria-label="Añadir ingrediente"]')
    expect(boton?.getAttribute('type')).toBe('button')
  })

  it('el select y la cantidad tienen etiqueta asociada', async () => {
    const { el } = await crearFormulario()
    expect(controlDeEtiqueta(el, 'Ingrediente')?.tagName).toBe('SELECT')
    expect(controlDeEtiqueta(el, 'Cantidad')?.tagName).toBe('INPUT')
  })

  it('activar el botón añade el ingrediente seleccionado', async () => {
    const { fixture, el } = await crearFormulario()
    fixture.componentInstance.newIngredientId = 'i1'
    fixture.componentInstance.newIngredientQty = 2
    el.querySelector<HTMLButtonElement>('button[aria-label="Añadir ingrediente"]')!.click()
    expect(fixture.componentInstance.form.ingredients).toEqual([{ ingredientId: 'i1', quantity: 2 }])
  })

  it('Enter en la cantidad añade el ingrediente sin enviar el formulario', async () => {
    const { fixture, el } = await crearFormulario()
    fixture.componentInstance.newIngredientId = 'i2'
    fixture.componentInstance.newIngredientQty = 1
    const evento = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true })
    controlDeEtiqueta(el, 'Cantidad')!.dispatchEvent(evento)
    expect(evento.defaultPrevented).toBe(true)
    expect(fixture.componentInstance.form.ingredients).toEqual([{ ingredientId: 'i2', quantity: 1 }])
  })
})

async function anadirIngrediente(
  fixture: ComponentFixture<DishFormComponent>,
  el: HTMLElement,
  id: string,
  cantidad: number
): Promise<void> {
  fixture.componentInstance.newIngredientId = id
  fixture.componentInstance.newIngredientQty = cantidad
  el.querySelector<HTMLButtonElement>('button[aria-label="Añadir ingrediente"]')!.click()
  fixture.detectChanges()
  await fixture.whenStable()
}

describe('DishFormComponent - quitar ingrediente', () => {
  it('los ingredientes se listan en una <ul> con un <li> por ingrediente', async () => {
    const { fixture, el } = await crearFormulario()
    await anadirIngrediente(fixture, el, 'i1', 2)
    await anadirIngrediente(fixture, el, 'i2', 1)
    expect(el.querySelectorAll('ul.ingredient-chips > li').length).toBe(2)
  })

  it('cada ingrediente tiene un <button type="button"> "Quitar {nombre}"', async () => {
    const { fixture, el } = await crearFormulario()
    await anadirIngrediente(fixture, el, 'i1', 2)
    const boton = el.querySelector('li button[aria-label="Quitar Tomate (kg)"]')
    expect(boton?.getAttribute('type')).toBe('button')
    expect(el.querySelector('.chip-remove[role], div.chip-remove')).toBeNull()
  })

  it('activar el botón quita el ingrediente', async () => {
    const { fixture, el } = await crearFormulario()
    await anadirIngrediente(fixture, el, 'i1', 2)
    el.querySelector<HTMLButtonElement>('button[aria-label="Quitar Tomate (kg)"]')!.click()
    fixture.detectChanges()
    expect(fixture.componentInstance.form.ingredients).toEqual([])
    expect(el.querySelector('ul.ingredient-chips')).toBeNull()
  })
})

describe('DishFormComponent - validación en cliente', () => {
  it.each([
    ['', 'El nombre es obligatorio'],
    ['   ', 'El nombre es obligatorio']
  ])('validate() rechaza el nombre %j', async (nombre, mensaje) => {
    const { fixture } = await crearFormulario()
    fixture.componentInstance.form.name = nombre
    fixture.componentInstance.form.price = 5
    expect(fixture.componentInstance.validate()).toEqual({ name: mensaje })
  })

  it.each([0, -1, null])('validate() rechaza el precio %s', async precio => {
    const { fixture } = await crearFormulario()
    fixture.componentInstance.form.name = 'Tarta'
    fixture.componentInstance.form.price = precio as unknown as number
    expect(fixture.componentInstance.validate()).toEqual({ price: 'El precio debe ser mayor que 0' })
  })

  it('validate() devuelve ambos errores con el formulario vacío y ninguno si es válido', async () => {
    const { fixture } = await crearFormulario()
    expect(Object.keys(fixture.componentInstance.validate())).toEqual(['name', 'price'])
    fixture.componentInstance.form.name = 'Tarta'
    fixture.componentInstance.form.price = 4.5
    expect(fixture.componentInstance.validate()).toEqual({})
  })

  it('onSubmit() con errores no llama al store y los guarda en el signal errors', async () => {
    const { fixture, store } = await crearFormulario()
    await fixture.componentInstance.onSubmit()
    expect(store.create).not.toHaveBeenCalled()
    expect(fixture.componentInstance.errors()).toEqual({
      name: 'El nombre es obligatorio',
      price: 'El precio debe ser mayor que 0'
    })
  })

  it('onSubmit() válido guarda el plato y limpia los errores', async () => {
    const { fixture, store } = await crearFormulario()
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true)
    await fixture.componentInstance.onSubmit()
    fixture.componentInstance.form.name = 'Tarta'
    fixture.componentInstance.form.price = 4.5
    await fixture.componentInstance.onSubmit()
    expect(store.create).toHaveBeenCalledTimes(1)
    expect(fixture.componentInstance.errors()).toEqual({})
  })
})

describe('DishFormComponent - presentación de errores', () => {
  async function enviarVacio() {
    const ctx = await crearFormulario()
    await ctx.fixture.componentInstance.onSubmit()
    ctx.fixture.detectChanges()
    await ctx.fixture.whenStable()
    return ctx
  }

  it('el formulario desactiva la validación nativa (novalidate)', async () => {
    const { el } = await crearFormulario()
    expect(el.querySelector('form')?.hasAttribute('novalidate')).toBe(true)
  })

  it('sin errores los campos no están marcados como inválidos', async () => {
    const { el } = await crearFormulario()
    expect(el.querySelector('[aria-invalid]')).toBeNull()
  })

  it.each([
    ['Nombre del plato', 'El nombre es obligatorio'],
    ['Precio', 'El precio debe ser mayor que 0']
  ])('el campo "%s" inválido tiene aria-invalid y un mensaje de texto asociado', async (etiqueta, mensaje) => {
    const { el } = await enviarVacio()
    const campo = controlDeEtiqueta(el, etiqueta)!
    expect(campo.getAttribute('aria-invalid')).toBe('true')
    const idMensaje = campo.getAttribute('aria-describedby')!
    expect(el.querySelector(`#${idMensaje}`)?.textContent?.trim()).toBe(mensaje)
  })

  it('el error de un campo desaparece al corregirlo', async () => {
    const { fixture, el } = await enviarVacio()
    const nombre = controlDeEtiqueta(el, 'Nombre del plato') as HTMLInputElement
    nombre.value = 'Tarta'
    nombre.dispatchEvent(new Event('input'))
    fixture.detectChanges()
    await fixture.whenStable()
    expect(nombre.hasAttribute('aria-invalid')).toBe(false)
    expect(nombre.hasAttribute('aria-describedby')).toBe(false)
    expect(controlDeEtiqueta(el, 'Precio')?.getAttribute('aria-invalid')).toBe('true')
  })
})

describe('DishFormComponent - resumen de errores y foco', () => {
  async function enviarVacio() {
    const ctx = await crearFormulario()
    await ctx.fixture.componentInstance.onSubmit()
    ctx.fixture.detectChanges()
    await ctx.fixture.whenStable()
    return ctx
  }

  it('sin errores no hay resumen', async () => {
    const { el } = await crearFormulario()
    expect(el.querySelector('#resumen-errores')).toBeNull()
  })

  it('tras enviar inválido aparece un resumen con role="alert" y tabindex="-1" que recibe el foco', async () => {
    const { el } = await enviarVacio()
    const resumen = el.querySelector<HTMLElement>('#resumen-errores')!
    expect(resumen.getAttribute('role')).toBe('alert')
    expect(resumen.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(resumen)
  })

  it('el resumen tiene un enlace por cada campo erróneo', async () => {
    const { el } = await enviarVacio()
    const enlaces = Array.from(el.querySelectorAll('#resumen-errores a')).map(a => [
      a.textContent?.trim(),
      a.getAttribute('href')
    ])
    expect(enlaces).toEqual([
      ['El nombre es obligatorio', '#dish-name'],
      ['El precio debe ser mayor que 0', '#dish-price']
    ])
  })

  it('activar un enlace del resumen enfoca el campo', async () => {
    const { el } = await enviarVacio()
    el.querySelector<HTMLAnchorElement>('#resumen-errores a[href="#dish-price"]')!.click()
    expect(document.activeElement).toBe(controlDeEtiqueta(el, 'Precio'))
  })
})

describe('DishFormComponent - mensajes dinámicos', () => {
  const estado = (el: HTMLElement) => el.querySelector('[role="status"]')

  it('hay una región de estado vacía y educada (aria-live polite) desde el inicio', async () => {
    const { el } = await crearFormulario()
    expect(estado(el)?.getAttribute('aria-live')).toBe('polite')
    expect(estado(el)?.textContent?.trim()).toBe('')
  })

  it('añadir un ingrediente lo anuncia en la región de estado', async () => {
    const { fixture, el } = await crearFormulario()
    await anadirIngrediente(fixture, el, 'i1', 2)
    expect(estado(el)?.textContent?.trim()).toBe('Ingrediente Tomate (kg) añadido')
  })

  it('quitar un ingrediente lo anuncia en la región de estado', async () => {
    const { fixture, el } = await crearFormulario()
    await anadirIngrediente(fixture, el, 'i1', 2)
    el.querySelector<HTMLButtonElement>('button[aria-label="Quitar Tomate (kg)"]')!.click()
    fixture.detectChanges()
    await fixture.whenStable()
    expect(estado(el)?.textContent?.trim()).toBe('Ingrediente Tomate (kg) quitado')
  })

  it('un ingrediente duplicado se avisa en la región de estado', async () => {
    const { fixture, el } = await crearFormulario()
    await anadirIngrediente(fixture, el, 'i1', 2)
    await anadirIngrediente(fixture, el, 'i1', 3)
    expect(estado(el)?.textContent?.trim()).toBe('El ingrediente Tomate (kg) ya está en el plato')
    expect(fixture.componentInstance.form.ingredients.length).toBe(1)
  })

  it('añadir sin ingrediente o con cantidad inválida se avisa', async () => {
    const { fixture, el } = await crearFormulario()
    await anadirIngrediente(fixture, el, '', 1)
    expect(estado(el)?.textContent?.trim()).toBe('Selecciona un ingrediente y una cantidad mayor que 0')
  })

  it('un error de la API se muestra en un elemento role="alert"', async () => {
    const { fixture, el, store } = await crearFormulario()
    store.create.mockRejectedValue({ error: { message: 'El plato ya existe' } })
    fixture.componentInstance.form.name = 'Tarta'
    fixture.componentInstance.form.price = 4
    await fixture.componentInstance.onSubmit()
    fixture.detectChanges()
    await fixture.whenStable()
    const alerta = Array.from(el.querySelectorAll('[role="alert"]')).find(a => a.textContent?.includes('El plato ya existe'))
    expect(alerta).toBeTruthy()
  })

  it('mientras guarda, el botón Guardar está ocupado y deshabilitado', async () => {
    const { fixture, el } = await crearFormulario()
    fixture.componentInstance.loading.set(true)
    fixture.detectChanges()
    const boton = el.querySelector<HTMLButtonElement>('button[type="submit"]')!
    expect(boton.getAttribute('aria-busy')).toBe('true')
    expect(boton.disabled).toBe(true)
    expect(boton.textContent?.trim()).toBe('Guardando...')
  })
})
