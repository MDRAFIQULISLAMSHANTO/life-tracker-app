import Logo from '../common/Logo'

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo variant="icon" size="auth" animated={false} />
          </div>
          {subtitle && <p className="text-text-secondary">{subtitle}</p>}
        </div>

        {/* Auth Card */}
        <div className="bg-background-card rounded-2xl shadow-card p-8">
          {title && (
            <h2 className="text-2xl font-semibold text-text-primary mb-6 text-center">
              {title}
            </h2>
          )}
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-secondary mt-6">
          Secure authentication powered by Firebase
        </p>
      </div>
    </div>
  )
}

export default AuthLayout
