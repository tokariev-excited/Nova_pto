const CHANNEL_NAME = "nova-auth"

export function broadcastAuthComplete(): void {
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME)
    ch.postMessage({ type: "AUTH_COMPLETE" })
    ch.close()
  } catch {
    // BroadcastChannel not supported — graceful degradation
  }
}

export function onAuthComplete(callback: () => void): () => void {
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME)
    ch.onmessage = (event) => {
      if (event.data?.type === "AUTH_COMPLETE") {
        callback()
      }
    }
    return () => ch.close()
  } catch {
    return () => {}
  }
}
