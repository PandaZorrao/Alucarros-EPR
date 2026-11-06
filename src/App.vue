<script setup>
import { computed } from 'vue'
import { store } from './store'
import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'
import CriarPedidoView from './views/CriarPedidoView.vue'
import ClienteDashboard from './views/ClienteDashboard.vue'
import AgenteDashboard from './views/AgenteDashboard.vue'

const tela = computed(() => {
  const logado = !!store.usuarioLogado
  switch (store.viewAtual) {
    case 'login':
    case 'cadastro':
      return LoginView
    case 'criar_pedido':
      return logado ? CriarPedidoView : LoginView
    case 'dashboard':
      if (!logado) return LoginView
      return store.usuarioLogado.tipo === 'agente' ? AgenteDashboard : ClienteDashboard
    default:
      return HomeView
  }
})
</script>

<template>
  <header class="sticky top-0 z-20 bg-asfalto text-papel">
    <nav class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
      <button class="flex cursor-pointer items-center gap-3" @click="store.irPara('home')" aria-label="Ir para a página inicial">
        <span class="placa !border-papel"><span>BRASIL</span><span class="!py-1 !text-base">ALUCARROS</span></span>
      </button>

      <div class="flex items-center gap-5 text-sm">
        <button class="cursor-pointer hover:text-white/70" @click="store.irPara('home')">Frota</button>
        <template v-if="store.usuarioLogado">
          <button class="cursor-pointer hover:text-white/70" @click="store.irPara('dashboard')">
            {{ store.usuarioLogado.tipo === 'agente' ? 'Painel de análise' : 'Minhas reservas' }}
          </button>
          <span class="hidden text-white/60 sm:inline">{{ store.usuarioLogado.nome }}</span>
          <button class="rounded-lg border border-white/30 px-3 py-1.5 font-semibold hover:bg-white/10" @click="store.fazerLogout()">Sair</button>
        </template>
        <template v-else>
          <button class="cursor-pointer hover:text-white/70" @click="store.irPara('login')">Entrar</button>
          <button class="rounded-lg bg-placa px-3 py-1.5 font-semibold hover:bg-placa-escuro" @click="store.irPara('cadastro')">Criar conta</button>
        </template>
      </div>
    </nav>
  </header>

  <main>
    <component :is="tela" :key="store.viewAtual" @reservar="(carro) => store.guardarIntencaoReserva(carro)" />
  </main>
</template>
