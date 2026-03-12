import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Image as ImageIcon, Utensils, Moon, Settings, MessageCircle, Info, Sparkles, Star, Tag, Lightbulb, Languages, Play, LogOut, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

export default function ParentView() {
  const { user, isLoading, loginMutation, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [translateEs, setTranslateEs] = useState(false);

  const { data: myChildren = [] } = useQuery({
    queryKey: ["/api/children"],
    enabled: !!user && user.role === "parent",
  });

  const firstChild = (myChildren as any[])[0];

  const { data: updates = [] } = useQuery({
    queryKey: ["/api/updates", firstChild?.id],
    queryFn: async () => {
      if (!firstChild) return [];
      const res = await fetch(`/api/updates/${firstChild.id}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!firstChild,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "parent") {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm rounded-3xl border-none shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-primary">Parent Login</h1>
              <p className="text-muted-foreground text-sm font-medium">Windsor Locks ELC</p>
            </div>
            <div className="space-y-4">
              <Input placeholder="Username" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="rounded-xl h-12" data-testid="input-username" />
              <Input type="password" placeholder="Password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="rounded-xl h-12" data-testid="input-password" onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate({ username: loginUser, password: loginPass })} />
              <Button className="w-full h-12 rounded-xl font-bold text-lg" onClick={() => loginMutation.mutate({ username: loginUser, password: loginPass })} disabled={loginMutation.isPending} data-testid="btn-login">
                {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </Button>
              {loginMutation.isError && <p className="text-destructive text-sm text-center font-medium">Invalid credentials.</p>}
            </div>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!firstChild) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome, {user.fullName}!</h2>
        <p className="text-muted-foreground mb-6">No children are linked to your account yet. Please contact the school administrator.</p>
        <Button variant="ghost" onClick={() => { logoutMutation.mutate(); setLocation("/"); }}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    );
  }

  const sortedUpdates = [...(updates as any[])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getIconForType = (type: string) => {
    switch (type) {
      case 'photo': return <ImageIcon className="w-5 h-5 text-secondary" />;
      case 'meal': return <Utensils className="w-5 h-5 text-accent" />;
      case 'nap': return <Moon className="w-5 h-5 text-primary" />;
      case 'learning': return <Info className="w-5 h-5 text-green-500" />;
      case 'milestone': return <Star className="w-5 h-5 text-accent" />;
      case 'arrival': return <Play className="w-5 h-5 text-blue-500" />;
      default: return <MessageCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'photo': return 'bg-secondary/10 border-secondary/20';
      case 'meal': return 'bg-accent/10 border-accent/20';
      case 'nap': return 'bg-primary/10 border-primary/20';
      case 'learning': return 'bg-green-500/10 border-green-500/20';
      case 'milestone': return 'bg-yellow-400/20 border-yellow-400/40';
      case 'arrival': return 'bg-blue-500/10 border-blue-500/20';
      default: return 'bg-muted border-border';
    }
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'calm': return '😌';
      case 'energetic': return '🤪';
      case 'tired': return '😴';
      case 'fussy': return '🥺';
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      <header className="bg-gradient-to-b from-primary to-primary/90 text-white p-6 pt-12 shadow-lg relative overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="max-w-xl mx-auto flex items-start justify-between relative z-10">
          <div className="flex gap-4 items-center">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10 -ml-2">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-white shadow-md bg-white/20 flex items-center justify-center text-2xl font-black">
                {firstChild.name.charAt(0)}
              </div>
              {sortedUpdates[0]?.mood && (
                <div className="absolute -bottom-1 -right-1 bg-green-400 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs">
                  {getMoodEmoji(sortedUpdates[0].mood)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black">{firstChild.name}</h1>
              <p className="text-white/90 font-medium text-sm tracking-wide bg-white/20 px-2 py-0.5 rounded-lg inline-block mt-1">
                Day in My World
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => logoutMutation.mutate()} data-testid="btn-logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 mt-4 space-y-8">
        <div className="flex justify-between items-center px-2 pt-2">
          <h2 className="text-2xl font-black text-foreground">Today</h2>
          <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{format(new Date(), 'EEEE, MMM do')}</span>
        </div>

        {sortedUpdates.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-medium text-lg">No updates yet today.</p>
            <p className="text-sm">Check back soon for {firstChild.name}'s daily activities!</p>
          </div>
        )}

        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.35rem] before:-translate-x-px before:h-full before:w-1 before:bg-gradient-to-b before:from-muted-foreground/20 before:via-muted-foreground/20 before:to-transparent">
          {sortedUpdates.map((update: any) => {
            const isMilestone = update.type === 'milestone';
            return (
              <div key={update.id} className="relative flex items-start group">
                <div className={`flex items-center justify-center w-11 h-11 rounded-full border-4 border-background ${getColorForType(update.type)} shadow-sm z-10 shrink-0`}>
                  {getIconForType(update.type)}
                </div>
                <Card className={`ml-4 w-full rounded-[2rem] border-none shadow-md overflow-hidden bg-card transition-all hover:shadow-lg ${isMilestone ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''}`}>
                  {update.imageUrl && (
                    <div className="w-full h-56 bg-muted relative">
                      <img src={update.imageUrl} alt="Update" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {format(new Date(update.timestamp), 'h:mm a')}
                        </span>
                        {update.mood && (
                          <span className="text-lg" title={`Mood: ${update.mood}`}>{getMoodEmoji(update.mood)}</span>
                        )}
                      </div>
                      <Heart className="w-5 h-5 text-muted-foreground/40 hover:text-secondary cursor-pointer transition-colors" />
                    </div>
                    {isMilestone && (
                      <div className="flex items-center gap-1.5 text-accent font-bold text-sm mb-2 uppercase tracking-wide">
                        <Star className="w-4 h-4 fill-accent" /> Moment of Growth
                      </div>
                    )}
                    <p className="text-foreground font-medium leading-relaxed text-[15px]">{update.content}</p>
                    {update.tags && update.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {update.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                            <Tag className="w-3 h-3 mr-1 inline" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
