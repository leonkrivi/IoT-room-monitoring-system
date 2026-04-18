export class SeqOrderingManager {
  constructor({ maxBufferSize = 3, flushWindowMs = 1000 } = {}) {
    this.maxBufferSize = maxBufferSize; // first flush trigger
    this.flushWindowMs = flushWindowMs; // second flush trigger
    this.deviceReadings = new Map(); // roomId::deviceId -> { lastDrainedSeq, buffer: Map(seq -> message), firstBufferedAt }
  }

  // keep ingesting until
  // - a gap is hit (next seq is not in buffer)
  // - or we hit the max buffer size / flush window => then flush all buffered messages even if there are gaps
  ingest(incoming, nowMs = Date.now()) {
    const device = this.#getDevice(incoming.roomId, incoming.deviceId);

    // incoming seq is stale or duplicate
    if (device.buffer.has(incoming.seq)) {
      return {
        accepted: false,
        droppedReason: "duplicate_seq_in_buffer",
        readyEvents: [],
      };
    }
    if (
      device.lastDrainedSeq !== null &&
      incoming.seq <= device.lastDrainedSeq
    ) {
      return {
        accepted: false,
        droppedReason: "stale_seq",
        readyEvents: [],
      };
    }

    device.buffer.set(incoming.seq, incoming); // add to buffer
    device.firstBufferedAt ??= nowMs; // if null or undefined, set to nowMs

    const readyEvents = this.#drainContiguous(device); // prepare contiguous messages starting from last drained seq

    const reachedFlushWindow =
      device.firstBufferedAt !== null &&
      nowMs - device.firstBufferedAt >= this.flushWindowMs;
    const reachedFlushSize = device.buffer.size >= this.maxBufferSize;

    if (reachedFlushWindow || reachedFlushSize) {
      readyEvents.push(...this.#drainAllSorted(device)); // prepare all buffered messages sorted by seq, even if there are gaps
    }

    this.#resetBufferedAtIfEmpty(device); // if buffer is empty after draining, reset firstBufferedAt

    return {
      accepted: true,
      droppedReason: null,
      readyEvents,
    };
  }

  // flush expired messages for all devices (called on demand outside of ingest)
  // basically this is only the drain portion of the ingest method
  // prevents messages from being stuck in the buffer indefinitely if no new messages are coming in
  // (ie. ingest is not called, so flush triggers are not evaluated)
  flushExpired(nowMs = Date.now()) {
    const readyEvents = [];

    for (const device of this.deviceReadings.values()) {
      const expired =
        device.firstBufferedAt !== null &&
        nowMs - device.firstBufferedAt >= this.flushWindowMs;

      if (!expired) continue;

      readyEvents.push(...this.#drainContiguous(device));
      readyEvents.push(...this.#drainAllSorted(device));
      this.#resetBufferedAtIfEmpty(device);
    }

    return readyEvents;
  }

  resetDeviceState(roomId, deviceId, stateSeq) {
    const device = this.#getDevice(roomId, deviceId);

    device.lastDrainedSeq = stateSeq;
    device.buffer.clear();
    device.firstBufferedAt = null;
  }

  #getDevice(roomId, deviceId) {
    const key = `${roomId}::${deviceId}`;

    if (!this.deviceReadings.has(key)) {
      this.deviceReadings.set(key, {
        lastDrainedSeq: null,
        buffer: new Map(),
        firstBufferedAt: null,
      });
    }

    return this.deviceReadings.get(key);
  }

  // to prevent gaps, only drain messages that are contiguous to the last drained seq.
  #drainContiguous(device) {
    if (device.lastDrainedSeq === null) return [];

    const readyEvents = [];
    let nextSeq = device.lastDrainedSeq + 1;

    // iterate over buffered messages, until there is a gap (missing seq)
    while (device.buffer.has(nextSeq)) {
      const nextEvent = device.buffer.get(nextSeq);
      device.buffer.delete(nextSeq);
      device.lastDrainedSeq = nextSeq;
      readyEvents.push(nextEvent);
      nextSeq = device.lastDrainedSeq + 1;
    }

    return readyEvents;
  }

  // drain all buffered messages sorted by seq, regardless of gaps
  // used when flush conditions are met (force flush)
  #drainAllSorted(device) {
    if (device.buffer.size === 0) return [];

    const readyEvents = [];
    const sortedSeqs = Array.from(device.buffer.keys()).sort((a, b) => a - b); // sort seqs in ascending order

    for (const seq of sortedSeqs) {
      // delete and skip old messages that are already drained (can happen if there are gaps and we are force flushing)
      if (device.lastDrainedSeq !== null && seq <= device.lastDrainedSeq) {
        device.buffer.delete(seq);
        continue;
      }
      const event = device.buffer.get(seq);
      device.buffer.delete(seq);
      device.lastDrainedSeq = seq;
      readyEvents.push(event);
    }

    return readyEvents;
  }

  #resetBufferedAtIfEmpty(device) {
    if (device.buffer.size === 0) {
      device.firstBufferedAt = null;
    }
  }
}
