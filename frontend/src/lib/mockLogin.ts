/** Mock credentials for UI testing only — replace with API when backend is ready. */
export const MOCK_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
} as const

export type MockLoginPayload = {
  username: string
  password: string
}

export type MockLoginResult =
  | { success: true }
  | { success: false; message: string }

const MOCK_DELAY_MS = 1200

export function mockLogin(payload: MockLoginPayload): Promise<MockLoginResult> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const username = payload.username.trim()
      const password = payload.password

      if (
        username === MOCK_CREDENTIALS.username &&
        password === MOCK_CREDENTIALS.password
      ) {
        resolve({ success: true })
        return
      }

      resolve({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại.',
      })
    }, MOCK_DELAY_MS)
  })
}
