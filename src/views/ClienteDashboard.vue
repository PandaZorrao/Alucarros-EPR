<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../services/api'
import { store } from '../store'
import { brl, dataBR, codigoPedido, statusInfo, contarDiarias } from '../utils'

const aviso = ref('')
const erroAcao = ref('')
const ocupado = ref('')

const primeiroNome = computed(() => store.usuarioLogado?.nome?.split(' ')[0] ?? '')

onMounted(() => {
  aviso.value = store.aviso
  store.aviso = ''
  store.carregarPedidos()
})

const podeModificar = (p) => p.status === 'pendente_analise'
const podeCancelar = (p) => ['pendente_analise', 'aprovado'].includes(p.status)
const diarias = (p) => {
  const r = p.dadosReserva ?? {}
  return contarDiarias(r.dataRetirada, r.horaRetirada, r.dataDevolucao, r.horaDevolucao)
}

const cancelar = async (p) => {
  if (!confirm('Cancelar esta reserva?')) return
  ocupado.value = p.id
  erroAcao.value = ''
  try {
    await api.atualizarPedido(p.id, { status: 'cancelado' })
    await store.carregarPedidos()
  } catch (e) {
    console.error(e)
    erroAcao.value = 'Não foi possível cancelar. Tente novamente.'
  } finally {
    ocupado.value = ''
  }
}
</script>

<template>
  <section class="mx-auto max-w-5xl px-5 py-10">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold">Minhas reservas</h1>
        <p class="mt-1 text-muted">Olá, {{ primeiroNome }}. Acompanhe, modifique ou cancele seus pedidos.</p>
      </div>
      <button class="btn-red" @click="store.irPara('home')">Nova reserva</button>
    </header>

    <p v-if="aviso" role="status" class="mt-6 rounded-lg bg-emerald-100 px-4 py-3 text-sm text-emerald-900">{{ aviso }}</p>
    <p v-if="erroAcao" role="alert" class="mt-6 rounded-lg bg-rose-100 px-4 py-3 text-sm text-rose-900">{{ erroAcao }}</p>

    <div v-if="store.erro" role="alert" class="mt-8 rounded-lg bg-rose-100 px-4 py-4 text-sm text-rose-900">
      {{ store.erro }} <button class="btn-link ml-2" @click="store.carregarPedidos()">Tentar de novo</button>
    </div>
    <p v-else-if="store.carregando && !store.pedidos.length" class="mt-8 text-muted">Carregando suas reservas…</p>
    <div v-else-if="!store.pedidos.length" class="mt-8 rounded-lg border border-dashed border-linha p-10 text-center">
      <p class="font-display text-lg font-semibold">Você ainda não tem reservas</p>
      <p class="mt-1 text-sm text-muted">Escolha um grupo na frota e envie seu primeiro pedido.</p>
      <button class="btn-primary mt-5" @click="store.irPara('home')">Ver frota</button>
    </div>

    <ul v-else class="mt-8 divide-y divide-linha border-y border-linha">
      <li v-for="p in store.pedidos" :key="p.id" class="grid gap-5 py-6 md:grid-cols-[7rem_1fr_auto]">
        <div class="flex items-start gap-4 md:flex-col">
          <span class="placa"><span>PEDIDO</span><span>{{ codigoPedido(p.id) }}</span></span>
          <span class="badge" :class="statusInfo(p.status).classe">{{ statusInfo(p.status).rotulo }}</span>
        </div>

        <div class="flex gap-4">
          <img v-if="p.carroReservado?.imagemBase" :src="p.carroReservado.imagemBase" alt="" class="hidden h-20 w-28 rounded-lg object-cover sm:block" loading="lazy" />
          <div class="text-sm">
            <p class="font-display text-lg font-semibold">{{ p.carroReservado?.nome ?? 'Grupo não informado' }}</p>
            <p class="mt-1 text-muted">
              Retirada {{ dataBR(p.dadosReserva?.dataRetirada) }} às {{ p.dadosReserva?.horaRetirada ?? '—' }} · {{ p.dadosReserva?.localRetirada ?? '—' }}
            </p>
            <p class="text-muted">
              Devolução {{ dataBR(p.dadosReserva?.dataDevolucao) }} às {{ p.dadosReserva?.horaDevolucao ?? '—' }} · {{ p.dadosReserva?.localDevolucao ?? '—' }}
            </p>
            <p v-if="p.contratoCreditoId" class="mt-1 text-muted">Com contrato de crédito.</p>
          </div>
        </div>

        <div class="flex items-center justify-between gap-4 md:flex-col md:items-end">
          <div class="md:text-right">
            <p class="font-display text-xl font-bold">{{ brl(p.valorTotal) }}</p>
            <p class="text-xs text-muted">{{ diarias(p) || 1 }} {{ (diarias(p) || 1) === 1 ? 'diária' : 'diárias' }}</p>
          </div>
          <div class="flex gap-4">
            <button v-if="podeModificar(p)" class="btn-link" @click="store.iniciarEdicao(p)">Modificar</button>
            <button v-if="podeCancelar(p)" class="btn-link text-placa-escuro" :disabled="ocupado === p.id" @click="cancelar(p)">Cancelar</button>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
