type Signal<T> = T | '␄'

const endOfTransmission = '␄'

const isDone = value => value === endOfTransmission

export { Signal, endOfTransmission, isDone }
