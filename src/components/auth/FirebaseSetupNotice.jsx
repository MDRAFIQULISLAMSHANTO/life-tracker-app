'use client'

function FirebaseSetupNotice() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-background-card rounded-2xl shadow-card p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warning rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Firebase Setup Required</h1>
          <p className="text-text-secondary">
            Please configure Firebase to use authentication features.
          </p>
        </div>

        <div className="space-y-4 text-sm text-text-secondary">
          <div>
            <h3 className="font-semibold text-text-primary mb-2">Steps to set up:</h3>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Create a Firebase project at <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firebase Console</a></li>
              <li>Enable Authentication methods (Email/Password, Google)</li>
              <li>Get your Firebase config from Project Settings</li>
              <li>Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in the project root</li>
              <li>Add your Firebase credentials to <code className="bg-gray-100 px-1 rounded">.env.local</code></li>
            </ol>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="font-semibold text-text-primary mb-2">Example .env.local:</p>
            <pre className="text-xs overflow-x-auto">
{`NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id`}
            </pre>
          </div>

          <p className="text-xs text-text-secondary">
            After adding your Firebase config, restart the development server.
          </p>
        </div>
      </div>
    </div>
  )
}

export default FirebaseSetupNotice

