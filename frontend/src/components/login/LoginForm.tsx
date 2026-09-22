import { useId, useState, type FormEvent } from 'react'
import { IconEye, IconEyeOff, IconLock, IconUser } from '../icons/LoginIcons'
import { mockLogin } from '../../lib/mockLogin'
import './LoginForm.css'

const REMEMBER_KEY = 'vwa-edurecords-remember-username'

type FieldErrors = {
  username?: string
  password?: string
}

function readRememberedUsername(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? ''
  } catch {
    return ''
  }
}

export function LoginForm() {
  const usernameId = useId()
  const passwordId = useId()
  const usernameErrorId = useId()
  const passwordErrorId = useId()
  const formErrorId = useId()

  const [username, setUsername] = useState(readRememberedUsername)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => readRememberedUsername() !== '')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function validate(): FieldErrors {
    const errors: FieldErrors = {}
    if (!username.trim()) {
      errors.username = 'Vui lòng nhập tên đăng nhập.'
    }
    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.'
    }
    return errors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccessMessage(null)
    setFormError(null)

    const errors = validate()
    setFieldErrors(errors)
    if (errors.username || errors.password) {
      return
    }

    setIsLoading(true)
    try {
      const result = await mockLogin({ username, password })
      if (result.success) {
        setFormError(null)
        setSuccessMessage(
          'Đăng nhập thành công (mock). Kết nối API sẽ được bổ sung sau.',
        )
        try {
          if (remember) {
            localStorage.setItem(REMEMBER_KEY, username.trim())
          } else {
            localStorage.removeItem(REMEMBER_KEY)
          }
        } catch {
          /* ignore */
        }
      } else {
        setFormError(result.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-form-panel">
      <div className="login-card">
        <header className="login-card__header">
          <img
            src="/vwa-logo.svg"
            alt=""
            className="login-card__logo"
            width={56}
            height={56}
          />
          <p className="login-card__org">Học viện Phụ nữ Việt Nam</p>
          <h2 className="login-card__title">Đăng nhập hệ thống</h2>
          <p className="login-card__subtitle">
            Vui lòng nhập thông tin tài khoản để tiếp tục sử dụng hệ thống
          </p>
        </header>

        {formError ? (
          <div
            id={formErrorId}
            className="login-alert login-alert--error"
            role="alert"
          >
            {formError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="login-alert login-alert--success" role="status">
            {successMessage}
          </div>
        ) : null}

        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
          aria-describedby={formError ? formErrorId : undefined}
        >
          <div className="login-field">
            <label className="login-field__label visually-hidden" htmlFor={usernameId}>
              Tên đăng nhập
            </label>
            <div
              className={`login-input-wrap${fieldErrors.username ? ' login-input-wrap--error' : ''}`}
            >
              <IconUser className="login-input-wrap__icon" />
              <input
                id={usernameId}
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Tên đăng nhập"
                className="login-input"
                value={username}
                disabled={isLoading}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={fieldErrors.username ? usernameErrorId : undefined}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined }))
                  }
                  setFormError(null)
                }}
              />
            </div>
            {fieldErrors.username ? (
              <p id={usernameErrorId} className="login-field__error" role="alert">
                {fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div className="login-field">
            <label className="login-field__label visually-hidden" htmlFor={passwordId}>
              Mật khẩu
            </label>
            <div
              className={`login-input-wrap${fieldErrors.password ? ' login-input-wrap--error' : ''}`}
            >
              <IconLock className="login-input-wrap__icon" />
              <input
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Mật khẩu"
                className="login-input login-input--with-toggle"
                value={password}
                disabled={isLoading}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }))
                  }
                  setFormError(null)
                }}
              />
              <button
                type="button"
                className="login-input-wrap__toggle"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isLoading}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={showPassword}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p id={passwordErrorId} className="login-field__error" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div className="login-form__row">
            <label className="login-checkbox">
              <input
                type="checkbox"
                checked={remember}
                disabled={isLoading}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a className="login-link" href="#">
              Quên mật khẩu?
            </a>
          </div>

          <button type="submit" className="login-submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="login-submit__spinner" aria-hidden="true" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <span>Đăng nhập →</span>
            )}
          </button>
        </form>

        <footer className="login-card__footer">
          Hệ thống chỉ dành cho cán bộ, giảng viên và sinh viên của Học viện Phụ
          nữ Việt Nam
        </footer>
      </div>
    </div>
  )
}
