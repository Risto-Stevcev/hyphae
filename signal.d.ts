declare type Signal<T> = T | '␄';
declare const endOfTransmission = "\u2404";
declare const isDone: (value: any) => boolean;
export { Signal, endOfTransmission, isDone };
