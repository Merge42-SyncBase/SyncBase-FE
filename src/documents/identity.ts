export function shortDocumentID(documentID: string): string {
  const value = documentID.trim()
  return value.length <= 8 ? value : value.slice(0, 8)
}
