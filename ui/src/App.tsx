import { useState, useEffect } from 'react'
import './App.css'
import { createUser } from './api/user'
import { QRCodeDisplay } from './components/QRCodeDisplay'
import { UsernameForm } from './components/UsernameForm'
import { TransactionDetector } from './components/TransactionDetector'

function App() {
    const [username, setUsername] = useState('')
    const [totpUri, setTotpUri] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load user data from localStorage on component mount
    useEffect(() => {
        const storedUsername = localStorage.getItem('username')
        const storedTotpUri = localStorage.getItem('totpUri')
        if (storedUsername && storedTotpUri) {
            setUsername(storedUsername)
            setTotpUri(storedTotpUri)
        }
    }, [])

    const handleGenerate = async () => {
        setIsLoading(true)
        setError(null)
        // We don't clear totpUri here anymore, only on explicit clear
        // setTotpUri(null)

        try {
            const response = await createUser(username)
            if (response.data.totpUri) {
                const newTotpUri = response.data.totpUri
                setTotpUri(newTotpUri)
                // Save to localStorage
                localStorage.setItem('username', username)
                localStorage.setItem('totpUri', newTotpUri)
            } else {
                throw new Error('URI not found in response')
            }
        } catch (e: unknown) {
            // @ts-expect-error Accessing potential error details from Axios response
            const errorMessage = e?.response?.data?.error
            setError(`Failed to generate TOTP URI: ${errorMessage}`)
            console.error('Fetch error:', e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClear = () => {
        localStorage.removeItem('username')
        localStorage.removeItem('totpUri')
        setUsername('')
        setTotpUri(null)
        setError(null)
    }

    return (
        <div className="container">
            {!totpUri && <h1>Generate 2FA TOTP</h1>}
            {!totpUri && (
                <UsernameForm
                    username={username}
                    onUsernameChange={setUsername}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                />
            )}

            {error && <p className="error">{error}</p>}

            {totpUri && (
                <>
                    <QRCodeDisplay
                        username={username}
                        totpUri={totpUri}
                        onClear={handleClear}
                    />
                    <TransactionDetector username={username} />
                </>
            )}
        </div>
    )
}

export default App
