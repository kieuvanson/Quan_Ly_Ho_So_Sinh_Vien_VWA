import { type InputHTMLAttributes, forwardRef } from 'react'
import './FormInput.css'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={`form-input ${error ? 'form-input--error' : ''} ${className}`}>
        {label && <label className="form-input__label">{label}</label>}
        <input
          ref={ref}
          className="form-input__field"
          {...props}
        />
        {error && <span className="form-input__error">{error}</span>}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
