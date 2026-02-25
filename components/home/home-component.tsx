import HomeCard from "@/components/home/home-card";
import HomeWelcome from "./home-welcome";
import HomeActivity from "./home-activity";

export default function HomeComponent() {
  return (
    <>
      <div>
        <HomeWelcome />
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-7">
        <HomeCard />
        <HomeActivity />
      </div>
      {/* <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" /> */}
    </>
  );
}
