import { Signal, isDone, endOfTransmission } from './signal'
import {
  InputStream as SyncInputStream,
  OutputStream as SyncOutputStream,
  noop,
  pipe
} from './sync'

type InputStream<T> = (stream: SyncOutputStream<Signal<T>>) => void
type OutputStream<T> = InputStream<T>

type Pipe<A, B> = { input: InputStream<A>; output: SyncOutputStream<B> }
type SymmetricPipe<T> = Pipe<T, T>
type Connection<T> = Pipe<T, void>

type AsyncPipe<A, B> = { input: InputStream<A>; output: OutputStream<B> }
type AsyncSymmetricPipe<T> = AsyncPipe<T, T>
type AsyncConnection<T> = AsyncPipe<T, void>

type Stream<T> = { input: InputStream<T>; output?: SyncOutputStream<void> }

// TODO: make typescript recognize this and discharge proof obligations
const isStream = value =>
  value instanceof Object &&
  value.hasOwnProperty('input') &&
  value.hasOwnProperty('output')

const pure = <T>(value: T): Stream<T> => {
  return {
    input: outStream => {
      outStream(value)
      outStream(endOfTransmission)
    }
  }
}

const never: Stream<void> = { input: () => {} }

const fromSync = <T>(stream: SyncInputStream<T>): Stream<T> => {
  return {
    input: outStream => {
      let value = stream()
      while (!isDone(value)) {
        outStream(value)
        value = stream()
      }
      outStream(endOfTransmission)
    }
  }
}

const fromArray = <T>(array: Array<T>): Stream<T> => {
  return {
    input: outStream => {
      array.forEach(element => outStream(element))
      outStream(endOfTransmission)
    }
  }
}

const map = <A, B>(f: (A) => B) => (stream: Stream<A>): Stream<B> => {
  const { input, output } = stream

  return {
    input: outStream => {
      input(value => {
        if (isDone(value)) outStream(endOfTransmission)
        else outStream(f(value))
      })
    },
    output
  }
}

const filter = <T>(f: (T) => boolean) => (stream: Stream<T>): Stream<T> => {
  const { input, output } = stream

  return {
    input: outStream =>
      input(value => {
        if (isDone(value)) outStream(endOfTransmission)
        else if (f(value)) outStream(value)
      }),
    output
  }
}

const reduce = <A, B>(f: (A, B) => A, init: A) => (
  stream: Stream<B>
): Promise<A> => {
  let acc = init
  const { input, output } = stream

  return new Promise(resolve => {
    input(value => {
      if (isDone(value)) {
        if (output) output()
        resolve(acc)
      } else {
        acc = f(acc, value)
      }
    })
  })
}

const toArray = <T>(stream: Stream<T>): Promise<Array<T>> => {
  let array = []
  const { input, output } = stream

  return new Promise(resolve => {
    input(value => {
      if (isDone(value)) {
        resolve(array)
        if (output) output()
      } else array.push(<never>value)
    })
  })
}

const blabber = <A, B>({ input }: Pipe<A, B>): InputStream<A> => input

const silence = <A, B>({ output }: Pipe<A, B>): SyncOutputStream<B> => output

const silenceAsync = <A, B>({ output }: AsyncPipe<A, B>): OutputStream<B> =>
  output

const interval = (ms: number): Connection<number> => {
  let n = 1
  let intervalId, outStream
  return {
    input: outStream => {
      outStream = outStream
      intervalId = setInterval(() => {
        outStream(n++)
      }, ms)
    },
    output: () => {
      if (intervalId) clearInterval(intervalId)
      if (outStream) outStream(endOfTransmission)
    }
  }
}

const take = <T>(n: number, closeOnEnd: boolean = true) => ({
  input,
  output
}: Stream<T>): Stream<T> => {
  let i = 0
  let done = false

  const newInput = outStream => {
    input(value => {
      if (i < n) {
        outStream(value)
        i++
      } else if (!done) {
        outStream(endOfTransmission)
        if (closeOnEnd && output) output()
        done = true
      }
    })
  }

  return { input: newInput, output: closeOnEnd ? undefined : output }
}

// Waits for the given number of ms before running the stream
// Buffers responses from the given stream which gets flushed once the timeout is done
// Interruptable form of wait
const interruptableWait = <T>(ms: number) => (
  stream: Stream<T>
): Connection<T> => {
  let buffer = []
  let doneWaiting = false
  let outStream
  const { input, output } = stream

  const timeoutId = setTimeout(() => {
    buffer.forEach(value => (outStream ? outStream(value) : null)) // flush
    doneWaiting = true
  }, ms)

  return {
    input: outStream => {
      outStream = outStream
      input(value => {
        if (!doneWaiting) buffer.push(<never>value)
        else outStream(value)
      })
    },
    output: () => {
      clearTimeout(timeoutId)
      buffer.forEach(value => (outStream ? outStream(value) : null)) // flush
      doneWaiting = true
      if (output) output()
    }
  }
}

const wait = <T>(ms: number) => (stream: Stream<T>): Stream<T> => {
  const { output } = stream
  const { input } = interruptableWait<T>(ms)(stream)
  return { input, output }
}

const tap = <T>(stream: Stream<T>): Stream<T> => {
  stream.input(console.log)
  return stream
}

const log = (stream: Stream<any>): void => {
  tap(stream)
}

// Times the given stream out after ms milliseconds
const timeout = <T>(ms: number) => ({
  input,
  output
}: Stream<T>): Stream<T> => {
  let timedOut = false
  let outStream

  setTimeout(() => {
    timedOut = true
    if (outStream) outStream(endOfTransmission)
  }, ms)

  return {
    input: outStream => {
      outStream = outStream
      input(value => {
        if (!timedOut) outStream(value)
      })
    }
  }
}

export {
  InputStream,
  OutputStream,
  Pipe,
  SymmetricPipe,
  Connection,
  AsyncPipe,
  AsyncSymmetricPipe,
  AsyncConnection,
  Stream,
  isStream,
  isDone,
  pipe,
  pure,
  fromSync,
  fromArray,
  map,
  filter,
  reduce,
  toArray,
  blabber,
  silence,
  interval,
  interruptableWait,
  wait,
  tap,
  log,
  take,
  timeout
}
