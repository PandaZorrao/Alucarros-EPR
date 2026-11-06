export const brl = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const dataBR = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = String(iso).split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

export const hoje = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export const codigoPedido = (id) => String(id).slice(-6).toUpperCase()

export const contarDiarias = (dataIni, horaIni, dataFim, horaFim) => {
  if (!dataIni || !dataFim) return 0
  const ini = new Date(`${dataIni}T${horaIni || '00:00'}`)
  const fim = new Date(`${dataFim}T${horaFim || '00:00'}`)
  const ms = fim - ini
  if (!Number.isFinite(ms) || ms <= 0) return 0
  return Math.ceil(ms / 86400000)
}

export const validarReserva = (r) => {
  if (!r.localRetirada?.trim()) return 'Informe o local de retirada.'
  if (!r.dataRetirada) return 'Informe a data de retirada.'
  if (!r.horaRetirada) return 'Informe a hora de retirada.'
  if (r.dataRetirada < hoje()) return 'A data de retirada não pode estar no passado.'
  if (!r.localDevolucao?.trim()) return 'Informe o local de devolução.'
  if (!r.dataDevolucao) return 'Informe a data de devolução.'
  if (!r.horaDevolucao) return 'Informe a hora de devolução.'
  if (contarDiarias(r.dataRetirada, r.horaRetirada, r.dataDevolucao, r.horaDevolucao) === 0)
    return 'A devolução precisa ser depois da retirada.'
  return ''
}

export const STATUS = {
  pendente_analise: { rotulo: 'Em análise', classe: 'bg-amber-100 text-amber-900' },
  aprovado: { rotulo: 'Aprovado, aguarda contrato', classe: 'bg-emerald-100 text-emerald-900' },
  contrato_executado: { rotulo: 'Contrato executado', classe: 'bg-asfalto text-papel' },
  rejeitado: { rotulo: 'Rejeitado', classe: 'bg-rose-100 text-rose-900' },
  cancelado: { rotulo: 'Cancelado', classe: 'bg-stone-200 text-stone-600' },
}
export const statusInfo = (s) => STATUS[s] ?? { rotulo: s, classe: 'bg-stone-200 text-stone-700' }

export const PROPRIEDADE = { cliente: 'Cliente', empresa: 'Empresa', banco: 'Banco' }

export const rendaTotal = (cliente) =>
  (cliente?.empregadores ?? []).reduce((soma, e) => soma + (Number(e.rendimento) || 0), 0)
