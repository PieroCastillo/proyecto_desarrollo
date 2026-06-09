import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ExpertSystem from '../ExpertSystem.vue'

// HU6: Sistema Experto de Recomendación

global.fetch = vi.fn()

describe('ExpertSystem.vue (HU6)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    Storage.prototype.getItem = vi.fn(() => 'fake-token')
  })

  it('Verifica que el formulario pida todas las características del cliente', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    ;(global.fetch as any).mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) }))

    const wrapper = mount(ExpertSystem)
    await flushPromises()

    // Intentamos procesar la recomendación sin llenar los campos
    const processBtn = wrapper.find('.btn-process-expert')
    await processBtn.trigger('click')

    // Verificamos que lanza la validación
    expect(alertMock).toHaveBeenCalledWith('Por favor, selecciona un Cliente bajo consultoría primero.')
  })

  it('Procesa los datos y emite sugerencias de productos según las reglas lógicas', async () => {
    // Simulamos la API devolviendo un catálogo con productos específicos para testear las reglas
    ;(global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/clients')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [{ _id: 'c1', name: 'Cliente' }] }) })
      }
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [
              { _id: 'p1', name: 'Crema Hidratante Facial', category: 'facial', price: 50, stock: 10 },
              { _id: 'p2', name: 'Perfume Deep Blue', category: 'fragancias', price: 150, stock: 5 },
              { _id: 'p3', name: 'Base Alta Cobertura', category: 'maquillaje', price: 90, stock: 8 }
            ]
          })
        })
      }
    })

    const wrapper = mount(ExpertSystem)
    await flushPromises()

    // Ingreso de características del cliente
    await wrapper.findAll('select')[0].setValue('c1')
    
    // Tipo de Piel
    await wrapper.findAll('select')[1].setValue('grasa')
    
    // Categoría: Maquillaje
    await wrapper.findAll('select')[2].setValue('maquillaje')
    await wrapper.vm.$nextTick() // Esperamos a que los enfoques se calculen
    
    // Enfoque: Cobertura
    await wrapper.findAll('select')[3].setValue('cobertura')
    
    // Ocasión
    await wrapper.findAll('select')[4].setValue('eventos')

    // 2. Ejecutar Sistema Experto
    const processBtn = wrapper.find('.btn-process-expert')
    await processBtn.trigger('click')
    
    // Esperamos los 900ms del procesamiento simulado (usamos flushPromises y vitest timer si fuera fakeTimers, o simplemente esperamos)
    await new Promise(r => setTimeout(r, 1000))
    await flushPromises()

    // 3. El sistema debe procesar y emitir la sugerencia correcta
    const recommendationTitle = wrapper.find('.prod-title')
    expect(recommendationTitle.exists()).toBe(true)
    
    // Según las reglas: Categoría maquillaje + enfoque cobertura = "Base Alta Cobertura"
    expect(recommendationTitle.text()).toBe('Base Alta Cobertura')
  })
})
