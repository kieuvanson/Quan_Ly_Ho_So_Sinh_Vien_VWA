import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary chung cho toàn bộ ứng dụng.
 * Khi component con throw lỗi, thay vì React unmount toàn bộ
 * (gây trang trắng), ErrorBoundary sẽ hiển thị thông báo lỗi
 * chi tiết + nút reload để người dùng xử lý tiếp.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#f8fafc',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 720,
              width: '100%',
              background: 'white',
              borderRadius: 12,
              padding: 32,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                color: '#dc2626',
              }}
            >
              <AlertCircle size={28} />
              <h1 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>
                Đã xảy ra lỗi khi tải trang
              </h1>
            </div>
            <p style={{ color: '#475569', margin: '0 0 16px 0' }}>
              Hệ thống gặp lỗi không mong muốn. Bạn có thể tải lại trang hoặc
              quay lại trang trước. Nếu lỗi tiếp tục, vui lòng liên hệ quản
              trị viên.
            </p>

            {this.state.error && (
              <details
                style={{
                  background: '#f1f5f9',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#0f172a',
                    marginBottom: 8,
                  }}
                >
                  Chi tiết lỗi (dành cho dev)
                </summary>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#b91c1c',
                    margin: '8px 0 0 0',
                    fontFamily: 'Consolas, monospace',
                  }}
                >
                  <strong>Message:</strong> {this.state.error.message}
                  {'\n\n'}
                  <strong>Stack:</strong>
                  {'\n'}
                  {this.state.error.stack}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {'\n\n'}
                      <strong>Component stack:</strong>
                      {'\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 16px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Tải lại trang
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 16px',
                  background: 'white',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Thử lại
              </button>
              <button
                onClick={() => window.history.back()}
                style={{
                  padding: '10px 16px',
                  background: 'white',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
