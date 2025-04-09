import QRCode from 'react-qr-code'

interface QRCodeDisplayProps {
    username: string
    totpUri: string
    onClear: () => void
}

export function QRCodeDisplay({ username, totpUri, onClear }: QRCodeDisplayProps) {
    return (
        <div className="result" style={{ maxWidth: '35%' }}>
            <h1>
                Authenticator for user: <b>{username}</b>
            </h1>
            <h3>Scan this QR Code with your Authenticator App:</h3>
            <div style={{ height: 'auto', margin: '0 auto', maxWidth: 256, width: '100%' }}>
                <QRCode
                    size={256}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    value={totpUri}
                    viewBox={`0 0 256 256`}
                />
            </div>
            <p>
                Or manually enter the URI: <code>{totpUri}</code>
            </p>
            <button onClick={onClear} style={{ marginTop: '1rem' }}>
                Use Different Account
            </button>
        </div>
    )
}
