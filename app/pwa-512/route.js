import {ImageResponse} from "next/og";
export const runtime="edge";
export async function GET(){return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"white"}}><img src="https://www.huspass.dk/huspass-icon.svg" width="512" height="512"/></div>,{width:512,height:512})}
