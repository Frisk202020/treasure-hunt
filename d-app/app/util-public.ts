import { BrowserProvider } from "ethers";
import { Dispatch, SetStateAction } from "react";

export const BANK_ADDRESS = "0xcdED3821113e9af36eb295B7b37807CfAe5AbdF9";
export const CHAIN_ID = 11155111;

export class Data {
    #goals: RichGoal[];
    #tickets: Ticket[];
    #key: string;
    #address: string;

    constructor(goals: RichGoal[], tickets: Ticket[], key: string, address: string) { 
        this.#goals = goals; this.#tickets = tickets; this.#key = key; this.#address = address;
    }

    get goals(): Readonly<Goal[]> {
        return this.#goals.map((x)=>{return {address: x.address, value: x.value}});
    } get key() {
        return this.#key;
    } get address() {
        return this.#address;
    }

    totalPot(): number {
        let out = 0;
        this.#goals.forEach((x)=>out += x.value);
        return out;
    }

    addressSet(): Set<string> {
        return new Set(this.#tickets.map((x)=>x.address));
    }

    getTicketLevel(address: string): number {
        for (const t of this.#tickets) {
            if (t.address === address) {
                return t.level;
            }
        }

        return -1;
    }

    addAddressAndFormat(address: string) {
        this.#tickets.push({address, level: 1});
        return this.#format();
    }
    upgradeAndFormat(address: string) {
        this.#tickets.forEach((x)=>{
            if (x.address === address) { x.level++; }
        });
        return this.#format();
    }

    getNonce(id: number) {
        return this.#goals[id].key;
    }

    #format(): string {
        return JSON.stringify({
            goals: this.#goals,
            tickets: this.#tickets,
            key: this.#key,
            address: this.#address
        }, null, 2);
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