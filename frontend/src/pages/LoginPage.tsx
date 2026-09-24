import { LoginForm } from '../components/login/LoginForm'
import { LoginHero } from '../components/login/LoginHero'
import './LoginPage.css'

export function LoginPage() {
  return (
    <div className="login-page">
      <LoginHero />
      <LoginForm />
    </div>
  )
}
