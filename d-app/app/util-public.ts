import { Dispatch, SetStateAction } from "react";

export class Data {
    #goals: Goal[];
    #tickets: Ticket[];

    constructor(goals: Goal[], tickets: Ticket[]) { 
        this.#goals = goals; this.#tickets = tickets;
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

interface Goal {
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