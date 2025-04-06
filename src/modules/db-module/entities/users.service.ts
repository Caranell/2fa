import { Document, ObjectId } from 'mongodb'

import { logger } from '@/app'

import { dbService } from '../database.service'

export interface UserAuth extends Document {
    _id?: ObjectId
    username: string
    otpSecret: string
    createdAt: Date
    updatedAt: Date
}

class UsersService {
    private static instance: UsersService | null = null
    private readonly collectionName = 'users'

    private constructor() {
        // Private constructor for singleton pattern
    }

    public static getInstance(): UsersService {
        if (!UsersService.instance) {
            UsersService.instance = new UsersService()
        }
        return UsersService.instance
    }

    /**
     * Create a new user with OTP secret
     */
    public async createUser(username: string, otpSecret: string): Promise<UserAuth> {
        try {
            const collection = dbService.getCollection<UserAuth>(this.collectionName)

            // Check if user already exists
            const existingUser = await collection.findOne({ username })

            if (existingUser) {
                throw new Error(`User with username ${username} already exists`)
            }

            const now = new Date()
            const newUser: UserAuth = {
                username,
                otpSecret,
                createdAt: now,
                updatedAt: now,
            }

            const result = await collection.insertOne(newUser)

            if (!result.acknowledged) {
                throw new Error('Failed to insert user')
            }

            logger.info(`Created new user: ${username}`)

            return { ...newUser, _id: result.insertedId }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            logger.error(`Error creating user: ${errorMessage}`)

            throw error
        }
    }

    /**
     * Get user by username
     */
    public async getUserByUsername(username: string): Promise<UserAuth | null> {
        try {
            const collection = dbService.getCollection<UserAuth>(this.collectionName)

            return await collection.findOne({ username })
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            logger.error(`Error finding user: ${errorMessage}`)

            throw error
        }
    }

    /**
     * Update user's OTP secret
     */
    public async updateOtpSecret(username: string, newOtpSecret: string): Promise<boolean> {
        try {
            const collection = dbService.getCollection<UserAuth>(this.collectionName)

            const result = await collection.updateOne(
                { username },
                {
                    $set: {
                        otpSecret: newOtpSecret,
                        updatedAt: new Date(),
                    },
                },
            )

            if (result.matchedCount === 0) {
                throw new Error(`User ${username} not found`)
            }

            logger.info(`Updated OTP secret for user: ${username}`)

            return result.modifiedCount > 0
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            logger.error(`Error updating OTP secret: ${errorMessage}`)

            throw error
        }
    }

    /**
     * Delete user
     */
    public async deleteUser(username: string): Promise<boolean> {
        try {
            const collection = dbService.getCollection<UserAuth>(this.collectionName)

            const result = await collection.deleteOne({ username })

            if (result.deletedCount === 0) {
                throw new Error(`User ${username} not found or already deleted`)
            }

            logger.info(`Deleted user: ${username}`)

            return result.deletedCount > 0
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            logger.error(`Error deleting user: ${errorMessage}`)

            throw error
        }
    }
}

export const usersService = UsersService.getInstance()
