import {ImageResponse} from "next/og";
export const size={width:180,height:180};
export const contentType="image/png";
export default function AppleIcon(){return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"white"}}><img src="https://www.huspass.dk/huspass-icon.svg" width="180" height="180"/></div>,{width:180,height:180})}
