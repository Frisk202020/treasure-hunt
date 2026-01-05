import { getData } from "../actions";
import Client from "./client";
import "../globals.css";

export default async function Join() {
    const data = await getData();
    return <>
        <div id="main">
            <h1 className="rainbow">Join the Hunt !</h1>
            <Client registeredAddresses={data.addressSet()}></Client>
        </div>
    </>
}