import { Request, Response } from 'express'

import { AuthService } from '../auth.service'

export const createUser = async (req: Request, res: Response) => {
    try {
        const { username } = req.body

        if (!username) {
            return res.status(400).json({ error: 'Username is required' })
        }

        const totpData = AuthService.generateTOTP(username)

        return res.status(201).json({
            message: 'User created successfully',
            data: {
                username,
                totpUri: totpData.uri,
                secret: totpData.secret,
            },
        })
    } catch (error) {
        console.error('Error creating user:', error)
        return res.status(500).json({ error: 'Failed to create user' })
    }
}
