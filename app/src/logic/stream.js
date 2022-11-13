import { Logger } from "../lib/logger"
const log = Logger("app:stream")

export async function getDevices() {
  try {
    return navigator.mediaDevices.enumerateDevices()
  } catch (err) {
  }
  return []
}

export let bandwidthVideoConstraints = {
}

export let defaultVideoConstraints = {
}

export let defaultAudioConstraints = {
}

function __getUserMedia(constraints) {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints)
  }
  const _getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia
  return new Promise((resolve, reject) => {
    if (!_getUserMedia) {
      reject(
        new Error(
          "Video and audio cannot be accessed. Please try again with another browser or check your browser's settings."
        )
      )
    } else {
      _getUserMedia.call(navigator, constraints, resolve, reject)
    }
  })
}

export async function getUserMedia(
  constraints = {
    audio: {
      ...defaultAudioConstraints,
    },
    video: {
      ...defaultVideoConstraints,
      facingMode: "user",
    },
  }
) {
  try {
    log("getUserMedia constraints", constraints)
    let stream = await __getUserMedia(constraints)
    return { stream }
  } catch (err) {
    const name = err?.name || err?.toString()
    if (name === "NotAllowedError") {
      return {
        error:
          "You denied access to your camera and microphone. Please check your setup.",
      }
    } else if (name === "NotFoundError") {
      return {
        error: "No camera or microphone has been found!",
      }
    }
    return {
      error: err?.message || err?.name || err.toString(),
    }
  }
}

export async function getDisplayMedia(
  constraints = {
    video: {
      cursor: "always",
    },
  }
) {
  try {
    if (!navigator?.mediaDevices?.getDisplayMedia) {
      return {
        error: "Accessing the desktop is not available.",
      }
    }
    log("getDisplayMedia constraints", constraints)
    let stream = await navigator.mediaDevices.getDisplayMedia(constraints)
    return { stream }
  } catch (err) {
    const name = err?.name || err?.toString()
    if (name === "NotAllowedError") {
      return {
        error:
          "You denied access to your camera and microphone. Please check your setup.",
      }
    } else if (name === "NotFoundError") {
      return {
        error: "No camera or microphone has been found!",
      }
    }
    return {
      error: err?.message || err?.name || err.toString(),
    }
  }
}

export function setAudioTracks(stream, audioTracks) {
  Array.from(stream.getAudioTracks()).forEach((t) => stream.removeTrack(t))
  audioTracks.forEach((t) => {
    try {
      stream.addTrack(t)
    } catch (err) {
    }
  })
  return stream
}
