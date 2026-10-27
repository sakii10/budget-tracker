export class NotFoundError extends Error {
  constructor(entity: string, key: number | string) {
    super(`${entity} ${key} not found`);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}