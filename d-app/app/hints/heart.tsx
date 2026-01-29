import { useEffect } from "react";
import "../globals.css"; import "./style.css";
import { Args, effect } from "./shared";

export default function Heart(props: Args) {
    useEffect(()=>effect(props), []);
    return <div>
        <p>
            My place is inspired by indie games like 
                <a className="blue" href="https://store.steampowered.com/app/391540/Undertale/">Undertale</a> 
            or 
                <a className="blue" href="https://store.steampowered.com/app/365450/Hacknet/">Hacknet</a>
        </p>
        <p>I may be easier to break for the <span className="blue">Gravity falls</span> community.</p>
    </div>;
}