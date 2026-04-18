export function createProcessingQueue({ tag }) {
  let processingChain = Promise.resolve();

  // Ensures jobs are processed sequentially in arrival order.
  function enqueue(job) {
    processingChain = processingChain
      .then(() => job())
      .catch((err) => {
        console.error(`${tag} processing error: ${err.message}`);
      });

    return processingChain;
  }

  function waitForDrained() {
    return processingChain;
  }

  return {
    enqueue,
    waitForDrained,
  };
}
