import { type SelectHTMLAttributes, forwardRef } from 'react'
import './FormSelect.css'

interface Option {
  value: string
  label: string
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Option[]
  error?: string
  placeholder?: string
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, options, error, placeholder, className = '', ...props }, ref) => {
    return (
      <div className={`form-select ${error ? 'form-select--error' : ''} ${className}`}>
        {label && <label className="form-select__label">{label}</label>}
        <select
          ref={ref}
          className="form-select__field"
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="form-select__error">{error}</span>}
      </div>
    )
  }
)

FormSelect.displayName = 'FormSelect'
