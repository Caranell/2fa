import { Request, Response } from 'express'

import { AuthService } from '../auth.service'

export const verifyToken = async (req: Request, res: Response) => {
    try {
        const { username, token } = req.body

        if (!username || !token) {
            return res.status(400).json({ error: 'Username and token are required' })
        }

        const isValid = await AuthService.verifyToken(username, token)

        return res.status(200).json({
            isValid,
            message: isValid ? 'Token is valid' : 'Token is invalid',
        })
    } catch (error) {
        console.error('Error verifying token:', error)
        return res.status(500).json({ error: `Failed to verify token: ${error}` })
    }
}
