import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TrainingManager from '../TrainingManager.vue';

describe('TrainingManager.vue (HU2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');

    global.fetch = vi.fn((url: string) => {
      // Mock para listar capacitaciones
      if (url.includes('/api/trainings') && !url.includes('participate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [
              {
                _id: '1',
                title: 'Ventas Nivel 1',
                description: 'Aprende a vender',
                videoUrl: 'http://video.com',
                instructor: 'Ana Gomez',
                category: 'Básico',
                points: 100,
                completed: false
              },
              {
                _id: '2',
                title: 'Maquillaje Pro',
                description: 'Técnicas avanzadas',
                videoUrl: 'http://video.com',
                instructor: 'Juan Perez',
                category: 'Avanzado',
                points: 200,
                completed: true
              }
            ]
          })
        });
      }

      // Mock para listar consultoras (RRHH)
      if (url.includes('/api/consultants')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [
              { _id: '101', name: 'Carla Asistente' }
            ]
          })
        });
      }

      // Mock para registrar asistencia
      if (url.includes('participate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'OK' })
        });
      }

      return Promise.resolve({ ok: false });
    }) as any;

    // Evitar alerts molestas en el terminal durante el testing
    global.alert = vi.fn();
  });

  it('renderiza el dashboard con cursos y métricas (HU2)', async () => {
    // Renderiza como consultora
    const wrapper = mount(TrainingManager, {
      props: { role: 'consultant' }
    });
    await flushPromises();

    // Revisa las estadísticas calculadas (1 completado, 200 pts)
    expect(wrapper.text()).toContain('1 / 2');
    expect(wrapper.text()).toContain('200');
    
    // Verifica que se muestran los cursos
    const courses = wrapper.findAll('.course-card');
    expect(courses).toHaveLength(2);
    expect(wrapper.text()).toContain('Ventas Nivel 1');
    expect(wrapper.text()).toContain('Maquillaje Pro');
  });

  it('permite a la consultora registrar su propia asistencia (HU2)', async () => {
    const wrapper = mount(TrainingManager, {
      props: { role: 'consultant' }
    });
    await flushPromises();

    // El primer curso no está completado, debería tener el botón
    const btnParticipate = wrapper.find('.btn-participate');
    expect(btnParticipate.text()).toBe('Registrar Asistencia');
    
    // Simula el click
    await btnParticipate.trigger('click');
    await flushPromises();

    // Verifica que llamó a la API (POST)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/participate'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('muestra selector y permite a RR.HH. registrar asistencia manual (HU2)', async () => {
    // Renderiza como RRHH
    const wrapper = mount(TrainingManager, {
      props: { role: 'hr' }
    });
    await flushPromises();

    // El primer curso debe tener un select y un botón hr-btn-register
    const select = wrapper.find('.select-consultant');
    expect(select.exists()).toBe(true);

    // Seleccionamos la consultora (simulación)
    wrapper.vm.selectedConsultants = { '1': '101' };

    // Clic en el botón verde de HR
    const btnHR = wrapper.find('.hr-btn-register');
    await btnHR.trigger('click');
    await flushPromises();

    // Verifica que se llamó a la API pasando el consultantId en el body
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/participate'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ consultantId: '101' })
      })
    );
  });
});
