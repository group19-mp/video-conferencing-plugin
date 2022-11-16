import { ICE_CONFIG } from "../config"
import { urlBase64ToUint8Array } from "../lib/base64"
import { messages } from "../lib/emitter"
import { Logger } from "../lib/logger"
const log = Logger("app:connection")

export async function setupWebRTC(state) {
  let { WebRTC } = await import("./webrtc")

  if (!WebRTC.isSupported()) return null

  let config = ICE_CONFIG

  const webrtc = new WebRTC({
    room: state.room,
    peerSettings: {
      trickle: true,
      config,
    },
  })

  webrtc.on("status", (info) => {
    state.status = info.status
  })

  webrtc.on("connected", ({ peer }) => {
    log("connected", peer)
    if (state.stream) {
      peer.setStream(state.stream)
    }
    messages.emit("requestUserInfo")
  })

  // Getting Client's Info with Local Peer Info
  webrtc.on("userInfoWithPeer", ({ peer, data }) => {
    webrtc.send("userInfoUpdate", { peer, data })
  })

  // Listening to Remote Client's Info with its Local Peer Info and
  // emitting to Local Client
  webrtc.on("userInfoUpdate", ({ peer, data }) => {
    messages.emit("userInfoUpdate", { peer, data })
  })

  // Listening to new messages from Remote Client and emitting to Local client
  webrtc.on("chatMessage", (info) => {
    messages.emit("newMessage", info)
  })

  let onSetLocalStream = messages.on("setLocalStream", (stream) => {
    webrtc.forEachPeer((peer) => {
      peer.setStream(stream)
    })
  })

  let onNegotiateBandwidth = messages.on("negotiateBandwidth", (stream) => {
    webrtc.forEachPeer((peer) => {
      peer.peer.negotiate()
    })
  })

  // Send a new message to all peers
  messages.on("chatMessage", ({ name, message, time }) => {
    webrtc.send("chatMessage", { name, message, time })
  })

  // Listen to local userInfo and emit to webrtc for getting peer info
  messages.on("userInfo", (data) => {
    webrtc.emit("userInfo", { data })
  })

  let onSubscribePush = messages.on("subscribePush", async (on) => {
    let add = state.subscription
    let registration = await navigator.serviceWorker.getRegistration()
    let subscription = await registration.pushManager.getSubscription()
    const vapidPublicKey = state.vapidPublicKey
    if (!subscription && vapidPublicKey) {
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
      subscription = registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })
    }
    webrtc.io.emit("registerPush", {
      add,
      room: state.room,
      subscription,
    })
  })

  return {
    webrtc,
    cleanup() {
      webrtc.cleanup()
      onSetLocalStream.cleanup()
      onNegotiateBandwidth.cleanup()
      onSubscribePush.cleanup()
    },
  }
}
