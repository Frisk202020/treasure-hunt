// vrfy-goal
export interface VrfyRequest {
    nonce: string, goalId: string
}
export enum ErrorCodes {
    UndefinedParams,
    InvalidParams,
    InvalidId,
    Wrong
}