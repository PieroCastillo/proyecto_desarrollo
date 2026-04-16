export interface Producto {
  id: number
  nombre: string
  precio: number
}

export const productosPrivados: Producto[] = [
  { id: 101, nombre: "Kit Facial Pro", precio: 89.9 },
  { id: 102, nombre: "Reloj Elegance Rose", precio: 145.0 },
  { id: 103, nombre: "Perfume Deep Blue", precio: 110.0 },
  { id: 104, nombre: "Set de Brochas (12pcs)", precio: 55.0 }
]