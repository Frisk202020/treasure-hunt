import { Goal, Setter } from "../util-public";
import Renderer from "../renderer";
import { PageState } from "./util";

interface Args {
    state_setter: Setter<PageState>,
    data: Readonly<Goal[]>
}
class GoalRenderer extends Renderer<PageState, Args> {
    #data: Readonly<Goal[]>;

    constructor(args: Args) {
        super(args.state_setter); this.#data = args.data;
    } protected args(): Args {
        return {state_setter: this.state_setter, data: this.#data};
    } protected get connected_state(): PageState {
        return PageState.Connected;
    } protected fallback(): void {
        this.state_setter(PageState.InternalError);
    } 

    render(state: PageState): React.JSX.Element {
        switch (state) {
            default:
                return <p>TODO</p>;
        }
    }
}

export function initRenderer(state_setter: Setter<PageState>, data: Readonly<Goal[]>) {
    return new GoalRenderer({state_setter, data});
}