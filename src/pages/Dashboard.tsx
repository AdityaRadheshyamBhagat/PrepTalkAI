import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { MotionCard, MotionButton, MotionStagger, MotionItem } from "@/components/MotionElements";
import { Mic, Users, TrendingUp, Flame, Target, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const stats = [
  { label: "Sessions Completed", value: "24", icon: Target, color: "text-primary" },
  { label: "Average Score", value: "82%", icon: TrendingUp, color: "text-primary" },
  { label: "Practice Streak", value: "7 days", icon: Flame, color: "text-primary" },
];

const recentSessions = [
  { id: 1, type: "AI Interview", topic: "React Fundamentals", score: 85, date: "Feb 8, 2026", status: "Completed" },
  { id: 2, type: "Group Discussion", topic: "AI in Healthcare", score: 78, date: "Feb 7, 2026", status: "Completed" },
  { id: 3, type: "AI Interview", topic: "System Design", score: 90, date: "Feb 6, 2026", status: "Completed" },
  { id: 4, type: "AI Interview", topic: "Behavioral Questions", score: 72, date: "Feb 5, 2026", status: "Completed" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const displayName = user?.displayName || "Student";

  return (
    <DashboardLayout>
      {/* Welcome */}
      <MotionItem>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Welcome back, {displayName}! 👋</h1>
          <p className="text-muted-foreground">Keep up the great work. Here's your progress overview.</p>
        </div>
      </MotionItem>

      {/* Quick Actions */}
      <MotionStagger className="grid md:grid-cols-2 gap-4 mb-8">
        <MotionItem>
          <MotionCard>
            <Card className="group hover:shadow-lg hover:shadow-primary/10 transition-shadow border-border/50 cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <Mic className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Start AI Interview</h3>
                  <p className="text-sm text-muted-foreground">Practice with an AI interviewer</p>
                </div>
                <MotionButton>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/interview"><ArrowRight className="h-5 w-5" /></Link>
                  </Button>
                </MotionButton>
              </CardContent>
            </Card>
          </MotionCard>
        </MotionItem>
        <MotionItem>
          <MotionCard>
            <Card className="group hover:shadow-lg hover:shadow-primary/10 transition-shadow border-border/50 cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Users className="h-7 w-7 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Join Discussion</h3>
                  <p className="text-sm text-muted-foreground">Collaborate in group sessions</p>
                </div>
                <MotionButton>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to="/discussion"><ArrowRight className="h-5 w-5" /></Link>
                  </Button>
                </MotionButton>
              </CardContent>
            </Card>
          </MotionCard>
        </MotionItem>
      </MotionStagger>

      {/* Stats */}
      <MotionStagger className="grid md:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <MotionItem key={s.label}>
            <MotionCard>
              <Card className="border-border/50">
                <CardContent className="p-6 flex items-center gap-4">
                  <s.icon className={`h-8 w-8 ${s.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </MotionCard>
          </MotionItem>
        ))}
      </MotionStagger>

      {/* Recent Sessions */}
      <MotionItem>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.type}</TableCell>
                    <TableCell>{s.topic}</TableCell>
                    <TableCell>
                      <span className={s.score >= 80 ? "text-primary font-semibold" : "text-muted-foreground"}>{s.score}%</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.date}</TableCell>
                    <TableCell><Badge variant="secondary">{s.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </MotionItem>
    </DashboardLayout>
  );
};

export default Dashboard;
