<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '../services/api'
import { store } from '../store'

const usuarios = ref([])
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const selecionado = ref('')

const form = reactive({
  tipo: 'cliente', perfil: 'banco', nome: '', cpf: '', rg: '', endereco: '', profissao: '',
  empregadores: [{ nome: '', rendimento: null }],
})
const ehCliente = computed(() => form.tipo === 'cliente')
const modoLogin = computed(() => store.viewAtual !== 'cadastro')
const clientes = computed(() => usuarios.value.filter((u) => u.tipo === 'cliente'))
const agentes = computed(() => usuarios.value.filter((u) => u.tipo === 'agente'))

onMounted(async () => {
  try {
    usuarios.value = await api.getUsuarios()
  } catch (e) {
    console.error(e)
    erro.value = 'Não foi possível carregar os usuários. Confirme se a API está rodando (npm run api).'
  } finally {
    carregando.value = false
  }
})

const entrar = () => {
  const u = usuarios.value.find((x) => String(x.id) === String(selecionado.value))
  if (u) store.fazerLogin(u)
}

const cadastrar = async () => {
  salvando.value = true
  erro.value = ''
  try {
    const base = { id: Date.now().toString(), tipo: form.tipo, nome: form.nome.trim() }
    const novo = ehCliente.value
      ? {
          ...base, cpf: form.cpf, rg: form.rg, endereco: form.endereco, profissao: form.profissao,
          empregadores: form.empregadores.map((e) => ({ nome: e.nome, rendimento: parseFloat(e.rendimento) || 0 })),
        }
      : { ...base, perfil: form.perfil }
    store.fazerLogin(await api.criarUsuario(novo))
  } catch (e) {
    console.error(e)
    erro.value = 'Não foi possível concluir o cadastro. Confirme se a API está rodando (npm run api).'
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-lg px-5 py-12">
    <h1 class="font-display text-3xl font-bold">{{ modoLogin ? 'Entrar' : 'Criar conta' }}</h1>
    <p class="mt-1 text-muted">
      {{ modoLogin ? 'Escolha o seu perfil para acessar o sistema.' : 'O cadastro é necessário antes de qualquer pedido.' }}
    </p>

    <div class="mt-6 flex gap-6 border-b border-linha text-sm font-semibold">
      <button type="button" :class="['-mb-px cursor-pointer border-b-2 pb-2', modoLogin ? 'border-placa' : 'border-transparent text-muted']" @click="store.irPara('login')">Já tenho conta</button>
      <button type="button" :class="['-mb-px cursor-pointer border-b-2 pb-2', !modoLogin ? 'border-placa' : 'border-transparent text-muted']" @click="store.irPara('cadastro')">Primeiro acesso</button>
    </div>

    <p v-if="erro" role="alert" class="mt-5 rounded-lg bg-rose-100 px-4 py-3 text-sm text-rose-900">{{ erro }}</p>

    <form v-if="modoLogin" class="mt-6 space-y-5" @submit.prevent="entrar">
      <div>
        <label for="perfil" class="rotulo">Perfil</label>
        <select id="perfil" v-model="selecionado" class="campo" :disabled="carregando">
          <option value="" disabled>{{ carregando ? 'Carregando…' : 'Selecione seu perfil' }}</option>
          <optgroup label="Clientes">
            <option v-for="u in clientes" :key="u.id" :value="u.id">{{ u.nome }}</option>
          </optgroup>
          <optgroup label="Agentes (bancos e empresas)">
            <option v-for="u in agentes" :key="u.id" :value="u.id">{{ u.nome }}</option>
          </optgroup>
        </select>
      </div>
      <button type="submit" class="btn-primary w-full" :disabled="!selecionado">Entrar</button>
    </form>

    <form v-else class="mt-6 space-y-4" @submit.prevent="cadastrar">
      <div class="grid grid-cols-2 gap-3">
        <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-linha bg-white px-3 py-2.5 text-sm has-[:checked]:border-asfalto">
          <input v-model="form.tipo" type="radio" value="cliente" class="accent-placa" /> Cliente
        </label>
        <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-linha bg-white px-3 py-2.5 text-sm has-[:checked]:border-asfalto">
          <input v-model="form.tipo" type="radio" value="agente" class="accent-placa" /> Agente
        </label>
      </div>

      <div>
        <label for="nome" class="rotulo">{{ ehCliente ? 'Nome completo' : 'Nome da instituição' }}</label>
        <input id="nome" v-model="form.nome" required class="campo" />
      </div>

      <template v-if="ehCliente">
        <div class="grid grid-cols-2 gap-3">
          <div><label for="cpf" class="rotulo">CPF</label><input id="cpf" v-model="form.cpf" required inputmode="numeric" placeholder="000.000.000-00" class="campo" /></div>
          <div><label for="rg" class="rotulo">RG</label><input id="rg" v-model="form.rg" required class="campo" /></div>
        </div>
        <div><label for="end" class="rotulo">Endereço</label><input id="end" v-model="form.endereco" required class="campo" /></div>
        <div><label for="prof" class="rotulo">Profissão</label><input id="prof" v-model="form.profissao" required class="campo" /></div>

        <fieldset class="rounded-lg border border-linha bg-papel p-4">
          <legend class="px-1 text-sm font-medium text-grafite">Empregadores e rendimentos (até 3)</legend>
          <div v-for="(emp, i) in form.empregadores" :key="i" class="mb-3 grid grid-cols-[1fr_9rem_auto] gap-2">
            <input v-model="emp.nome" required placeholder="Empresa" :aria-label="`Empregador ${i + 1}`" class="campo" />
            <input v-model="emp.rendimento" required type="number" min="0" step="0.01" placeholder="R$ / mês" :aria-label="`Rendimento ${i + 1}`" class="campo" />
            <button v-if="form.empregadores.length > 1" type="button" class="btn-link" @click="form.empregadores.splice(i, 1)" :aria-label="`Remover empregador ${i + 1}`">Remover</button>
          </div>
          <button v-if="form.empregadores.length < 3" type="button" class="btn-link" @click="form.empregadores.push({ nome: '', rendimento: null })">Adicionar empregador</button>
        </fieldset>
      </template>

      <div v-else>
        <label for="perfil-ag" class="rotulo">Tipo de agente</label>
        <select id="perfil-ag" v-model="form.perfil" class="campo">
          <option value="banco">Banco (pode conceder crédito)</option>
          <option value="empresa">Empresa</option>
        </select>
      </div>

      <button type="submit" class="btn-red w-full" :disabled="salvando">{{ salvando ? 'Salvando…' : 'Criar conta' }}</button>
    </form>
  </section>
</template>
