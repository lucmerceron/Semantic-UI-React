import EventPool from './EventPool'

export default class EventTarget {
  /** @private {Map<String,Function>} */
  handlers = new Map()
  /** @private {Map<String,EventPool>} */
  pools = new Map()

  /**
   * @param {HTMLElement} target
   */
  constructor(target) {
    /** @private */
    this.target = target
  }

  /**
   * @param {String} poolName
   * @param {String} eventType
   * @param {Function[]} eventHandlers
   */
  addHandlers(poolName, eventType, eventHandlers, useCapture = false) {
    this.removeTargetHandler(eventType, useCapture)

    if (!this.pools.has(poolName)) {
      this.pools.set(poolName, EventPool.createByType(poolName, eventType, eventHandlers))
    } else {
      this.pools.set(poolName, this.pools.get(poolName).addHandlers(eventType, eventHandlers))
    }

    this.addTargetHandler(eventType, useCapture)
  }

  /**
   * @return {Boolean}
   */
  hasHandlers() {
    return this.handlers.size > 0
  }

  /**
   * @param {String} poolName
   * @param {String} eventType
   * @param {Function[]} eventHandlers
   */
  removeHandlers(poolName, eventType, eventHandlers, useCapture = false) {
    const pool = this.pools.get(poolName)

    if (pool) {
      const newPool = pool.removeHandlers(eventType, eventHandlers)

      if (newPool.hasHandlers()) {
        this.pools.set(poolName, newPool)
      } else {
        this.pools.delete(poolName)
      }

      this.removeTargetHandler(eventType, useCapture)

      if (this.pools.size > 0) this.addTargetHandler(eventType, useCapture)
    }
  }

  /**
   * @private
   * @param {String} eventType
   * @param {Map<String,EventPool>} eventPools
   * @return {Function}
   */
  createEmitter = (eventType, eventPools) => (event) => {
    eventPools.forEach((pool) => {
      pool.dispatchEvent(eventType, event)
    })
  }

  /**
   * @private
   * @param {String} eventType
   */
  addTargetHandler(eventType, useCapture) {
    const handler = this.createEmitter(eventType, this.pools)

    this.handlers.set(eventType, handler)
    this.target.addEventListener(eventType, handler, useCapture)
  }

  /**
   * @private
   * @param {String} eventType
   */
  removeTargetHandler(eventType, useCapture) {
    if (this.handlers.has(eventType)) {
      this.target.removeEventListener(eventType, this.handlers.get(eventType), useCapture)
      this.handlers.delete(eventType)
    }
  }
}
