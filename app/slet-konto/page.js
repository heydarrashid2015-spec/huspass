export const metadata = {
  title: "Slet HusPass-konto",
  description: "Anmod om sletning af din HusPass-konto og tilknyttede data.",
};

export default function DeleteAccountPage() {
  return (
    <main style={{maxWidth:760,margin:"0 auto",padding:"40px 20px 64px",fontFamily:"system-ui,sans-serif",lineHeight:1.6,color:"#102F68"}}>
      <h1>Slet din HusPass-konto</h1>
      <p>Du kan til enhver tid anmode om at få din HusPass-konto og de data, der er knyttet til kontoen, slettet.</p>
      <h2>I HusPass</h2>
      <p>Den hurtigste og sikreste metode er: <strong>Mere → Slet konto</strong>. Du bliver bedt om at bekræfte sletningen, før den gennemføres.</p>
      <h2>Hvis du ikke længere har adgang til appen</h2>
      <p>Send en anmodning fra den e-mailadresse, der er knyttet til din HusPass-konto, til <a href="mailto:heydar.rashid2015@gmail.com?subject=Anmodning%20om%20sletning%20af%20HusPass-konto">heydar.rashid2015@gmail.com</a>. Skriv, at du ønsker din HusPass-konto slettet. Vi kan bede om nødvendig bekræftelse af, at kontoen tilhører dig, før sletningen gennemføres.</p>
      <h2>Hvad slettes?</h2>
      <p>Ved kontosletning slettes kontoen og de tilknyttede HusPass-data, herunder boligoplysninger, opgaver, udgifter, billeder og dokumenter, som er knyttet til kontoen.</p>
      <p>Oplysninger kan kun opbevares længere, hvis det er nødvendigt for at overholde en retlig forpligtelse eller et andet lovligt krav. Sådanne oplysninger bruges ikke til andre formål i opbevaringsperioden.</p>
      <p>Se også <a href="/privatliv">HusPass privatlivspolitik</a>.</p>
    </main>
  );
}
