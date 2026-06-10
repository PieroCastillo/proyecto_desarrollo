import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HomeView from '../HomeView.vue'

// HU4: Ventas Digitales
// HU5: Catálogo y Control de Ventas

global.fetch = vi.fn()

describe('HomeView.vue (HU4 y HU5)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    if (typeof Storage === 'undefined') {
      const mockStorage = {
        getItem: vi.fn(() => 'fake-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      global.Storage = class {} as any
      Storage.prototype.getItem = mockStorage.getItem
      Storage.prototype.setItem = mockStorage.setItem
      Storage.prototype.removeItem = mockStorage.removeItem
      global.localStorage = mockStorage as any
    } else {
      Storage.prototype.getItem = vi.fn(() => 'fake-token')
    }
  })

  it('Renderiza correctamente el catálogo de productos (HU5)', async () => {
    ;(global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [{ _id: 'c1', name: 'Cliente de Prueba' }] })
        })
      }
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [
              { _id: 'p1', name: 'Crema Hidratante', price: 50.0, stock: 10, category: 'Rostro' },
              { _id: 'p2', name: 'Perfume Floral', price: 120.0, stock: 5, category: 'Fragancias' }
            ]
          })
        })
      }
    })

    const wrapper = mount(HomeView, {
      props: {
        userName: 'Piero',
        userId: 'u1'
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Catálogo de Productos')
    
    const productNames = wrapper.findAll('.prod-name')
    expect(productNames.length).toBe(2)
    expect(productNames[0].text()).toBe('Crema Hidratante')
    expect(productNames[1].text()).toBe('Perfume Floral')
    
    const options = wrapper.findAll('option')
    expect(options[1].text()).toBe('Cliente de Prueba')
  })

  it('Verifica que no se pueda añadir a orden sin seleccionar cliente (HU4)', async () => {

    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) })
      if (url.includes('/products')) return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          items: [{ _id: 'p1', name: 'Producto Test', price: 10, stock: 10, category: 'Test' }]
        })
      })
    })

    const wrapper = mount(HomeView, { props: { userName: 'Piero', userId: 'u1' } })
    await flushPromises()

    const buyButton = wrapper.find('.btn-add')
    await buyButton.trigger('click')

    expect(alertMock).toHaveBeenCalledWith('¡Espera! Debes seleccionar a qué Cliente le estás vendiendo antes de añadir un producto.')
  })

  it('Añade un pedido correctamente al seleccionar cliente (HU4 - Ventas Digitales)', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/clients')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [{ _id: 'c1', name: 'Cliente' }] }) })
      if (url.includes('/products')) return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [{ _id: 'p1', name: 'Crema', price: 10, stock: 10, category: 'Test' }] })
      })
      if (url.includes('/orders') && options?.method === 'POST') {
        return Promise.resolve({ ok: true })
      }
    })

    const wrapper = mount(HomeView, { props: { userName: 'Piero', userId: 'u1' } })
    await flushPromises()

    const select = wrapper.find('.select-client')
    await select.setValue('c1')

    const buyButton = wrapper.find('.btn-add')
    await buyButton.trigger('click')
    await flushPromises()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/orders'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          clientId: 'c1',
          consultantId: 'u1',
          items: [{ productId: 'p1', quantity: 1 }]
        })
      })
    )

    expect(alertMock).toHaveBeenCalledWith('✓ Crema añadido al pedido')
  })

  it('Muestra el estado vacío si no hay productos disponibles', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) })
      }
      if (url.includes('/products')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) })
      }
    })

    const wrapper = mount(HomeView, {
      props: {
        userName: 'Piero',
        userId: 'u1'
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('No hay productos disponibles en este momento.')
  })
})