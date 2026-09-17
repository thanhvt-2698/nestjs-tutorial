export class ArticlesDatabaseOperationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ArticlesDatabaseOperationError';
  }
}
