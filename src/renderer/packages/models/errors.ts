export class BaseError extends Error {
    public code = 1
    constructor(message: string) {
        super(message)
    }
}

// 10000 - 19999 is for general errors

export class ApiError extends BaseError {
    public code = 10001
    constructor(message: string) {
        super('API Error: ' + message)
    }
}

export class NetworkError extends BaseError {
    public code = 10002
    public host: string
    constructor(message: string, host: string) {
        super('Network Error: ' + message)
        this.host = host
    }
}

export class AIProviderNoImplementedPaintError extends BaseError {
    public code = 10003
    constructor(aiProvider: string) {
        super(`Current AI Provider ${aiProvider} Does Not Support Painting`)
    }
}

export class AIProviderNoImplementedChatError extends BaseError {
    public code = 10005
    constructor(aiProvider: string) {
        super(`Current AI Provider ${aiProvider} Does Not Support Chat Completions API`)
    }
}


