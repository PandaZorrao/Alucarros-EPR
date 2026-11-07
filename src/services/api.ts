import seed from '../../db.json'

/**
 * Dois modos de funcionamento:
 *  - Local (padrão): os dados ficam no localStorage do navegador, partindo do db.json.
 *    Não precisa de servidor, então funciona direto na Vercel.
 *  - Remoto: se VITE_API_URL estiver definida (ex.: http://localhost:3000), usa o json-server.
 */
const API_URL: string | undefined = import.meta.env.VITE_API_URL || undefined

/* ---------- Modo remoto (json-server) ---------- */

async function req<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} falhou (${res.status})`)
  return res.status === 204 ? (null as T) : res.json()
}

/* ---------- Modo local (localStorage) ---------- */

type Colecao = 'usuarios' | 'grupos' | 'automoveis' | 'pedidos'
type Banco = Record<Colecao, any[]>

const CHAVE = 'alucarros:db:v1'
let memoria: Banco | null = null // reserva caso o localStorage esteja indisponível

const semente = (): Banco =>
  structuredClone({
    usuarios: seed.usuarios,
    grupos: seed.grupos,
    automoveis: seed.automoveis,
    pedidos: seed.pedidos,
  }) as Banco

function ler(): Banco {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (bruto) return JSON.parse(bruto)
  } catch {
    /* storage indisponível ou conteúdo inválido: cai na memória */
  }
  return memoria ?? (memoria = semente())
}

function gravar(db: Banco) {
  memoria = db
  try {
    localStorage.setItem(CHAVE, JSON.stringify(db))
  } catch {
    /* sem storage: os dados valem apenas até recarregar a página */
  }
}

const listar = async (col: Colecao) => structuredClone(ler()[col])

const criar = async (col: Colecao, item: any) => {
  const db = ler()
  db[col].push(item)
  gravar(db)
  return structuredClone(item)
}

const atualizar = async (col: Colecao, id: string, dados: any) => {
  const db = ler()
  const alvo = db[col].find((x) => String(x.id) === String(id))
  if (!alvo) throw new Error(`${col}/${id} não encontrado`)
  Object.assign(alvo, dados)
  gravar(db)
  return structuredClone(alvo)
}

/* ---------- API pública (mesma interface nos dois modos) ---------- */

// Erros são propagados de propósito: quem chama decide o que mostrar ao usuário.
export const api = {
  getPedidos: () => (API_URL ? req<any[]>('/pedidos') : listar('pedidos')),
  getUsuarios: () => (API_URL ? req<any[]>('/usuarios') : listar('usuarios')),
  getGrupos: () => (API_URL ? req<any[]>('/grupos') : listar('grupos')),
  getAutomoveis: () => (API_URL ? req<any[]>('/automoveis') : listar('automoveis')),

  criarPedido: (pedido: any) =>
    API_URL ? req('/pedidos', { method: 'POST', body: JSON.stringify(pedido) }) : criar('pedidos', pedido),

  atualizarPedido: (id: string, dados: any) =>
    API_URL
      ? req(`/pedidos/${id}`, { method: 'PATCH', body: JSON.stringify(dados) })
      : atualizar('pedidos', id, dados),

  criarUsuario: (usuario: any) =>
    API_URL ? req('/usuarios', { method: 'POST', body: JSON.stringify(usuario) }) : criar('usuarios', usuario),

  /** Apaga os dados do navegador e volta ao conteúdo inicial do db.json (só no modo local). */
  restaurarDados: () => {
    memoria = null
    try { localStorage.removeItem(CHAVE) } catch { /* ignora */ }
  },
}
