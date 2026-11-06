import { reactive } from 'vue'
import { api } from './services/api'

const CHAVE = 'alucarros:usuario'
const lerSessao = () => {
  try { return JSON.parse(sessionStorage.getItem(CHAVE)) } catch { return null }
}
const gravarSessao = (u) => {
  try { u ? sessionStorage.setItem(CHAVE, JSON.stringify(u)) : sessionStorage.removeItem(CHAVE) } catch { /* ignora */ }
}

export const store = reactive({
  usuarioLogado: lerSessao(),
  viewAtual: 'home',
  carroParaReserva: null,
  pedidoEmEdicao: null,
  pedidos: [],
  carregando: false,
  erro: '',
  aviso: '',

  fazerLogin(usuario) {
    this.usuarioLogado = usuario
    gravarSessao(usuario)
    if (this.carroParaReserva && usuario.tipo === 'cliente') {
      this.viewAtual = 'criar_pedido'
    } else {
      this.carroParaReserva = null
      this.viewAtual = 'dashboard'
    }
  },

  fazerLogout() {
    this.usuarioLogado = null
    gravarSessao(null)
    this.carroParaReserva = null
    this.pedidoEmEdicao = null
    this.pedidos = []
    this.erro = ''
    this.viewAtual = 'home'
  },

  irPara(view) {
    if (view !== 'criar_pedido') this.pedidoEmEdicao = null
    this.viewAtual = view
  },

  guardarIntencaoReserva(carro) {
    this.carroParaReserva = carro
    this.pedidoEmEdicao = null
    this.viewAtual = this.usuarioLogado ? 'criar_pedido' : 'login'
  },

  iniciarEdicao(pedido) {
    this.pedidoEmEdicao = pedido
    this.carroParaReserva = null
    this.viewAtual = 'criar_pedido'
  },

  async carregarPedidos() {
    if (!this.usuarioLogado) return
    this.carregando = true
    this.erro = ''
    try {
      // O vínculo com o cliente é feito aqui. O antigo "?_expand=cliente" não funciona
      // no json-server 1.x e não existe coleção "clientes" (a coleção é "usuarios").
      const [pedidos, usuarios] = await Promise.all([api.getPedidos(), api.getUsuarios()])
      const porId = new Map(usuarios.map((u) => [String(u.id), u]))
      const eu = this.usuarioLogado
      const lista = pedidos
        .map((p) => ({ ...p, cliente: porId.get(String(p.clienteId)) ?? null }))
        .filter((p) => eu.tipo !== 'cliente' || String(p.clienteId) === String(eu.id))
        .reverse()
        .sort((a, b) => String(b.dataPedido).localeCompare(String(a.dataPedido)))
      this.pedidos = lista
    } catch (e) {
      console.error('Erro ao carregar pedidos:', e)
      this.pedidos = []
      this.erro = 'Não foi possível carregar os pedidos. Confirme se a API está rodando (npm run api).'
    } finally {
      this.carregando = false
    }
  },
})
