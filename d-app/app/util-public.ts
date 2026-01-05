import { BrowserProvider } from "ethers";
import { Dispatch, SetStateAction } from "react";

export const BANK_ADDRESS = "0xcdED3821113e9af36eb295B7b37807CfAe5AbdF9";
export const CHAIN_ID = 11155111;

export class Data {
    #goals: Goal[];
    #tickets: Ticket[];

    constructor(goals: Goal[], tickets: Ticket[]) { 
        this.#goals = goals; this.#tickets = tickets;
    }

    get goals(): Readonly<Goal[]> {
        return this.#goals;
    }

    totalPot(): number {
        let out = 0;
        this.#goals.forEach((x)=>out += x.value);
        return out;
    }

    addressSet(): Set<string> {
        return new Set(this.#tickets.map((x)=>x.address));
    }

    addAddressAndFormat(address: string) {
        this.#tickets.push({address, level: 1});
        return JSON.stringify({
            goals: this.#goals,
            tickets: this.#tickets
        }, null, 2);
    }
}

export interface Goal {
    address: string,
    value: number,
}
interface Ticket {
    address: string,
    level: number
}

export type Setter<T> = Dispatch<SetStateAction<T>>;

export enum MutateResult {
    Ok,
    Busy,
    Unknown,
}

export function askMetamask(): BrowserProvider | null {
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