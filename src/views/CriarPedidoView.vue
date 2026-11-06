<script setup>
import { ref, reactive, computed } from 'vue'
import { api } from '../services/api'
import { store } from '../store'
import { brl, hoje, validarReserva, contarDiarias } from '../utils'

const editando = store.pedidoEmEdicao
const carro = editando ? editando.carroReservado : store.carroParaReserva
const cliente = store.usuarioLogado
const origem = editando ? editando.dadosReserva : (carro?.detalhesReserva ?? {})

const form = reactive({
  localRetirada: '', dataRetirada: '', horaRetirada: '10:00',
  localDevolucao: '', dataDevolucao: '', horaDevolucao: '10:00',
  ...origem,
})
const salvando = ref(false)
const tentou = ref(false)
const erroApi = ref('')
const minData = hoje()

const erro = computed(() => validarReserva(form))
const diarias = computed(() => contarDiarias(form.dataRetirada, form.horaRetirada, form.dataDevolucao, form.horaDevolucao))
const total = computed(() => diarias.value * (carro?.diaria || 0))

const confirmar = async () => {
  tentou.value = true
  erroApi.value = ''
  if (erro.value || !carro || !cliente) return
  salvando.value = true
  try {
    if (editando) {
      await api.atualizarPedido(editando.id, { dadosReserva: { ...form }, valorTotal: total.value })
      store.aviso = 'Reserva atualizada.'
    } else {
      await api.criarPedido({
        id: Date.now().toString(),
        clienteId: String(cliente.id),
        carroReservado: { id: carro.id, nome: carro.nome, veiculosBase: carro.veiculosBase, diaria: carro.diaria, imagemBase: carro.imagemBase },
        dadosReserva: { ...form },
        status: 'pendente_analise',
        dataPedido: hoje(),
        valorTotal: total.value,
        agenteAvaliadorId: null,
        contratoCreditoId: null,
      })
      store.aviso = 'Pedido enviado. Agora ele aguarda a análise financeira do agente.'
    }
    store.carroParaReserva = null
    store.irPara('dashboard')
  } catch (e) {
    console.error(e)
    erroApi.value = 'Não foi possível salvar o pedido. Confirme se a API está rodando (npm run api).'
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-5xl px-5 py-10">
    <button class="btn-link" @click="store.irPara(editando ? 'dashboard' : 'home')">Voltar</button>
    <h1 class="mt-3 font-display text-3xl font-bold">{{ editando ? 'Modificar reserva' : 'Finalizar reserva' }}</h1>

    <div v-if="!carro || cliente?.tipo !== 'cliente'" class="mt-8 rounded-lg bg-white p-6">
      <p class="text-muted">
        {{ cliente?.tipo !== 'cliente' ? 'Apenas clientes podem criar pedidos.' : 'Nenhum veículo selecionado.' }}
      </p>
      <button class="btn-primary mt-4" @click="store.irPara('home')">Ver frota</button>
    </div>

    <div v-else class="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
      <form novalidate class="space-y-8" @submit.prevent="confirmar">
        <section>
          <h2 class="font-display text-lg font-semibold">Condutor</h2>
          <dl class="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt class="text-muted">Nome</dt><dd class="font-medium">{{ cliente.nome }}</dd></div>
            <div><dt class="text-muted">CPF</dt><dd class="font-medium">{{ cliente.cpf }}</dd></div>
            <div><dt class="text-muted">Profissão</dt><dd class="font-medium">{{ cliente.profissao }}</dd></div>
            <div><dt class="text-muted">Endereço</dt><dd class="font-medium">{{ cliente.endereco }}</dd></div>
          </dl>
        </section>

        <fieldset class="space-y-3">
          <legend class="font-display text-lg font-semibold">Retirada</legend>
          <input v-model="form.localRetirada" class="campo" aria-label="Local de retirada" placeholder="Local" />
          <div class="grid grid-cols-[1fr_8rem] gap-3">
            <input v-model="form.dataRetirada" type="date" :min="minData" class="campo" aria-label="Data de retirada" />
            <input v-model="form.horaRetirada" type="time" class="campo" aria-label="Hora de retirada" />
          </div>
        </fieldset>

        <fieldset class="space-y-3">
          <legend class="font-display text-lg font-semibold">Devolução</legend>
          <input v-model="form.localDevolucao" class="campo" aria-label="Local de devolução" placeholder="Local" />
          <div class="grid grid-cols-[1fr_8rem] gap-3">
            <input v-model="form.dataDevolucao" type="date" :min="form.dataRetirada || minData" class="campo" aria-label="Data de devolução" />
            <input v-model="form.horaDevolucao" type="time" class="campo" aria-label="Hora de devolução" />
          </div>
        </fieldset>

        <p v-if="tentou && erro" role="alert" class="text-sm font-medium text-placa-escuro">{{ erro }}</p>
        <p v-if="erroApi" role="alert" class="rounded-lg bg-rose-100 px-4 py-3 text-sm text-rose-900">{{ erroApi }}</p>

        <button type="submit" class="btn-red w-full py-3.5" :disabled="salvando">
          {{ salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Enviar para análise' }}
        </button>
      </form>

      <aside class="h-fit overflow-hidden rounded-2xl bg-asfalto text-papel lg:sticky lg:top-20">
        <img :src="carro.imagemBase" :alt="carro.veiculosBase" class="h-40 w-full object-cover" />
        <div class="space-y-1 p-5">
          <p class="text-sm text-white/60">Grupo {{ carro.id }}</p>
          <p class="font-display text-lg font-semibold">{{ carro.nome }}</p>
          <p class="text-xs text-white/60">{{ carro.veiculosBase }}</p>
        </div>
        <div class="border-t border-white/15 p-5">
          <p class="text-sm text-white/70">{{ diarias || '—' }} {{ diarias === 1 ? 'diária' : 'diárias' }} × {{ brl(carro.diaria) }}</p>
          <p class="mt-1 font-display text-3xl font-bold">{{ brl(total) }}</p>
          <p class="mt-1 text-xs text-white/50">Valor previsto, sujeito à análise.</p>
        </div>
      </aside>
    </div>
  </section>
</template>
