const queue: any[] = []
const resolvedPromise = Promise.resolve()
let currentFlushPromise
let isFlushing = false

export function nextTick(fn) {
  const p = currentFlushPromise || resolvedPromise
  return fn ? p.then(fn) : p
}

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  queueFlush()
}

function queueFlush() {
  if (!isFlushing) {
    isFlushing = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

function flushJobs() {
  isFlushing = false
  const q = queue.slice(0)
  let job
  while ((job = q.shift())) {
    job && job()
  }
  queue.length = 0
  q.length = 0
}
