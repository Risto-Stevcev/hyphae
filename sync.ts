import { Signal, endOfTransmission, isDone } from './signal'

type InputStream<T> = () => Signal<T>
type OutputStream<T> = (value?: Signal<T>) => void

type Pipe<A, B> = { input: InputStream<A>; output: OutputStream<B> }
type SymmetricPipe<T> = Pipe<T, T>
type Connection<T> = Pipe<T, void>

const nothing: InputStream<void> = () => {}
const blackhole: OutputStream<any> = nothing
const noop: OutputStream<void> = blackhole

const pipe = (...functions) => {
  let result = functions[0]
  for (let i = 1, n = functions.length; i < n; i++)
    result = functions[i](result)
  return result
}

const connect = <T>(input: InputStream<T>, output: OutputStream<T>) => {
  let value = input()
  while (!isDone(value)) {
    output(value)
    value = input()
  }
}

const pure = <T>(value: T): InputStream<T> => {
  let sent = false
  return () => {
    if (!sent) {
      sent = true
      return value
    } else return endOfTransmission
  }
}

const empty: InputStream<any> = () => endOfTransmission

const lift = <T>(input: InputStream<T>): Connection<T> => {
  return { input, output: blackhole }
}

const fromArray = <T>(array: Array<T>): InputStream<T> => {
  let i = 0

  return () => {
    if (i < array.length) {
      let value = array[i]
      i++
      return value
    } else return endOfTransmission
  }
}

const map = <A, B>(f: (A) => B) => (stream: InputStream<A>): InputStream<B> => {
  return () => {
    let value = stream()
    if (!isDone(value)) {
      return f(value)
    } else return endOfTransmission
  }
}

const filter = <T>(f: (T) => boolean) => (
  stream: InputStream<T>
): InputStream<T> => {
  return () => {
    let value = stream()
    while (!isDone(value) && !f(value)) value = stream()
    return value
  }
}

const toArray = <T>(stream: InputStream<T>): Array<T> => {
  let arr = []
  let value = stream()
  while (!isDone(value)) {
    arr.push(<never>value)
    value = stream()
  }
  return arr
}

const blabber = <A, B>({ input }: Pipe<A, B>): InputStream<A> => input

const silence = <A, B>({ output }: Pipe<A, B>): OutputStream<B> => output

// TODO: take, skip, reduce, concat, flatten, toArray

export {
  InputStream,
  OutputStream,
  Pipe,
  SymmetricPipe,
  Connection,
  nothing,
  blackhole,
  noop,
  pipe,
  connect,
  pure,
  empty,
  fromArray,
  map,
  filter,
  toArray,
  blabber,
  silence
}
