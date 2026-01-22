import "../globals.css";
import { getData } from "../actions";
import Client from "./client";

export default async function Goals() {
    const data = await getData();
    return <>
        <h1 className="rainbow">Claim Hunt Goals !</h1>
        <div id="main">
            <Client goals={data.goals}></Client>
        </div>
    </>
}