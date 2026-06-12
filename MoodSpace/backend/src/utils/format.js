export const bytesToMB = (bytes) => Number((Number(bytes || 0) / (1024 * 1024)).toFixed(3))

export const formatBytesMB = (bytes) => `${bytesToMB(bytes)}MB`
