import { Logger } from "./logger"
const log = Logger("test:assert")


export function assert(cond, ...args) {
  if (!cond) {
    if (typeof console !== undefined) {
      if (console.assert) {
        console.assert(cond, ...args)
      } else {
        console.error(`Assert did fail with: ${cond}`, ...args)
      }
    }
    try {
      if (typeof expect !== undefined) {
        expect(cond).toBeTruthy()
      }
    } catch (err) {
      console.warn("assert err", err)
    }
  }
}

export function assert_equal(value, expected, ...args) {
  if (value !== expected) {
    assert(false, `Expected ${expected} got ${value}`, ...args)
  } else {
    log(`Passed equal check with value ${value}`, ...args)
  }
}
