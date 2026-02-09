import Client from "./client";
import "../globals.css";
import { getData } from "../actions";

export default async function Join() {
    const data = await getData();

    return <>
        <div id="main">
            <h1 className="rainbow">Join the Hunt !</h1>
            <Client bank={data.bank}></Client>
        </div>
    </>
}