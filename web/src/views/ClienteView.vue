<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useGateway } from '../composables/useGateway'

const {
  baseUrl,
  events,
  notifications,
  wsStatus,
  wsError,
  loadEvents,
  loadCheckins,
  purchaseTicket
} = useGateway()

// Watch para atualizar status dos ingressos quando receber notificação
watch(notifications, (newNotifications) => {
  if (newNotifications.length > 0) {
    const latest = newNotifications[0]
    if (latest.type === 'checkin_updated' && latest.data) {
      const idx = myTickets.value.findIndex((t) => t.id === latest.data.id)
      if (idx !== -1) {
        myTickets.value[idx] = { ...myTickets.value[idx], ...latest.data }
      }
    }
  }
}, { deep: true })

const myTickets = ref([])
const selectedEventId = ref('')
const attendeeName = ref('')
const loading = ref(false)
const error = ref('')
const ticketLoading = ref(false)
const ticketError = ref('')
const ticketSuccess = ref('')

const selectedEvent = computed(() =>
  events.value.find((item) => item.id === selectedEventId.value)
)

const clientNotifications = computed(() =>
  notifications.value.filter(
    (n) => n.type === 'event_created' || n.type === 'checkin_updated'
  )
)

const fetchEvents = async () => {
  loading.value = true
  error.value = ''
  try {
    await loadEvents()
    if (!selectedEventId.value && events.value.length) {
      selectedEventId.value = events.value[0].id
    }
  } catch (err) {
    error.value = 'Nao foi possivel carregar eventos.'
  } finally {
    loading.value = false
  }
}

const fetchMyTickets = async () => {
  ticketLoading.value = true
  try {
    const all = await loadCheckins()
    myTickets.value = all.filter((c) => c.attendeeName === attendeeName.value.trim())
  } catch (err) {
    // ignore
  } finally {
    ticketLoading.value = false
  }
}

const buyTicket = async () => {
  if (!selectedEventId.value || !attendeeName.value.trim()) {
    ticketError.value = 'Preencha o nome e escolha um evento.'
    return
  }
  ticketLoading.value = true
  ticketError.value = ''
  ticketSuccess.value = ''
  try {
    const ticket = await purchaseTicket(selectedEventId.value, attendeeName.value.trim())
    myTickets.value = [ticket, ...myTickets.value]
    ticketSuccess.value = `Ingresso ${ticket.id} comprado! Aguarde aprovacao.`
  } catch (err) {
    ticketError.value = 'Falha ao comprar ingresso.'
  } finally {
    ticketLoading.value = false
  }
}

const statusLabel = (status) => {
  const labels = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Recusado'
  }
  return labels[status] || status
}

const statusClass = (status) => {
  return `status-${status}`
}

onMounted(() => {
  fetchEvents()
})
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="hero-text">
        <p class="kicker">Area do Cliente</p>
        <h1>Eventos e Ingressos</h1>
        <p class="subtitle">
          Veja eventos disponiveis, compre ingressos e acompanhe aprovacoes.
        </p>
        <div class="hero-actions">
          <button class="primary" @click="fetchEvents" :disabled="loading">
            Recarregar eventos
          </button>
          <router-link to="/admin" class="ghost">Ir para Admin</router-link>
        </div>
        <p class="ws-status">
          WebSocket: {{ wsStatus }}
          <span v-if="wsError">({{ wsError }})</span>
        </p>
      </div>
      <div class="hero-card notifications-card">
        <p class="label">Notificacoes</p>
        <div class="notifications-scroll">
          <div v-if="clientNotifications.length" class="alerts-compact">
            <div v-for="n in clientNotifications" :key="n.id" class="alert-row-compact">
              <div>
                <strong>{{ n.message }}</strong>
                <span>{{ new Date(n.time).toLocaleString() }}</span>
              </div>
              <span class="pill" :class="n.type">{{ n.type === 'event_created' ? 'evento' : 'ingresso' }}</span>
            </div>
          </div>
          <p v-else class="muted">Aguardando notificacoes...</p>
        </div>
      </div>
    </header>

    <main class="grid">
      <section class="panel">
        <div class="panel-header">
          <h2>Eventos disponiveis</h2>
          <p>Selecione um evento para comprar ingresso.</p>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="loading" class="muted">Carregando...</p>
        <div class="event-list">
          <button
            v-for="(event, index) in events"
            :key="event.id"
            class="event-card"
            :class="{ active: event.id === selectedEventId }"
            :style="{ '--delay': `${index * 80}ms` }"
            @click="selectedEventId = event.id"
          >
            <div>
              <strong>{{ event.name }}</strong>
              <span>{{ event.date }} &bull; {{ event.location }}</span>
            </div>
            <span class="pill">{{ event.id }}</span>
          </button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Comprar ingresso</h2>
          <p>Informe seu nome e selecione o evento.</p>
        </div>
        <div class="form">
          <label>
            Seu nome
            <input
              v-model="attendeeName"
              type="text"
              placeholder="Ex: Maria"
              @blur="fetchMyTickets"
            />
          </label>
          <label>
            Evento
            <select v-model="selectedEventId">
              <option value="" disabled>Escolha um evento</option>
              <option v-for="event in events" :key="event.id" :value="event.id">
                {{ event.name }} ({{ event.id }})
              </option>
            </select>
          </label>
          <button class="primary" @click="buyTicket" :disabled="ticketLoading">
            Comprar ingresso
          </button>
          <p v-if="ticketError" class="error">{{ ticketError }}</p>
          <p v-if="ticketSuccess" class="success">{{ ticketSuccess }}</p>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Meus ingressos</h2>
          <p>{{ attendeeName ? `Ingressos de ${attendeeName}` : 'Informe seu nome' }}</p>
        </div>
        <p v-if="ticketLoading" class="muted">Carregando...</p>
        <div v-if="myTickets.length" class="checkins">
          <div
            v-for="ticket in myTickets"
            :key="ticket.id"
            class="checkin-row"
            :class="statusClass(ticket.status)"
          >
            <div>
              <strong>{{ ticket.eventId }}</strong>
              <span>{{ statusLabel(ticket.status) }}</span>
            </div>
            <span class="pill">{{ ticket.id }}</span>
          </div>
        </div>
        <p v-else class="muted">Nenhum ingresso encontrado.</p>
      </section>

    </main>
  </div>
</template>
