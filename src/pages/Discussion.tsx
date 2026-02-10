import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, Clock, ArrowLeft, MessageSquare } from "lucide-react";

const mockRooms = [
  { id: 1, topic: "AI Ethics in Modern Society", participants: 5, maxParticipants: 8, duration: "30 min", status: "Live" },
  { id: 2, topic: "Remote Work: Pros and Cons", participants: 3, maxParticipants: 6, duration: "25 min", status: "Starting Soon" },
  { id: 3, topic: "Climate Change Solutions", participants: 7, maxParticipants: 8, duration: "20 min", status: "Live" },
  { id: 4, topic: "Future of Education Technology", participants: 2, maxParticipants: 6, duration: "30 min", status: "Open" },
];

const mockParticipants = [
  { name: "Priya S.", initials: "PS", speaking: true },
  { name: "Alex M.", initials: "AM", speaking: false },
  { name: "Jordan T.", initials: "JT", speaking: false },
  { name: "Sam K.", initials: "SK", speaking: false },
  { name: "You", initials: "YO", speaking: false },
];

const Discussion = () => {
  const [view, setView] = useState<"browse" | "room">("browse");

  if (view === "browse") {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Group Discussions</h1>
          <p className="text-muted-foreground mb-8">Join a live discussion room to practice your communication skills</p>
          <div className="grid md:grid-cols-2 gap-4">
            {mockRooms.map((room) => (
              <Card key={room.id} className="border-border/50 hover:shadow-lg hover:shadow-primary/10 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg leading-tight">{room.topic}</h3>
                    <Badge variant={room.status === "Live" ? "default" : "secondary"} className={room.status === "Live" ? "gradient-primary border-0" : ""}>
                      {room.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {room.participants}/{room.maxParticipants}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {room.duration}</span>
                  </div>
                  <Button className="w-full gradient-primary border-0" onClick={() => setView("room")}>Join Discussion</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => setView("browse")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Rooms
        </Button>
        <Card className="border-border/50">
          <CardHeader className="text-center border-b border-border">
            <Badge className="mx-auto mb-2 gradient-primary border-0">Live Discussion</Badge>
            <CardTitle className="text-2xl">AI Ethics in Modern Society</CardTitle>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> 5 participants</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 24:35 remaining</span>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {mockParticipants.map((p) => (
                <div key={p.name} className="text-center">
                  <Avatar className={`h-16 w-16 mx-auto mb-2 ${p.speaking ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
                    <AvatarFallback className={p.speaking ? "gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
                      {p.initials}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{p.name}</p>
                  {p.speaking && <Badge variant="secondary" className="text-xs mt-1">Speaking</Badge>}
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <Button className="gradient-primary border-0">
                <MessageSquare className="mr-2 h-4 w-4" /> Raise Hand
              </Button>
              <Button variant="outline" onClick={() => setView("browse")}>Leave Room</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Discussion;
