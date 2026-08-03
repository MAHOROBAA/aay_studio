export type RequestUser = {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'tester'
}
