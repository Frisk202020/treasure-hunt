import { Setter } from "@/app/util-public";
import { useEffect, useState } from "react";
import Runes from "./runes";
import { createHash } from "crypto";
import "../../../globals.css";

const ANSWER = "7f3e990eabc60299b3eb7a4bfc068fff766c6e5cbfc26824b25eef9a038884d6";
const WAIT = 2480;
enum State {
    Normal,
    Error,
    Resolve
}
let key = -1;

export default function Core(props: {setClass: Setter<string>}) {
    const [state, setState] = useState(State.Normal);
    useEffect(()=>{
        props.setClass("de-active");
    }, []);

    const nav = document.getElementById("navigation");
    nav?.parentNode?.removeChild(nav);
    return <div id="main" className="bg">
        {render(state, setState)}
        <div id="tower">
            <img id="tower-img" src="/tower.png"></img>
        </div>
        <Runes></Runes>
    </div>;
}

function handler(data: FormData, set: Setter<State>) {
    const prompt = data.get("answer");
    if (!prompt) { return; }

    const hash = createHash("sha256");
    const digest = hash.update(prompt.toString()).digest("hex");
    if (digest === ANSWER) {
        fetch("/api/get-key?id=1").then((res)=>{
            if (res.status !== 200) {
                return set(State.Error);
            } 

            res.json().then((body)=>{
                if (body.key === undefined) {
                    set(State.Error);
                } else {
                    key = body.key;
                    new Audio("/appear.mp3").play();
                    new Promise((r)=>setTimeout(r, WAIT)).then(()=>set(State.Resolve));
                } 
            });
        });
    }
}

function render(state: State, set: Setter<State>) {
    switch(state) {
        case State.Normal: return <>
            <p>Don't give up, you've got <span className="rainbow">one last trial !</span></p>
            <form>
                <input type="text" name="answer"></input>
                <input type="submit" formAction={(data)=>handler(data, set)}></input>
            </form>
        </>;
        case State.Error: return <>
            <p className="error">An internal error occured !</p>
            <p>Please contact the administrator.</p>
        </>;
        case State.Resolve: return <div className="center margin">
            <img src="/key.png" style={{height: "40px"}}></img>
            <p>{key}</p>
        </div>;
    }
}