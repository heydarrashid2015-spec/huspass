export const metadata={title:"Download HusPass"};
const wrap={maxWidth:720,margin:"0 auto",padding:"48px 22px 90px",fontFamily:"system-ui,sans-serif",lineHeight:1.55,color:"#17211c",textAlign:"center"};
const button={display:"inline-block",marginTop:14,padding:"14px 22px",borderRadius:12,background:"#102f68",color:"#fff",textDecoration:"none",fontWeight:700};
const step={background:"#f6faf8",border:"1px solid #e4ece8",borderRadius:16,padding:"14px",textAlign:"left",marginTop:10};
export default function Download(){return <main style={wrap}>
<img src="/icon" width="112" height="112" alt="HusPass"/>
<h1>HusPass til Android</h1>
<p>Testversionen kan installeres i 3 enkle trin.</p>
<div style={step}><b>1. Download</b><br/><span>Tryk på knappen nedenfor.</span></div>
<div style={step}><b>2. Tillad installation</b><br/><span>Hvis Android spørger, vælg at tillade installation fra denne kilde.</span></div>
<div style={step}><b>3. Installer og åbn</b><br/><span>Godkend installationen og åbn HusPass.</span></div>
<a style={button} href="https://github.com/heydarrashid2015-spec/huspass/releases/download/android-test/HusPass-Android-test.apk">Download HusPass</a>
<p style={{marginTop:22,fontSize:13,color:"#647067"}}>Android-testversion · uden for Google Play. Android kan derfor vise en sikkerhedsadvarsel. Den officielle Google Play-version vil kunne installeres direkte fra Play Butik.</p>
</main>}