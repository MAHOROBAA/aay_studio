export type CreateUploadUrlRequest = {
  path: string
  contentType: string
}

export type CreateUploadUrlResult = {
  objectKey: string
  uploadUrl: string
  expiresInSeconds: number
}

export type CreateDownloadUrlResult = {
  downloadUrl: string
  expiresInSeconds: number
}
