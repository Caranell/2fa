interface UsernameFormProps {
    username: string
    onUsernameChange: (username: string) => void
    onGenerate: () => void
    isLoading: boolean
}

export function UsernameForm({ username, onUsernameChange, onGenerate, isLoading }: UsernameFormProps) {
    return (
        <>
            <div className="input-group">
                <label htmlFor="username">Username:</label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => onUsernameChange(e.target.value)}
                    placeholder="Enter username"
                    disabled={isLoading}
                />
            </div>
            <button onClick={onGenerate} disabled={isLoading || !username}>
                {isLoading ? 'Generating...' : 'Generate URI'}
            </button>
        </>
    )
} 