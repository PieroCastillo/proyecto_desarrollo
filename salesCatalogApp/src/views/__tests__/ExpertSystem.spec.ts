import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
import ExpertSystem from "../ExpertSystem.vue"

global.fetch = vi.fn()

describe("ExpertSystem.vue (HU6)", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    if (typeof Storage === "undefined") {
      const mockStorage = {
        getItem: vi.fn(() => "fake-token"),
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
      Storage.prototype.getItem = vi.fn(() => "fake-token")
    }
  })

  it("Verifica que el formulario pida todas las caracteristicas del cliente", async () => {
    const notify = vi.fn()

    ;(global.fetch as any).mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) }))

    const wrapper = mount(ExpertSystem, {
      global: { provide: { showNotification: notify } }
    })
    await flushPromises()

    const processBtn = wrapper.find(".btn-process-expert")
    await processBtn.trigger("click")

    expect(notify).toHaveBeenCalledWith(expect.stringContaining("selecciona un Cliente"), "warning")
  })

  it("Procesa los datos y emite sugerencias de productos segun las reglas logicas", async () => {
    ;(global.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/clients")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [{ _id: "c1", name: "Cliente" }] }) })
      }
      if (url.includes("/products")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            items: [
              { _id: "p1", name: "Crema Hidratante Facial", category: "facial", price: 50, stock: 10 },
              { _id: "p2", name: "Perfume Deep Blue", category: "fragancias", price: 150, stock: 5 },
              { _id: "p3", name: "Base Alta Cobertura", category: "maquillaje", price: 90, stock: 8 }
            ]
          })
        })
      }
    })

    const wrapper = mount(ExpertSystem)
    await flushPromises()

    await wrapper.findAll("select")[0].setValue("c1")
    await wrapper.findAll("select")[1].setValue("grasa")
    await wrapper.findAll("select")[2].setValue("maquillaje")
    await wrapper.vm.$nextTick()
    await wrapper.findAll("select")[3].setValue("cobertura")
    await wrapper.findAll("select")[4].setValue("eventos")

    const processBtn = wrapper.find(".btn-process-expert")
    await processBtn.trigger("click")

    await new Promise(r => setTimeout(r, 1000))
    await flushPromises()

    const recommendationTitle = wrapper.find(".prod-title")
    expect(recommendationTitle.exists()).toBe(true)
    expect(recommendationTitle.text()).toBe("Base Alta Cobertura")
  })
})
