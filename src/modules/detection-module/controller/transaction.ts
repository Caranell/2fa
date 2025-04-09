import axios from 'axios'
import { Request, Response } from 'express'

import { ErrorHandler } from '@/helpers'

const VENN_EXPLORER_TRACE_API_URL = 'https://explorer.venn.build/api/trace'
export const vennTransaction = async (req: Request, res: Response) => {
    // https://explorer.venn.build/api/trace/0xa84aa065ce61dbb1eb50ab6ae67fc31a9da50dd2c74eefd561661bfce2f1620c?chainId=1&withLogs=true&withPrestate=true

    try {
        const { transaction } = req.body

        const response = await axios.get(`${VENN_EXPLORER_TRACE_API_URL}/${transaction}`, {
            params: {
                chainId: 1,
                withLogs: true,
                withPrestate: true,
            },
        })

        res.json(response.data)
    } catch (error) {
        // handle errors
        ErrorHandler.processApiError(res, error)
    }
}
