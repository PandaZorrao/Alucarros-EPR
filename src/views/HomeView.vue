<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '../services/api'
import { store } from '../store'
import { brl, hoje, validarReserva, contarDiarias } from '../utils'

const emit = defineEmits(['reservar'])

const grupos = ref([])
const carregando = ref(true)
const erroGrupos = ref('')
const tentou = ref(false)
const minData = hoje()

const busca = reactive({
  localRetirada: '', dataRetirada: '', horaRetirada: '10:00',
  localDevolucao: '', dataDevolucao: '', horaDevolucao: '10:00',
})

const reserva = computed(() => ({ ...busca, localDevolucao: busca.localDevolucao || busca.localRetirada }))
const erro = computed(() => validarReserva(reserva.value))
const diarias = computed(() =>
  contarDiarias(busca.dataRetirada, busca.horaRetirada, busca.dataDevolucao, busca.horaDevolucao))
const ehAgente = computed(() => store.usuarioLogado?.tipo === 'agente')

onMounted(async () => {
  try {
    const [gs, carros] = await Promise.all([api.getGrupos(), api.getAutomoveis()])
    grupos.value = gs.map((g) => ({ ...g, imagemBase: carros.find((c) => c.grupoId === g.id)?.imagem ?? '' }))
  } catch (e) {
    console.error(e)
    erroGrupos.value = 'Não foi possível carregar a frota. Tente novamente ou recarregue a página.'
  } finally {
    carregando.value = false
  }
})

const reservar = (g) => {
  tentou.value = true
  if (erro.value) return
  emit('reservar', {
    id: g.id, nome: g.nome, veiculosBase: g.veiculosBase, diaria: g.diaria, imagemBase: g.imagemBase,
    detalhesReserva: { ...reserva.value },
  })
}
</script>

<template>
  <datalist id="sugestoes-local">
    <option value="Belo Horizonte - Alucarros Savassi"></option>
  </datalist>

  <section class="bg-asfalto text-papel">
    <div class="mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-12 lg:grid-cols-[1fr_1.15fr] lg:items-center">
      <div>
        <h1 class="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          Reserve o carro, acompanhe a análise do pedido.
        </h1>
        <p class="mt-5 max-w-md text-base text-white/70">
          Escolha retirada e devolução, envie o pedido e veja o parecer do agente financeiro direto no seu painel.
        </p>
      </div>

      <form class="rounded-2xl bg-papel p-5 text-asfalto shadow-xl sm:p-6" novalidate @submit.prevent="tentou = true">
        <fieldset class="space-y-3">
          <legend class="mb-2 font-display text-lg font-semibold">Retirada</legend>
          <input v-model="busca.localRetirada" list="sugestoes-local" class="campo" placeholder="Local de retirada" aria-label="Local de retirada" />
          <div class="grid grid-cols-[1fr_8rem] gap-3">
            <input v-model="busca.dataRetirada" type="date" :min="minData" class="campo" aria-label="Data de retirada" />
            <input v-model="busca.horaRetirada" type="time" class="campo" aria-label="Hora de retirada" />
          </div>
        </fieldset>
        <fieldset class="mt-5 space-y-3">
          <legend class="mb-2 font-display text-lg font-semibold">Devolução</legend>
          <input v-model="busca.localDevolucao" list="sugestoes-local" class="campo" placeholder="Mesmo local da retirada" aria-label="Local de devolução" />
          <div class="grid grid-cols-[1fr_8rem] gap-3">
            <input v-model="busca.dataDevolucao" type="date" :min="busca.dataRetirada || minData" class="campo" aria-label="Data de devolução" />
            <input v-model="busca.horaDevolucao" type="time" class="campo" aria-label="Hora de devolução" />
          </div>
        </fieldset>
        <p v-if="tentou && erro" role="alert" class="mt-4 text-sm font-medium text-placa-escuro">{{ erro }}</p>
        <p v-else-if="diarias" class="mt-4 text-sm text-muted">{{ diarias }} {{ diarias === 1 ? 'diária' : 'diárias' }} no período.</p>
      </form>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-5 py-12">
    <h2 class="font-display text-2xl font-bold">Frota</h2>
    <p class="mt-1 text-muted">Escolha o grupo e envie o pedido para análise.</p>

    <p v-if="ehAgente" class="mt-4 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-900">
      Você está logado como agente. Apenas clientes podem criar pedidos.
    </p>
    <p v-if="erroGrupos" role="alert" class="mt-6 rounded-lg bg-rose-100 px-4 py-3 text-sm text-rose-900">{{ erroGrupos }}</p>
    <p v-else-if="carregando" class="mt-6 text-muted">Carregando a frota…</p>

    <ul v-else class="mt-6 divide-y divide-linha border-y border-linha">
      <li v-for="g in grupos" :key="g.id" class="grid items-center gap-5 py-6 sm:grid-cols-[11rem_1fr_auto]">
        <img :src="g.imagemBase" :alt="g.veiculosBase" class="h-28 w-full rounded-lg bg-white object-cover sm:w-44" loading="lazy" />
        <div>
          <p class="text-sm text-muted">Grupo {{ g.id }}</p>
          <h3 class="font-display text-xl font-semibold">{{ g.nome }}</h3>
          <p class="mt-1 text-sm text-muted">{{ g.veiculosBase }}</p>
        </div>
        <div class="flex items-center justify-between gap-6 sm:flex-col sm:items-end sm:gap-3">
          <div class="sm:text-right">
            <p class="font-display text-2xl font-bold">{{ brl(g.diaria) }}</p>
            <p class="text-xs text-muted">por diária<span v-if="diarias"> · {{ brl(g.diaria * diarias) }} no total</span></p>
          </div>
          <button class="btn-red" :disabled="ehAgente" @click="reservar(g)">Reservar</button>
        </div>
      </li>
    </ul>
  </section>
</template>
