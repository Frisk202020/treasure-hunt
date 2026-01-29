import { Setter } from "@/app/util-public";
import "./style.css";

const ANIMATION_TIME = 1;

export default function Prelude(props: {setClass: Setter<string>, setActivation: Setter<boolean>}) {
    return <div id="main">
        <button onClick={()=>{
            props.setClass("active");
            new Promise((r)=>setTimeout(r, ANIMATION_TIME * 1000)).then(()=>{
                props.setActivation(true);
            });
        }} className="margin">The last trial</button>
    </div>;
}