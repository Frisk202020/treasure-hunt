import { useState } from "react";

type ClassName = "disabled" | "enabled";
export default function GoalForm(props: { len: number }) {
    const [submitEnabled, setSubmit] = useState(false);
    const [classes, setClass] = useState(default_classes(props.len));
    const btns: React.JSX.Element[] = [];
    const handler = (i: number)=>{
        if (!submitEnabled) {
            setSubmit(true);
        }
        const classes = default_classes(props.len);
        classes[i] = "enabled";
        setClass(classes);
    };

    for (let i = 0; i < props.len; i++) {
        const id = `g${i}`;
        btns.push(
            <div key={`d${i}`}>
                <input type="radio" id={id} name="Goal" value={i} onClick={()=>handler(i)}></input>
                <Label class_name={classes[i]} id={id} display_index={i+1}></Label>
            </div>
        );
    }

    return <form>
        <input type="number" name="nonce" placeholder="Key value (20 digits)" key="nonce"></input>
        <p className="more-margin">Don't forget to specify which <span className="rainbow">Hunt Goal</span> you wish to claim !</p>
        {btns}
        <Submit enabled={submitEnabled}></Submit>
    </form>;
}

function Label(props: {class_name: ClassName, id: string, display_index: number}) {
    return <label className={props.class_name} htmlFor={props.id}>Goal {props.display_index}</label>
} function Submit(props: {enabled: boolean}) {
    return props.enabled
        ? <input type="submit" className="submit-enabled more-margin" formAction={form_action} value="Claim Goal !"></input>
        : <input type="submit" className="submit-disabled more-margin" formAction={()=>{}} value="Claim Goal !"></input>;
}

function form_action(data: FormData) {
    // TODO
    console.log("todo");
}

function default_classes(len: number) {
    return Array<ClassName>(len).fill("disabled");
}