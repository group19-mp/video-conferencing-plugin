import SimplePeer from "simple-peer"
import { cloneObject } from "../lib/base"
import { Emitter } from "../lib/emitter"
import { Logger } from "../lib/logger"
const log = Logger("app:webrtc-peer")

let ctr = 1

export class WebRTCPeer extends Emitter {
  static isSupported() {
    return SimplePeer.WEBRTC_SUPPORT
  }

  constructor({ remote, local, ...opt } = {}) {
    super()

    this.remote = remote
    this.local = local
    this.initiator = opt.initiator
    this.room = opt.room || ""
    this.id = "webrtc-peer" + ctr++
    this.name = ""

    log("peer", this.id)
    this.setupPeer(opt)
  }

  setupPeer(opt) {
    this.error = null
    this.active = false
    this.stream = null

    let opts = cloneObject({
      ...opt,
      // Allow the peer to receive video, even if it's not sending stream
      offerConstraints: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      },
    })

    log("SimplePeer opts:", opts)
    this.peer = new SimplePeer(opts)

    this.peer.on("close", (_) => this.close())

    // We receive a connection error
    this.peer.on("error", (err) => {
      log(`${this.id} | error`, err)
      this.error = err
      this.emit("error", err)
      this.close()
      setTimeout(() => {
        this.setupPeer(opt) // ???
      }, 1000)
    })

    // This means, we received network details (signal) we need to provide
    // the remote peer, so he can set up a connection to us. Usually we will
    // send this over a separate channel like the web socket signaling server
    this.peer.on("signal", (data) => {
      this.emit("signal", data)
    })

    this.peer.on("signalingStateChange", async (_) => {

    })

    // We received data from the peer
    this.peer.on("data", (data) => {
      log(`${this.id} | data`, data)
      this.emit("data", data)
      this.emit("message", { data }) // Channel compat
    })

    // Connection succeeded
    this.peer.on("connect", (event) => {
      log(`${this.id} | connect`, event)
      this.active = true
      this.emit("connect", event)
    })

    this.peer.on("stream", (stream) => {
      log("new stream", stream)
      this.stream = stream
      this.emit("stream", stream)
    })
  }

  setStream(stream) {
    if (!this.peer.streams.includes(stream)) {
      try {
        this.peer.streams.forEach((s) => {
          try {
            this.peer.removeStream(s)
          } catch (err) {
          }
        })
      } catch (err) {
      }
      if (stream) {
        try {
          this.peer.addStream(stream)
        } catch (err) {
        }
      }
    }
  }

  // We got a signal from the remote peer and will use it now to establish the connection
  signal(data) {
    if (this.peer && !this.peer.destroyed) {
      this.peer.signal(data)
    } else {
      log("Tried to set signal on destroyed peer", this.peer, data)
    }
  }

  postMessage(data) {
    this.peer.send(data)
  }

  close() {
    this.emit("close")
    this.active = false
    this.peer?.destroy()
  }
}
