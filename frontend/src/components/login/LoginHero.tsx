import './LoginHero.css'

export function LoginHero() {
  return (
    <aside className="login-hero" aria-label="Giới thiệu hệ thống">
      <div className="login-hero__overlay" aria-hidden="true" />
      <div className="login-hero__content">
        <img
          src="/vwa-logo.svg"
          alt="Học viện Phụ nữ Việt Nam"
          className="login-hero__logo"
          width={120}
          height={48}
        />

        <div className="login-hero__bottom">
          <div className="login-hero__message">
            <h1 className="login-hero__title">
              <span className="login-hero__title-line">Chào mừng bạn đến với</span>
              <span className="login-hero__title-line login-hero__title-line--main">
                Hệ thống quản lý hồ sơ sinh viên VWA
              </span>
            </h1>
            <p className="login-hero__desc">
              Nền tảng hỗ trợ quản lý, tra cứu và xử lý hồ sơ sinh viên một cách
              nhanh chóng, chính xác và hiệu quả.
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
