/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/generated/prisma/client";
import { getInitials } from "@/lib/helper/user";
import { TypingAnimation } from "../ui/typing-animation";
import { useEffect, useState } from "react";
import UserDefaultAvatar from "../user/user-default-avatar";

const welcomeMessages = [
  "Just do it.",
  "Sei du selbst die Veränderung, die du dir wünschst für diese Welt. — Mahatma Gandhi",
  "Bereit, gemeinsam Gutes zu tun?",
  "Tue Gutes in deinem kleinen Rahmen; es sind diese vielen kleinen guten Taten, die zusammen die Welt verändern.",
  "Keine Handlung der Freundlichkeit, egal wie klein, ist jemals verschwendet. — Aesop",
  "Do small things with great love. — Mutter Teresa",
  "Nichts kann den Menschen mehr stärken als das Vertrauen, das man ihm entgegenbringt.",
  "Die beste Art, sich um die Zukunft zu kümmern, besteht darin, sich sorgsam der Gegenwart zu widmen.",
  " Jede kleine Hilfe kann ein großes Leben verändern.",
  "Ein freundlicher Moment kann den Tag eines Menschen retten.",
  "Die Welt wird besser, wenn Menschen füreinander da sind.",
  "Menschlichkeit beginnt mit kleinen Taten.",
  "Helfen kostet oft wenig, bedeutet aber alles.",
  "Gemeinsam heilen wir mehr als nur Krankheiten.",
  "Jede gute Tat hinterlässt Spuren.",
  "Ein kleines Zeichen von Fürsorge kann Hoffnung schenken.",
  "Menschen helfen heißt Zukunft verändern.",
  "Freundlichkeit ist ansteckend – verbreite sie.",
  "Gesundheit ist mehr als Medizin – sie beginnt mit Mitgefühl.",
  "Hinter jedem Patienten steckt ein Mensch mit einer Geschichte.",
  "Kleine Schritte können große Heilung bringen.",
  "Zuhören ist manchmal die beste Medizin.",
  "Hoffnung ist ein wichtiger Teil jeder Therapie.",
  "Ein gesunder Mensch hat viele Wünsche, ein kranker nur einen.",
  "Gute Worte können genauso stark sein wie Medikamente.",
  "Heilung beginnt oft mit Vertrauen.",
  "Jeder Mensch verdient Fürsorge und Respekt.",
  "Medizin rettet Leben, Menschlichkeit verändert sie.",
  "Heute jemandem helfen. Morgen die Welt verändern.",
  "Technologie ist stark – Mitgefühl macht sie wertvoll.",
  "Digitale Lösungen. Menschliche Wirkung.",
  "Innovation bedeutet, Menschen besser zu helfen.",
  "Gemeinsam für eine gesündere Zukunft.",
  "Kleine Aktionen. Große Wirkung.",
  "Deine Unterstützung zählt mehr, als du denkst.",
  "Jeder Klick kann etwas Gutes bewirken.",
  "Die Zukunft der Gesundheit beginnt bei uns allen.",
  "Fortschritt macht Sinn, wenn er Menschen hilft.",
  "Sei der Grund für ein Lächeln.",
  "Hilfe verändert alles.",
  "Hoffnung verbindet Menschen.",
  "Mitgefühl macht den Unterschied.",
  "Jeder Mensch zählt.",
  "Gute Taten bleiben.",
  "Gemeinsam stärker.",
  "Heute helfen. Morgen heilen.",
  "Menschlichkeit zuerst.",
  "Ein kleiner Schritt genügt.",
  " Vielleicht bist du heute die Hoffnung eines Menschen.",
  "Niemand verändert die Welt allein – aber jeder kann anfangen.",
  "Selbst kleine Gesten können Leben heller machen.",
  "Hilfe kommt oft genau dann, wenn jemand sie am meisten braucht.",
  "Die stärksten Menschen sind oft die, die anderen helfen.",
  "Wer Menschen hilft, verändert mehr als nur einen Moment.",
  "Aus Mitgefühl entsteht echte Veränderung.",
  "Ein bisschen Hilfe kann unendlich viel bedeuten.",
  "Gute Menschen machen die Welt leiser, wärmer und besser.",
  "Manchmal reicht ein Mensch, um Hoffnung zurückzubringen.",
  "Was wir heute tun, entscheidet darüber, wie die Welt morgen aussieht. — Marie von Ebner-Eschenbach",
  "Die kleinste gute Tat ist mehr wert als die größte gute Absicht. — Khalil Gibran",
  "Ein Mensch ist erst vergessen, wenn sein Name vergessen ist. — Talmud",
  "Freundlichkeit ist eine Sprache, die Taube hören und Blinde lesen können. — Mark Twain",
  "Wer die Welt bewegen will, sollte erst sich selbst bewegen. — Sokrates",
  "Es sind die kleinen Dinge im Leben, die Großes bewirken.",
  "Ein Lächeln kann mehr heilen als tausend Worte.",
  "Mitgefühl macht Menschen stark.",
  "Jede helfende Hand verändert ein Stück Welt.",
  "Wahre Größe zeigt sich darin, anderen zu helfen.",
  "Menschlichkeit beginnt dort, wo Gleichgültigkeit endet.",
  "Hoffnung wächst, wenn Menschen füreinander da sind.",
  "Ein guter Mensch macht die Welt automatisch besser.",
  "Zusammen können kleine Schritte Großes verändern.",
  "Niemand ist zu klein, um etwas Gutes zu bewirken.",
  "Güte kostet nichts und verändert trotzdem alles.",
  "Manchmal braucht ein Mensch nur jemanden, der zuhört.",
  "Ein wenig Zeit kann für jemanden unbezahlbar sein.",
  "Hilfe ist das schönste Geschenk, das man geben kann.",
  "Mit jeder guten Tat wächst Hoffnung.",
  "Die Welt braucht mehr Menschen, die einfach helfen.",
  "Wahre Stärke zeigt sich in Mitgefühl.",
  "Ein freundliches Herz verändert mehr als Worte.",
  "Gutes tun beginnt oft mit einer kleinen Entscheidung.",
  "Wer Hoffnung schenkt, schenkt Zukunft.",
  "Jeder Mensch kann Licht in das Leben anderer bringen.",
  "Zusammenhalt macht schwere Zeiten leichter.",
  "Ein Moment der Freundlichkeit bleibt oft für immer.",
  "Die besten Menschen sind die, die anderen Mut machen.",
  "Menschlichkeit kennt keine Grenzen.",
  "Es gibt nichts Wertvolleres als echte Fürsorge.",
  "Ein kleines Zeichen der Hilfe kann Welten bedeuten.",
  "Menschen brauchen Menschen.",
  "Die Welt heilt durch Mitgefühl.",
  "Wer anderen Hoffnung gibt, verändert Leben.",
  "Freundlichkeit beginnt bei den kleinen Dingen.",
  "Gemeinsam können wir mehr bewirken als allein.",
  "Ein guter Gedanke kann ein neuer Anfang sein.",
  "Die größte Medizin ist oft Menschlichkeit.",
  "Wärme entsteht durch Menschen, die füreinander da sind.",
  "Nicht Perfektion verändert die Welt, sondern Güte.",
  "Wer hilft, hinterlässt Spuren im Herzen.",
  "Hoffnung ist stärker, wenn man sie teilt.",
  "Ein bisschen Mitgefühl kann alles verändern.",
  "Manchmal reicht eine einzige gute Tat.",
  "Die Welt wird menschlicher durch kleine Gesten.",
  "Ein offenes Herz ist die stärkste Kraft.",
  "Hilfsbereitschaft verbindet Menschen.",
  "Jeder neue Tag ist eine Chance, etwas Gutes zu tun.",
  "Wo Menschen einander helfen, entsteht echte Stärke.",
  "Die Zukunft hängt davon ab, was wir heute tun. — Mahatma Gandhi",
  "Es gibt keinen Weg zum Frieden, denn Frieden ist der Weg. — Mahatma Gandhi",
  "Nur ein Leben, das für andere gelebt wird, ist lebenswert. — Albert Einstein",
  "Wer immer tut, was er schon kann, bleibt immer das, was er schon ist. — Henry Ford",
  "Handle so, als ob deine Taten einen Unterschied machen. Sie tun es. — William James",
  "Die beste Möglichkeit, die Zukunft vorauszusagen, ist, sie zu gestalten. — Peter Drucker",
  "Freundlichkeit ist das goldene Kettenglied, durch das die Gesellschaft verbunden wird. — Johann Wolfgang von Goethe",
  "Nicht der Mensch hat am meisten gelebt, welcher die höchsten Jahre zählt, sondern derjenige, welcher sein Leben am meisten empfunden hat. — Jean-Jacques Rousseau",
  "Einzeln sind wir Worte, zusammen ein Gedicht. — Georg Bydlinski",
  "Mut steht am Anfang des Handelns, Glück am Ende. — Demokrit",
  "Die wahre Lebenskunst besteht darin, im Alltäglichen das Wunderbare zu sehen. — Pearl S. Buck",
  "Das Geheimnis des Vorwärtskommens besteht darin, den ersten Schritt zu tun. — Mark Twain",
  "Man kann einen Menschen nichts lehren, man kann ihm nur helfen, es in sich selbst zu entdecken. — Galileo Galilei",
  "Die größte Entdeckung meiner Generation ist, dass ein Mensch sein Leben ändern kann, indem er seine Einstellung ändert. — William James",
  "Wer den Tag mit einem Lachen beginnt, hat ihn bereits gewonnen. — Cicero",
  "Es sind Begegnungen mit Menschen, die das Leben lebenswert machen. — Guy de Maupassant",
  "Die kleinen Dinge sind es, die das Leben ausmachen. — Charles Dickens",
  "Nicht weil es schwer ist, wagen wir es nicht, sondern weil wir es nicht wagen, ist es schwer. — Seneca",
  "Das Glück entsteht oft durch Aufmerksamkeit in kleinen Dingen. — Wilhelm Busch",
  "Die beste Zeit für einen Neuanfang ist jetzt. — Unbekannt",
];
export default function HomeWelcome({ user }: { user: User }) {
  const [shuffledMessages, setShuffledMessages] = useState<string[]>([]);

  useEffect(() => {
    function shuffleArray(array: string[]) {
      const shuffled = [...array];

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      return shuffled;
    }

    setShuffledMessages(shuffleArray(welcomeMessages));
  }, []);

  const displayName = user.displayName ?? `${user.firstName} ${user.lastName}`;
  return (
    <div className="p-8 flex items-center ">
      {
        user.avatarUrl ? 

      <Avatar className="size-20">
        <AvatarImage alt="User" src={user.avatarUrl ?? ""} />
        <AvatarFallback className="text-2xl">
          {getInitials(user.displayName ?? user.email ?? "User")}{" "}
        </AvatarFallback>
      </Avatar>
      :
        
        <UserDefaultAvatar name={user.displayName ?? user.email ?? "User"} size={80} />
      }
      <div className="ml-4">
        <h1 className="text-4xl font-bold">Hi, {displayName} !</h1>
        <TypingAnimation
          as="p"
          className="text-sm text-foreground"
          words={shuffledMessages}
          typeSpeed={25}
          deleteSpeed={25}
          pauseDelay={120000}
          cursorStyle="underscore"
          startOnView
          showCursor={true}
          loop
        />
      </div>
    </div>
  );
}
