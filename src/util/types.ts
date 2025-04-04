export type Flatten<T> = {
  [K in keyof T]: T[K]
}

export type Awaitable<T> = T | Promise<T>