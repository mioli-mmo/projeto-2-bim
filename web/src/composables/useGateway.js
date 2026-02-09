import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const baseUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:4000'

const events = ref([])
const allCheckins = ref([])
const wsStatus = ref('desconectado')
const wsError = ref('')
const notifications = ref([])
const tcpUdpLogs = ref([])

let wsClient = null
let wsInitialized = false

const wsUrl = computed(() => {
  return baseUrl.replace(/^http/, 'ws') + '/ws/checkins'
})

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options)
  if (!response.ok) {
    const error = new Error(`request_failed_${response.status}`)
    error.status = response.status
    throw error
  }
  return response.json()
}

const loadEvents = async () => {
  const data = await requestJson(`${baseUrl}/api/events`)
  events.value = data.items || []
  return events.value
}

const loadCheckins = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.eventId) params.set('eventId', filters.eventId)
  if (filters.status) params.set('status', filters.status)
  const query = params.toString() ? `?${params.toString()}` : ''
  const data = await requestJson(`${baseUrl}/api/checkins${query}`)
  return data.items || []
}

const loadAllCheckins = async () => {
  allCheckins.value = await loadCheckins()
  return allCheckins.value
}

const createEvent = async (eventData) => {
  return await requestJson(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  })
}

const purchaseTicket = async (eventId, attendeeName) => {
  return await requestJson(`${baseUrl}/api/checkins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, attendeeName })
  })
}

const updateCheckinStatus = async (checkinId, status) => {
  return await requestJson(`${baseUrl}/api/checkins/${checkinId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
}

const validateEntry = async (checkinId) => {
  return await requestJson(`${baseUrl}/api/entry/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkinId })
  })
}

const getLegacyEvent = async (eventId) => {
  const data = await requestJson(`${baseUrl}/api/legacy/events/${encodeURIComponent(eventId)}`)
  return data.GetEventLegacyResult || data
}

const addNotification = (type, message, data = {}) => {
  const notification = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    data,
    time: new Date().toISOString()
  }
  notifications.value = [notification, ...notifications.value].slice(0, 20)
  return notification
}

const connectWebSocket = () => {
  if (wsClient && wsClient.readyState !== WebSocket.CLOSED) return

  wsError.value = ''
  wsStatus.value = 'conectando'
  wsClient = new WebSocket(wsUrl.value)

  wsClient.onopen = () => {
    wsStatus.value = 'conectado'
  }

  wsClient.onclose = () => {
    wsStatus.value = 'desconectado'
    setTimeout(() => {
      if (wsInitialized) connectWebSocket()
    }, 3000)
  }

  wsClient.onerror = () => {
    wsError.value = 'Falha na conexao WebSocket.'
  }

  wsClient.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data)
      handleWsMessage(payload)
    } catch (err) {
      wsError.value = 'Mensagem WebSocket invalida.'
    }
  }
}

const handleWsMessage = (payload) => {
  switch (payload.type) {
    case 'ticket_purchased':
      if (payload.data) {
        addNotification(
          'ticket_purchased',
          `Novo ingresso: ${payload.data.attendeeName} para ${payload.data.eventId}`,
          payload.data
        )
        allCheckins.value = [payload.data, ...allCheckins.value]
      }
      break

    case 'checkin_updated':
      if (payload.data) {
        const statusText = payload.data.status === 'approved' ? 'aprovado' : 'recusado'
        addNotification(
          'checkin_updated',
          `Ingresso ${statusText}: ${payload.data.attendeeName}`,
          payload.data
        )
        const idx = allCheckins.value.findIndex((c) => c.id === payload.data.id)
        if (idx !== -1) {
          allCheckins.value[idx] = payload.data
        }
      }
      break

    case 'event_created':
      if (payload.data) {
        addNotification(
          'event_created',
          `Evento criado: ${payload.data.name}`,
          payload.data
        )
        events.value = [payload.data, ...events.value]
      }
      break

    case 'tcp_udp':
      if (payload.data) {
        const entry = {
          id: `${payload.data.protocol}-${payload.data.timestamp}`,
          message: payload.data.payload,
          protocol: payload.data.protocol,
          source: payload.data.source,
          time: payload.data.timestamp
        }
        tcpUdpLogs.value = [entry, ...tcpUdpLogs.value].slice(0, 10)
      }
      break

    default:
      break
  }
}

const disconnectWebSocket = () => {
  wsInitialized = false
  if (wsClient) {
    wsClient.close()
    wsClient = null
  }
}

export function useGateway() {
  onMounted(() => {
    if (!wsInitialized) {
      wsInitialized = true
      connectWebSocket()
    }
  })

  onBeforeUnmount(() => {
    // Keep connection alive across route changes
  })

  return {
    baseUrl,
    events,
    allCheckins,
    notifications,
    tcpUdpLogs,
    wsStatus,
    wsError,
    loadEvents,
    loadCheckins,
    loadAllCheckins,
    createEvent,
    purchaseTicket,
    updateCheckinStatus,
    validateEntry,
    getLegacyEvent,
    addNotification,
    connectWebSocket,
    disconnectWebSocket
  }
}
