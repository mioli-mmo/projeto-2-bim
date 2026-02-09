<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGateway } from '../composables/useGateway'

const {
  baseUrl,
  events,
  allCheckins,
  notifications,
  tcpUdpLogs,
  wsStatus,
  wsError,
  loadEvents,
  loadAllCheckins,
  createEvent,
  updateCheckinStatus,
  validateEntry,
  getLegacyEvent
} = useGateway()

const loading = ref(false)
const error = ref('')
const newEventName = ref('')
const newEventDate = ref('')
const newEventLocation = ref('')
const eventLoading = ref(false)
const eventError = ref('')
const eventSuccess = ref('')
const entryCheckinId = ref('')
const entryResult = ref(null)
const entryLoading = ref(false)
const entryError = ref('')
const legacyEvent = ref(null)
const legacyLoading = ref(false)
const legacyError = ref('')
const selectedEventId = ref('')
const actionLoading = ref({})

const pendingCheckins = computed(() =>
  allCheckins.value.filter((c) => c.status === 'pending')
)

const processedCheckins = computed(() =>
  allCheckins.value.filter((c) => c.status !== 'pending')
)

const adminNotifications = computed(() =>
  notifications.value.filter(
    (n) =>
      n.type === 'ticket_purchased' ||
      n.type === 'checkin_updated' ||
      n.type === 'event_created'
  )
)

const fetchData = async () => {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([loadEvents(), loadAllCheckins()])
    if (!selectedEventId.value && events.value.length) {
      selectedEventId.value = events.value[0].id
      if (!grpcEventId.value) {
        grpcEventId.value = selectedEventId.value
      }
    }
  } catch (err) {
    error.value = 'Erro ao carregar dados.'
  } finally {
    loading.value = false
  }
}

const submitEvent = async () => {
  if (!newEventName.value.trim() || !newEventDate.value || !newEventLocation.value.trim()) {
    eventError.value = 'Preencha todos os campos.'
    return
  }
  eventLoading.value = true
  eventError.value = ''
  eventSuccess.value = ''
  try {
    const ev = await createEvent({
      name: newEventName.value.trim(),
      date: newEventDate.value,
      location: newEventLocation.value.trim()
    })
    eventSuccess.value = `Evento ${ev.id} criado!`
    newEventName.value = ''
    newEventDate.value = ''
    newEventLocation.value = ''
  } catch (err) {
    eventError.value = 'Falha ao criar evento.'
  } finally {
    eventLoading.value = false
  }
}

const approveCheckin = async (checkinId) => {
  actionLoading.value[checkinId] = true
  try {
    await updateCheckinStatus(checkinId, 'approved')
  } catch (err) {
    // handled via WS notification
  } finally {
    actionLoading.value[checkinId] = false
  }
}

const rejectCheckin = async (checkinId) => {
  actionLoading.value[checkinId] = true
  try {
    await updateCheckinStatus(checkinId, 'rejected')
  } catch (err) {
    // handled via WS notification
  } finally {
    actionLoading.value[checkinId] = false
  }
}

const runValidateEntry = async () => {
  if (!entryCheckinId.value.trim()) {
    entryError.value = 'Selecione um ingresso.'
    return
  }
  entryLoading.value = true
  entryError.value = ''
  entryResult.value = null
  try {
    entryResult.value = await validateEntry(entryCheckinId.value.trim())
  } catch (err) {
    if (err.status === 404) {
      entryError.value = 'Ingresso nao encontrado.'
    } else {
      entryError.value = 'Falha ao validar entrada via gRPC.'
    }
  } finally {
    entryLoading.value = false
  }
}

const loadLegacy = async () => {
  if (!selectedEventId.value) return
  legacyLoading.value = true
  legacyError.value = ''
  try {
    legacyEvent.value = await getLegacyEvent(selectedEventId.value)
  } catch (err) {
    legacyError.value = 'Falha ao consultar SOAP.'
  } finally {
    legacyLoading.value = false
  }
}

const statusLabel = (status) => {
  const labels = { pending: 'Pendente', approved: 'Aprovado', rejected: 'Recusado' }
  return labels[status] || status
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="hero-text">
        <p class="kicker">Area do Administrador</p>
        <h1>Gestao de Eventos</h1>
        <p class="subtitle">
          Crie eventos, aprove ingressos e monitore telemetria.
        </p>
        <div class="hero-actions">
          <button class="primary" @click="fetchData" :disabled="loading">
            Recarregar dados
          </button>
          <router-link to="/cliente" class="ghost">Ir para Cliente</router-link>
        </div>
        <p class="ws-status">
          WebSocket: {{ wsStatus }}
          <span v-if="wsError">({{ wsError }})</span>
        </p>
      </div>
      <div class="hero-card notifications-card">
        <p class="label">Notificacoes</p>
        <div class="notifications-scroll">
          <div v-if="adminNotifications.length" class="alerts-compact">
            <div v-for="n in adminNotifications" :key="n.id" class="alert-row-compact">
              <div>
                <strong>{{ n.message }}</strong>
                <span>{{ new Date(n.time).toLocaleString() }}</span>
              </div>
              <span class="pill" :class="n.type">
                {{ n.type === 'ticket_purchased' ? 'ingresso' : n.type === 'event_created' ? 'evento' : 'checkin' }}
              </span>
            </div>
          </div>
          <p v-else class="muted">Aguardando notificacoes...</p>
        </div>
      </div>
    </header>

    <main class="grid">
      <section class="panel">
        <div class="panel-header">
          <h2>Eventos</h2>
          <p>Lista de eventos cadastrados.</p>
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
            @click="selectedEventId = event.id; grpcEventId = event.id"
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
          <h2>Criar evento</h2>
          <p>Preencha os dados do novo evento.</p>
        </div>
        <div class="form">
          <label>
            Nome
            <input v-model="newEventName" type="text" placeholder="Ex: Workshop Vue" />
          </label>
          <label>
            Data
            <input v-model="newEventDate" type="date" />
          </label>
          <label>
            Local
            <input v-model="newEventLocation" type="text" placeholder="Ex: Sala 101" />
          </label>
          <button class="primary" @click="submitEvent" :disabled="eventLoading">
            Criar evento
          </button>
          <p v-if="eventError" class="error">{{ eventError }}</p>
          <p v-if="eventSuccess" class="success">{{ eventSuccess }}</p>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Ingressos pendentes</h2>
          <p>Aprove ou recuse os ingressos.</p>
        </div>
        <div v-if="pendingCheckins.length" class="checkins">
          <div v-for="checkin in pendingCheckins" :key="checkin.id" class="checkin-row pending-row">
            <div>
              <strong>{{ checkin.attendeeName }}</strong>
              <span>{{ checkin.eventId }} &bull; {{ new Date(checkin.timestamp).toLocaleString() }}</span>
            </div>
            <div class="actions">
              <button
                class="approve-btn"
                :disabled="actionLoading[checkin.id]"
                @click="approveCheckin(checkin.id)"
              >
                Aprovar
              </button>
              <button
                class="reject-btn"
                :disabled="actionLoading[checkin.id]"
                @click="rejectCheckin(checkin.id)"
              >
                Recusar
              </button>
            </div>
          </div>
        </div>
        <p v-else class="muted">Nenhum ingresso pendente.</p>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Ingressos processados</h2>
          <p>Historico de aprovacoes e recusas.</p>
        </div>
        <div v-if="processedCheckins.length" class="checkins">
          <div
            v-for="checkin in processedCheckins"
            :key="checkin.id"
            class="checkin-row"
            :class="`status-${checkin.status}`"
          >
            <div>
              <strong>{{ checkin.attendeeName }}</strong>
              <span>{{ checkin.eventId }} &bull; {{ statusLabel(checkin.status) }}</span>
            </div>
            <span class="pill">{{ checkin.id }}</span>
          </div>
        </div>
        <p v-else class="muted">Nenhum ingresso processado.</p>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Validar entrada (gRPC)</h2>
          <p>Simula portaria validando ingresso no evento.</p>
        </div>
        <div class="form">
          <label>
            Ingresso
            <select v-model="entryCheckinId">
              <option value="" disabled>Selecione um ingresso</option>
              <option
                v-for="checkin in allCheckins"
                :key="checkin.id"
                :value="checkin.id"
              >
                {{ checkin.attendeeName }} - {{ checkin.eventId }} ({{ checkin.id }}) [{{ statusLabel(checkin.status) }}]
              </option>
            </select>
          </label>
          <button class="primary" @click="runValidateEntry" :disabled="entryLoading">
            Validar entrada
          </button>
          <p v-if="entryError" class="error">{{ entryError }}</p>
          <div v-if="entryResult" class="grpc-result" :class="{ 'entry-denied': !entryResult.allowed }">
            <strong>{{ entryResult.message }}</strong>
            <span>{{ entryResult.reason }}</span>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Telemetria TCP/UDP</h2>
          <p>Mensagens recebidas via sockets.</p>
        </div>
        <div v-if="tcpUdpLogs.length" class="telemetry">
          <div v-for="entry in tcpUdpLogs" :key="entry.id" class="telemetry-row">
            <div>
              <strong>{{ entry.protocol.toUpperCase() }} &bull; {{ entry.message }}</strong>
              <span>{{ entry.source }} &bull; {{ new Date(entry.time).toLocaleString() }}</span>
            </div>
            <span class="pill">telemetria</span>
          </div>
        </div>
        <p v-else class="muted">Aguardando telemetria...</p>
      </section>

    </main>
  </div>
</template>
