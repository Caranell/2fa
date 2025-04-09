import { useState } from 'react'
import { detectTransaction, getParsedVennTransaction } from '../api/user'
import TwoFactorInput from './TOTPInput'

interface TransactionDetectorProps {
    username: string
}

interface DetectionResult {
    detected: boolean
    details?: Record<string, unknown>
    [key: string]: unknown
}

export function TransactionDetector({ username }: TransactionDetectorProps) {
    const [transactionHash, setTransactionHash] = useState('')
    const [vennTransaction, setVennTransaction] = useState<any>(null)
    const [result, setResult] = useState<DetectionResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [needsAuth, setNeedsAuth] = useState(false)

    const handleDetect = async () => {
        if (!transactionHash.trim()) return

        setError(null)
        setResult(null)

        try {
            const vennTransaction = await getParsedVennTransaction(transactionHash)
            setVennTransaction(vennTransaction)
            const response = await detectTransaction(vennTransaction, transactionHash)
            setResult(response)

            if (response.message.includes('please use 2FA')) {
                setNeedsAuth(true)
            }
        } catch (e: unknown) {
            // @ts-expect-error Accessing potential error details from Axios response
            const errorMessage = e?.response?.data?.error || 'An error occurred'
            setError(errorMessage)
            console.error('Detection error:', e)
        }
    }

    const handleAuth = async (authCode: string) => {
        const response = await detectTransaction(vennTransaction, transactionHash, username, authCode)
        setResult(response)
    }



    return (
        <div className="transaction-detector">
            <h2>Transaction Detector</h2>
            <p>
                Hello, <b>{username}</b>! Check a transaction hash:
            </p>

            <div className="input-group" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
                <label htmlFor="transaction">Transaction Hash:</label>
                <input
                    id="transaction"
                    type="text"
                    value={transactionHash}
                    onChange={e => setTransactionHash(e.target.value)}
                    placeholder="Enter transaction hash"
                    style={{ width: '70%' }}
                />
            </div>

            <div style={{ paddingTop: '10px', paddingBottom: '20px' }}>
                <button onClick={handleDetect} disabled={!transactionHash.trim()}>
                    Check Transaction
                </button>
            </div>

            {error && <p className="error">{error}</p>}

            {needsAuth && (
                <div style={{ paddingTop: '10px', paddingBottom: '20px' }}>
                    <TwoFactorInput onSubmit={(code) => {
                        console.log('code', code)
                        handleAuth(code)
                    }} />
                </div>
            )}

            {result && (
                <div className="result">
                    <h3>Detection Result:</h3>
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    )
}
