import { useEffect } from "react";
import "../globals.css"; import "./style.css";
import { Args, effect } from "./shared";

export default function Holy(props: Args) {
    useEffect(()=>effect(props), [])

    return <div>
        <p>I require some knowledge about an indie game called 
            <a className="blue" href="https://store.steampowered.com/app/553420/TUNIC/">Tunic</a>.
        </p>
        <p>I should be accessed through an online board game.</p>
        <p>I am hidden behind multiple layers.</p>
        <p>You should seek for out-of-place stuff. I was added on top of the genuine application.</p>
    </div>;
}