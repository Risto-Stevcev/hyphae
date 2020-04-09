import { Signal, isDone } from './signal';
import { InputStream as SyncInputStream, OutputStream as SyncOutputStream, pipe } from './sync';
declare type InputStream<T> = (stream: SyncOutputStream<Signal<T>>) => void;
declare type OutputStream<T> = InputStream<T>;
declare type Pipe<A, B> = {
    input: InputStream<A>;
    output: SyncOutputStream<B>;
};
declare type SymmetricPipe<T> = Pipe<T, T>;
declare type Connection<T> = Pipe<T, void>;
declare type AsyncPipe<A, B> = {
    input: InputStream<A>;
    output: OutputStream<B>;
};
declare type AsyncSymmetricPipe<T> = AsyncPipe<T, T>;
declare type AsyncConnection<T> = AsyncPipe<T, void>;
declare type Stream<T> = {
    input: InputStream<T>;
    output?: SyncOutputStream<void>;
};
declare const maybeStream: (value: any) => Stream<any> | null;
declare const pure: <T>(value: T) => Stream<T>;
declare const fromSync: <T>(stream: SyncInputStream<T>) => Stream<T>;
declare const fromArray: <T>(array: T[]) => Stream<T>;
declare const map: <A, B>(f: (A: any) => B) => (stream: Stream<A>) => Stream<B>;
declare const filter: <T>(f: (T: any) => boolean) => (stream: Stream<T>) => Stream<T>;
declare const reduce: <A, B>(f: (A: any, B: any) => A, init: A) => (stream: Stream<B>) => Promise<A>;
declare const toArray: <T>(stream: Stream<T>) => Promise<T[]>;
declare const blabber: <A, B>({ input }: Pipe<A, B>) => InputStream<A>;
declare const silence: <A, B>({ output }: Pipe<A, B>) => SyncOutputStream<B>;
declare const interval: (ms: number) => Pipe<number, void>;
declare const take: <T>(n: number, closeOnEnd?: boolean) => ({ input, output }: Stream<T>) => Stream<T>;
declare const interruptableWait: <T>(ms: number) => (stream: Stream<T>) => Pipe<T, void>;
declare const wait: <T>(ms: number) => (stream: Stream<T>) => Stream<T>;
declare const tap: <T>(stream: Stream<T>) => Stream<T>;
declare const log: (stream: Stream<any>) => void;
declare const timeout: <T>(ms: number) => ({ input, output }: Stream<T>) => Stream<T>;
export { InputStream, OutputStream, Pipe, SymmetricPipe, Connection, AsyncPipe, AsyncSymmetricPipe, AsyncConnection, Stream, maybeStream, isDone, pipe, pure, fromSync, fromArray, map, filter, reduce, toArray, blabber, silence, interval, interruptableWait, wait, tap, log, take, timeout };
