"use client";
import { useEffect, useState } from "react";
import { ask_metamask, Goal } from "../util-public";
import { initRenderer } from "./renderer";
import { PageState } from "./util";

interface Args {
    goals: Readonly<Goal[]>
}
export default function Client(args: Args) {
    const [state, state_setter] = useState(PageState.Default);
    const [renderer, set_renderer] = useState(initRenderer(state_setter, args.goals));

    useEffect(()=>{
        const provider = ask_metamask();
        if (provider != null) {
            set_renderer(renderer.with_provider(provider, set_renderer));
            state_setter(PageState.Connected);
        }
    }, []);

    return renderer.render(state);
}