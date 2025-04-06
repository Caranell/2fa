import dotenv from 'dotenv'
import { Collection, Db, Document, MongoClient } from 'mongodb'

import { logger } from '@/app'

dotenv.config()

class DatabaseService {
    private client: MongoClient | null = null
    private db: Db | null = null
    private static instance: DatabaseService | null = null

    private constructor() {
        // Private constructor for singleton pattern
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService()
        }
        return DatabaseService.instance
    }

    public async connect(): Promise<void> {
        try {
            const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
            const dbName = process.env.MONGODB_DB_NAME || 'venn'

            this.client = new MongoClient(uri)
            await this.client.connect()
            this.db = this.client.db(dbName)

            logger.info(`Connected to MongoDB database: ${dbName}`)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            logger.error(`MongoDB connection error: ${errorMessage}`)
            throw error
        }
    }

    public getCollection<T extends Document = Document>(collectionName: string): Collection<T> {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.')
        }

        return this.db.collection<T>(collectionName)
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close()
            this.client = null
            this.db = null
            logger.info('Disconnected from MongoDB')
        }
    }
}

export const dbService = DatabaseService.getInstance()
