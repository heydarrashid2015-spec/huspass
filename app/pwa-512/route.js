import {ImageResponse} from "next/og";
export const runtime="edge";
export async function GET(){
  return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#236b4a",borderRadius:"112px",fontSize:300,color:"white",fontWeight:800,fontFamily:"sans-serif"}}>H</div>,{width:512,height:512});
}
