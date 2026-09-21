export interface PrivateObjectStorage {
  putPrivate(input: { key: string; bytes: Uint8Array; contentType: string }): Promise<void>;
  createSignedDownloadUrl(input: { key: string; expiresInSeconds: number }): Promise<URL>;
  getPrivate(key: string): Promise<Uint8Array>;
  deletePrivate(key: string): Promise<void>;
}
