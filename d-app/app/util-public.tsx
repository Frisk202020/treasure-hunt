import { JsonRpcSigner } from "ethers";
import { TransactionResponse } from "ethers";
import { TransactionRequest } from "ethers";
import { BrowserProvider } from "ethers";
import { Dispatch, SetStateAction } from "react";

export const BANK_ADDRESS = "0xAB6AeAA2779d2501A605240E545aCbC6d466EdaD";
const CHAIN_ID = 11155111;

export const SHARED_STATES = {
    noMetaMask: <p className="error">Please add Metamask extension to your browser to proceed</p>,
    notMined: <p className="error">ERROR: Transaction was not added to the blockchain.</p>,
    noResponse: <p className="error">ERROR: Failed to receive transaction response.</p>,
    cancelled: <p className="error">ERROR: Transaction canceled</p>,
    pending: <p>Sending transaction, please wait...</p>,
    internal: <p className="error">Internal error. Try reloading the page.</p>
}

export function unwrap_or<T>(fallback: T, x?: T) {
    return x === undefined ? fallback : x;
}

export class Data {
    #goals: RichGoal[];

    constructor(goals: RichGoal[]) { 
        this.#goals = goals;
    }

    get goals(): Readonly<Goal[]> {
        return this.#goals.map((x)=>{return {address: x.address, value: x.value}});
    }

    totalPot(): number {
        let out = 0;
        this.#goals.forEach((x)=>out += x.value);
        return out;
    }

    checkNonce(id: number, nonce: number) {
        return this.#goals[id].key === nonce;
    }
}

interface RichGoal {
    address: string,
    value: number,
    key: number
}
export interface Goal {
    address: string,
    value: number,
}

export type Setter<T> = Dispatch<SetStateAction<T>>;

export function ask_metamask(): BrowserProvider | null {
    const eth = (window as any).ethereum;
    if (eth != null) {
        eth.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],      
        });
        return new BrowserProvider(eth);
    }

    return null;
}

export interface TransactionParams {
    signer: JsonRpcSigner,
    to: string,
    value?: number,
    data?: string
} export function send_transaction(
    tx_params: TransactionParams, 
    successHandler: (res: TransactionResponse)=>void, 
    errorHandler: (err: any)=>void
) {
    const tx: TransactionRequest = {
        chainId: CHAIN_ID,
        from: tx_params.signer.address,
        to: tx_params.to,
        value: unwrap_or(0, tx_params.value),
        data: tx_params.data
    }
    tx_params.signer
        .sendTransaction(tx)
        .then(successHandler).catch(errorHandler);
}