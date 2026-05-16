export function createLastSeqTracker() {
  const lastSeqByKey = new Map();

  function isStale(key, seq) {
    const lastSeq = lastSeqByKey.get(key);
    return lastSeq !== undefined && seq <= lastSeq;
  }

  function remember(key, seq) {
    lastSeqByKey.set(key, seq);
  }

  function resetToBefore(key, seq) {
    lastSeqByKey.set(key, seq - 1);
  }

  return {
    isStale,
    remember,
    resetToBefore,
  };
}
