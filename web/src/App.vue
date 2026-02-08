<script setup>
import { computed, onMounted, ref } from 'vue'

const baseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4000'

const events = ref([])
const checkins = ref([])
const selectedEventId = ref('')
const attendeeName = ref('')
const legacyEvent = ref(null)

const loading = ref(false)
const error = ref('')
const checkinsLoading = ref(false)
const checkinsError = ref('')
const legacyLoading = ref(false)
const legacyError = ref('')

const selectedEvent = computed(() =>
  events.value.find((item) => item.id === selectedEventId.value)
)

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`request_failed_${response.status}`)
  }
  return response.json()
}

const loadEvents = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await requestJson(`${baseUrl}/api/events`)
    events.value = data.items || []
    if (!selectedEventId.value && events.value.length) {
      selectedEventId.value = events.value[0].id
      await loadCheckins(selectedEventId.value)
    }
  } catch (err) {
    error.value = 'Nao foi possivel carregar eventos.'
  } finally {
    loading.value = false
  }
}

const loadCheckins = async (eventId) => {
  if (!eventId) return
  checkinsLoading.value = true
  checkinsError.value = ''
  try {
    const data = await requestJson(
      `${baseUrl}/api/checkins?eventId=${encodeURIComponent(eventId)}`
    )
    checkins.value = data.items || []
  } catch (err) {
    checkinsError.value = 'Nao foi possivel carregar check-ins.'
  } finally {
    checkinsLoading.value = false
  }
}

const submitCheckin = async () => {
  if (!selectedEventId.value || !attendeeName.value.trim()) {
    checkinsError.value = 'Preencha o nome e escolha um evento.'
    return
  }
  checkinsLoading.value = true
  checkinsError.value = ''
  try {
    await requestJson(`${baseUrl}/api/checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId: selectedEventId.value,
        attendeeName: attendeeName.value.trim()
      })
    })
    attendeeName.value = ''
    await loadCheckins(selectedEventId.value)
  } catch (err) {
    checkinsError.value = 'Falha ao registrar check-in.'
  } finally {
    checkinsLoading.value = false
  }
}

const loadLegacy = async () => {
  if (!selectedEventId.value) return
  legacyLoading.value = true
  legacyError.value = ''
  try {
    const data = await requestJson(
      `${baseUrl}/api/legacy/events/${encodeURIComponent(selectedEventId.value)}`
    )
    legacyEvent.value = data.GetEventLegacyResult || data
  } catch (err) {
    legacyError.value = 'Falha ao consultar SOAP.'
  } finally {
    legacyLoading.value = false
  }
}

onMounted(loadEvents)
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="hero-text">
        <p class="kicker">Gateway de Eventos</p>
        <h1>Check-in ao vivo com REST e SOAP</h1>
        <p class="subtitle">
          Cliente Vue consumindo o Gateway com HATEOAS para listar eventos e
          registrar check-ins.
        </p>
        <div class="hero-actions">
          <button class="primary" @click="loadEvents" :disabled="loading">
            Recarregar eventos
          </button>
          <span class="status">Gateway: {{ baseUrl }}</span>
        </div>
      </div>
      <div class="hero-card">
        <p class="label">Resumo rapido</p>
        <div class="metric">
          <span>{{ events.length }}</span>
          <small>eventos ativos</small>
        </div>
        <div class="metric">
          <span>{{ checkins.length }}</span>
          <small>check-ins do evento</small>
        </div>
        <button class="ghost" @click="loadLegacy" :disabled="legacyLoading">
          Consultar legado SOAP
        </button>
        <p v-if="legacyError" class="error">{{ legacyError }}</p>
        <div v-if="legacyEvent" class="legacy">
          <p class="label">Evento legado</p>
          <strong>{{ legacyEvent.name }}</strong>
          <span>{{ legacyEvent.date }} • {{ legacyEvent.location }}</span>
        </div>
      </div>
    </header>

    <main class="grid">
      <section class="panel">
        <div class="panel-header">
          <h2>Eventos</h2>
          <p>Selecione um evento e veja seus check-ins.</p>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="loading" class="muted">Carregando eventos...</p>
        <div class="event-list">
          <button
            v-for="(event, index) in events"
            :key="event.id"
            class="event-card"
            :class="{ active: event.id === selectedEventId }"
            :style="{ '--delay': `${index * 80}ms` }"
            @click="selectedEventId = event.id; loadCheckins(event.id)"
          >
            <div>
              <strong>{{ event.name }}</strong>
              <span>{{ event.date }} • {{ event.location }}</span>
            </div>
            <span class="pill">{{ event.id }}</span>
          </button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Registrar check-in</h2>
          <p>Informe o participante para o evento selecionado.</p>
        </div>
        <div class="form">
          <label>
            Evento
            <select v-model="selectedEventId" @change="loadCheckins(selectedEventId)">
              <option value="" disabled>Escolha um evento</option>
              <option v-for="event in events" :key="event.id" :value="event.id">
                {{ event.name }} ({{ event.id }})
              </option>
            </select>
          </label>
          <label>
            Nome do participante
            <input v-model="attendeeName" type="text" placeholder="Ex: Ana" />
          </label>
          <button class="primary" @click="submitCheckin" :disabled="checkinsLoading">
            Registrar check-in
          </button>
          <p v-if="checkinsError" class="error">{{ checkinsError }}</p>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Check-ins recentes</h2>
          <p>{{ selectedEvent ? selectedEvent.name : 'Sem evento selecionado' }}</p>
        </div>
        <p v-if="checkinsLoading" class="muted">Atualizando...</p>
        <div v-if="checkins.length" class="checkins">
          <div v-for="checkin in checkins" :key="checkin.id" class="checkin-row">
            <div>
              <strong>{{ checkin.attendeeName }}</strong>
              <span>{{ new Date(checkin.timestamp).toLocaleString() }}</span>
            </div>
            <span class="pill">{{ checkin.id }}</span>
          </div>
        </div>
        <p v-else class="muted">Nenhum check-in para este evento.</p>
      </section>
    </main>
  </div>
</template>
