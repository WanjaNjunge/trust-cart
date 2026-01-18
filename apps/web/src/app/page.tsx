export default function HomePage(): React.ReactElement {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-primary-600 sm:text-6xl">TrustCart Kenya</h1>
                <p className="mt-4 text-lg text-secondary-600">
                    Electronics You Can Trust — Coming Soon
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <a href="/products" className="btn-primary">
                        Browse Products
                    </a>
                    <a href="/about" className="btn-outline">
                        Learn More
                    </a>
                </div>
            </div>

            {/* Development Status */}
            <div className="card mt-16 max-w-md text-center">
                <h2 className="text-lg font-semibold text-secondary-900">🚧 Development Mode</h2>
                <p className="mt-2 text-sm text-secondary-600">
                    This is a placeholder page. The platform is under active development.
                </p>
                <div className="mt-4 flex justify-center gap-2 text-xs text-secondary-500">
                    <span className="rounded bg-success-500/10 px-2 py-1 text-success-600">
                        API: localhost:3001
                    </span>
                    <span className="rounded bg-primary-500/10 px-2 py-1 text-primary-600">
                        Web: localhost:3000
                    </span>
                </div>
            </div>
        </main>
    );
}
