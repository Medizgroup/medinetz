/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/generated/prisma/client";
import { getInitials } from "@/lib/helper/user";
import { TypingAnimation } from "../ui/typing-animation";
import { useEffect, useState } from "react";

const welcomeMessages = [
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
      <Avatar className="size-20">
        <AvatarImage alt="User" src={user.avatarUrl ?? ""} />
        <AvatarFallback className="text-2xl">
          {getInitials(user.displayName ?? user.email ?? "User")}{" "}
        </AvatarFallback>
      </Avatar>
      <div className="ml-4">
        <h1 className="text-4xl font-bold">Hallo, {displayName} !</h1>
        <TypingAnimation
          as="p"
          className="text-sm text-muted-foreground"
          words={shuffledMessages}
          typeSpeed={60}
          deleteSpeed={10}
          pauseDelay={10000}
          cursorStyle="underscore"
          startOnView
          showCursor={false}
          loop
        />
      </div>
    </div>
  );
}
