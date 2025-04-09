import axios from 'axios'

export const createUser = async (username: string) => {
    const response = await axios.post('http://localhost:3000/auth/user', {
        username,
    })

    return response.data
}

export const getParsedVennTransaction = async (transaction: string) => {
    const vennTransactionResponse = await axios.post(
        'http://localhost:3000/detect/venn-transaction',
        {
            transaction,
        },
    )

    return vennTransactionResponse.data
}

export const detectTransaction = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vennTransaction: any,
    txHash: string,
    username?: string,
    authCode?: string,
) => {
    const detectionResponse = await axios.post('http://localhost:3000/detect/', {
        chainId: 1,
        hash: txHash,
        trace: {
            ...vennTransaction.trace,
            logs: vennTransaction.logs,
            pre: vennTransaction.prestateTrace.pre,
            post: vennTransaction.prestateTrace.post,
        },
        additionalData: {
            username,
            token: authCode,
        },
    })

    return detectionResponse.data
}
