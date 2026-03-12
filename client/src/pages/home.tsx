import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Baby, Users, ShieldCheck } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4 flex flex-col items-center">
          <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center shadow-lg border-4 border-white">
            <Baby className="w-14 h-14 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Windsor Locks ELC</h1>
          <p className="text-muted-foreground text-lg font-medium">Daily Updates & Connections</p>
        </div>

        <Card className="border-2 border-muted shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Welcome!</CardTitle>
            <CardDescription className="text-base">Select your role to sign in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              size="lg"
              className="w-full h-16 text-lg font-bold bg-secondary hover:bg-secondary/90 text-white rounded-2xl shadow-sm transition-transform hover:scale-[1.02]"
              onClick={() => setLocation("/parent")}
              data-testid="btn-parent-login"
            >
              <Users className="w-6 h-6 mr-2" />
              Parent Login
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full h-16 text-lg font-bold border-2 border-primary text-primary hover:bg-primary/10 rounded-2xl shadow-sm transition-transform hover:scale-[1.02]"
              onClick={() => setLocation("/teacher")}
              data-testid="btn-teacher-login"
            >
              <Baby className="w-6 h-6 mr-2" />
              Teacher Login
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="w-full h-14 text-base font-semibold text-muted-foreground hover:text-foreground rounded-2xl"
              onClick={() => setLocation("/admin")}
              data-testid="btn-admin-login"
            >
              <ShieldCheck className="w-5 h-5 mr-2" />
              Administrator Access
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
