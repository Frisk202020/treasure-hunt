import "../globals.css";
import { getData } from "../actions";
import Client from "./client";

export default async function Goals() {
    const data = await getData();
    return <>
        <h1 className="rainbow">Claim Hunt Goals !</h1>
        <div id="main">
            <p>Did you find the key to your current <span className="rainbow">Hunt goal</span> ?</p>
            <p>Well you can try to claim and access to the next level, or even <span className="goal">get the reward</span> if you're the first !</p>
            <Client goals={data.goals}></Client>
        </div>
    </>
}