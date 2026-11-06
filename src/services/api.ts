const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function req<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} falhou (${res.status})`)
  return res.status === 204 ? (null as T) : res.json()
}

// Erros são propagados de propósito: quem chama decide o que mostrar ao usuário.
export const api = {
  getPedidos: () => req<any[]>('/pedidos'),
  getUsuarios: () => req<any[]>('/usuarios'),
  getGrupos: () => req<any[]>('/grupos'),
  getAutomoveis: () => req<any[]>('/automoveis'),
  criarPedido: (pedido: any) => req('/pedidos', { method: 'POST', body: JSON.stringify(pedido) }),
  atualizarPedido: (id: string, dados: any) =>
    req(`/pedidos/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  criarUsuario: (usuario: any) => req('/usuarios', { method: 'POST', body: JSON.stringify(usuario) }),
}
