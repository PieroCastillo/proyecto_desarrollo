import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ConsultantsView from '../consultants.vue';

describe('ConsultantsView.vue (HU1 y HU3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');

    global.fetch = vi.fn((url: string) => {
      // 1. Mock para el ranking (Debe ir primero para que no sea interceptado)
      if (url.includes('/performance/ranking')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ranking: [
              {
                id: '1',
                name: 'Ana Gomez',
                zone: 'Sur',
                totalSales: 1600,
                level: 'Oro',
                nextLevel: 'Diamante',
                nextLevelGoal: 5000,
                progress: 2.8,
                missingForNext: 3400
              }
            ]
          })
        });
      }

      // 2. Mock para cargar el directorio
      if (url.includes('/api/consultants?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [
              { _id: '1', name: 'Ana Gomez', dni: '12345678', phone: '999', zone: 'Sur' },
              { _id: '2', name: 'Maria Lopez', dni: '87654321', phone: '888', zone: 'Norte' }
            ],
            total: 2,
            page: 1,
            limit: 10
          })
        });
      }
      
      // 3. Mock para POST de nueva consultora
      if (url.endsWith('/api/consultants')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: '3', name: 'Nueva' })
        });
      }

      return Promise.resolve({ ok: false });
    }) as any;
  });

  it('renderiza la tabla de directorio de consultoras (HU1)', async () => {
    const wrapper = mount(ConsultantsView);
    await flushPromises();

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(wrapper.text()).toContain('Ana Gomez');
    expect(wrapper.text()).toContain('Maria Lopez');
  });

  it('permite abrir el formulario y guardar una consultora nueva (HU1)', async () => {
    const wrapper = mount(ConsultantsView);
    await flushPromises();

    await wrapper.find('.btn-add').trigger('click');
    expect(wrapper.find('.form-card').exists()).toBe(true);

    wrapper.vm.form = { name: 'Carla Ruiz', dni: '11111111', phone: '999', zone: 'Este' };

    await wrapper.find('.btn-save').trigger('click');
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/consultants'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('permite cambiar a la pestaña de Ascensos y Efectividad (HU3)', async () => {
    const wrapper = mount(ConsultantsView);
    await flushPromises();

    const tabs = wrapper.findAll('.tab-btn');
    await tabs[1].trigger('click');
    await wrapper.vm.$nextTick();
    await flushPromises();

    expect(wrapper.find('.ranking-grid').exists()).toBe(true);
    expect(wrapper.text()).toContain('Ana Gomez');
  });

  it('muestra correctamente el nivel y barra de progreso de efectividad (HU3)', async () => {
    const wrapper = mount(ConsultantsView);
    await flushPromises();

    const tabs = wrapper.findAll('.tab-btn');
    await tabs[1].trigger('click');
    await wrapper.vm.$nextTick();
    await flushPromises();

    expect(wrapper.text()).toContain('Oro');
    expect(wrapper.text()).toContain('Ventas Totales: S/ 1600.00');
    expect(wrapper.text()).toContain('Faltan S/ 3400.00');
  });
});
