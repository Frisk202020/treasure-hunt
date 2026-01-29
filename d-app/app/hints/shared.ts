import { setAndRebuild, Setter } from "../util-public";

const ACTIVATE_CLASS = "d-activate";

export interface Args {
    set: Setter<string[]>,
    from: string[],
    index: number
}

export function effect(args: Args) {
    args.set(setAndRebuild(args.from, ACTIVATE_CLASS, args.index));
}