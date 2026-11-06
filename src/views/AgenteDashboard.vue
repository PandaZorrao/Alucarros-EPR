<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '../services/api'
import { store } from '../store'
import { brl, dataBR, codigoPedido, statusInfo, rendaTotal, PROPRIEDADE } from '../utils'

const aba = ref('pendente_analise')
const abertoId = ref('')
const ocupado = ref('')
const erroAcao = ref('')
const contrato = reactive({ propriedade: 'banco', credito: false })

const agente = computed(() => store.usuarioLogado)
const ehBanco = computed(() => agente.value?.perfil === 'banco')

const abas = computed(() => [
  { id: 'pendente_analise', rotulo: 'Para analisar' },
  { id: 'aprovado', rotulo: 'Aguardando contrato' },
  { id: 'todos', rotulo: 'Todos' },
].map((a) => ({
  ...a,
  total: a.id === 'todos' ? store.pedidos.length : store.pedidos.filter((p) => p.status === a.id).length,
})))

const lista = computed(() => (aba.value === 'todos' ? store.pedidos : store.pedidos.filter((p) => p.status === aba.value)))

onMounted(() => store.carregarPedidos())

const salvar = async (p, dados) => {
  ocupado.value = p.id
  erroAcao.value = ''
  try {
    await api.atualizarPedido(p.id, { ...dados, agenteAvaliadorId: agente.value.id })
    abertoId.value = ''
    await store.carregarPedidos()
  } catch (e) {
    console.error(e)
    erroAcao.value = 'Não foi possível salvar o parecer. Tente novamente.'
  } finally {
    ocupado.value = ''
  }
}

const aprovar = (p) => salvar(p, { status: 'aprovado' })
const rejeitar = (p) => salvar(p, { status: 'rejeitado' })
const reabrir = (p) => salvar(p, { status: 'pendente_analise', contratoCreditoId: null })

const abrirContrato = (p) => {
  abertoId.value = abertoId.value === p.id ? '' : p.id
  contrato.propriedade = ehBanco.value ? 'banco' : 'empresa'
  contrato.credito = false
}
const executarContrato = (p) =>
  salvar(p, {
    status: 'contrato_executado',
    propriedade: contrato.propriedade,
    contratoCreditoId: ehBanco.value && contrato.credito ? agente.value.id : null,
  })
</script>

<template>
  <section class="mx-auto max-w-6xl px-5 py-10">
    <header>
      <h1 class="font-display text-3xl font-bold">Painel de análise</h1>
      <p class="mt-1 text-muted">{{ agente.nome }} · avalie o perfil financeiro e conduza o pedido até o contrato.</p>
    </header>

    <div class="mt-6 flex gap-6 overflow-x-auto border-b border-linha text-sm font-semibold">
      <button v-for="a in abas" :key="a.id" type="button"
        :class="['-mb-px shrink-0 cursor-pointer border-b-2 pb-2', aba === a.id ? 'border-placa' : 'border-transparent text-muted']"
        @click="aba = a.id">
        {{ a.rotulo }} <span class="ml-1 text-muted">{{ a.total }}</span>
      </button>
    </div>

    <p v-if="erroAcao" role="alert" class="mt-6 rounded-lg bg-rose-100 px-4 py-3 text-sm text-rose-900">{{ erroAcao }}</p>
    <div v-if="store.erro" role="alert" class="mt-6 rounded-lg bg-rose-100 px-4 py-4 text-sm text-rose-900">
      {{ store.erro }} <button class="btn-link ml-2" @click="store.carregarPedidos()">Tentar de novo</button>
    </div>
    <p v-else-if="store.carregando && !store.pedidos.length" class="mt-8 text-muted">Carregando pedidos…</p>
    <p v-else-if="!lista.length" class="mt-8 rounded-lg border border-dashed border-linha p-10 text-center text-muted">
      Nenhum pedido nesta lista.
    </p>

    <ul v-else class="mt-2 divide-y divide-linha">
      <li v-for="p in lista" :key="p.id" class="py-6">
        <div class="grid gap-5 lg:grid-cols-[7rem_1.1fr_1.1fr_1fr_auto]">
          <div class="flex items-start gap-4 lg:flex-col">
            <span class="placa"><span>PEDIDO</span><span>{{ codigoPedido(p.id) }}</span></span>
            <span class="badge" :class="statusInfo(p.status).classe">{{ statusInfo(p.status).rotulo }}</span>
          </div>

          <div class="text-sm">
            <p class="font-semibold">{{ p.cliente?.nome ?? 'Cliente não encontrado' }}</p>
            <p class="text-muted">CPF {{ p.cliente?.cpf ?? '—' }} · RG {{ p.cliente?.rg ?? '—' }}</p>
            <p class="text-muted">{{ p.cliente?.endereco ?? '' }}</p>
          </div>

          <div class="text-sm">
            <p class="font-semibold">{{ p.cliente?.profissao ?? 'Profissão não informada' }}</p>
            <p v-for="(e, i) in p.cliente?.empregadores ?? []" :key="i" class="text-muted">{{ e.nome }}: {{ brl(e.rendimento) }}</p>
            <p class="mt-1 font-medium">Renda total {{ brl(rendaTotal(p.cliente)) }}</p>
          </div>

          <div class="text-sm">
            <p class="font-semibold">{{ p.carroReservado?.nome ?? 'Grupo não informado' }}</p>
            <p class="text-muted">{{ dataBR(p.dadosReserva?.dataRetirada) }} a {{ dataBR(p.dadosReserva?.dataDevolucao) }}</p>
            <p class="mt-1 font-display text-lg font-bold">{{ brl(p.valorTotal) }}</p>
            <p v-if="p.propriedade" class="text-muted">Propriedade: {{ PROPRIEDADE[p.propriedade] ?? p.propriedade }}<span v-if="p.contratoCreditoId"> · com crédito</span></p>
          </div>

          <div class="flex flex-wrap items-start gap-2 lg:flex-col lg:items-stretch">
            <template v-if="p.status === 'pendente_analise'">
              <button class="btn-primary" :disabled="ocupado === p.id" @click="aprovar(p)">Aprovar</button>
              <button class="btn-outline" :disabled="ocupado === p.id" @click="rejeitar(p)">Rejeitar</button>
            </template>
            <template v-else-if="p.status === 'aprovado'">
              <button class="btn-primary" @click="abrirContrato(p)">Executar contrato</button>
              <button class="btn-outline" :disabled="ocupado === p.id" @click="reabrir(p)">Reabrir análise</button>
            </template>
            <button v-else-if="p.status === 'rejeitado'" class="btn-outline" :disabled="ocupado === p.id" @click="reabrir(p)">Reabrir análise</button>
          </div>
        </div>

        <form v-if="abertoId === p.id" class="mt-5 flex flex-wrap items-end gap-5 rounded-lg bg-white p-5" @submit.prevent="executarContrato(p)">
          <div>
            <label :for="`prop-${p.id}`" class="rotulo">Veículo registrado como propriedade de</label>
            <select :id="`prop-${p.id}`" v-model="contrato.propriedade" class="campo">
              <option v-for="(rotulo, chave) in PROPRIEDADE" :key="chave" :value="chave">{{ rotulo }}</option>
            </select>
          </div>
          <label v-if="ehBanco" class="flex items-center gap-2 pb-3 text-sm">
            <input v-model="contrato.credito" type="checkbox" class="accent-placa" /> Associar contrato de crédito deste banco
          </label>
          <button type="submit" class="btn-red" :disabled="ocupado === p.id">Confirmar contrato</button>
        </form>
      </li>
    </ul>
  </section>
</template>
