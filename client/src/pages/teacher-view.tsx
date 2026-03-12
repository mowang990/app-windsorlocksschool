import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Image as ImageIcon, Utensils, Moon, Sparkles, Activity, Search, Mic, MicOff, Wand2, Tag, Check, Loader2, LogOut, SmilePlus, Camera, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type DevelopmentalTag = "communication" | "social-emotional" | "physical" | "early math" | "creativity";
type UpdateType = "note" | "photo" | "meal" | "nap" | "learning" | "mood" | "milestone";
type Mood = "happy" | "calm" | "energetic" | "tired" | "fussy";

const availableTags: DevelopmentalTag[] = ["communication", "social-emotional", "physical", "early math", "creativity"];

const moods: { value: Mood; emoji: string; label: string }[] = [
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "calm", emoji: "😌", label: "Calm" },
  { value: "energetic", emoji: "🤪", label: "Energetic" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "fussy", emoji: "🥺", label: "Fussy" },
];

function ChildUpdateDialog({ child, user, onSuccess }: { child: any; user: any; onSuccess: () => void }) {
  const { toast } = useToast();
  const [noteText, setNoteText] = useState("");
  const [selectedType, setSelectedType] = useState<UpdateType>("note");
  const [selectedTags, setSelectedTags] = useState<DevelopmentalTag[]>([]);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      if (selectedType !== "photo") setSelectedType("photo");
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleTag = (tag: DevelopmentalTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Speech recognition not supported", description: "Please use Chrome, Edge, or Safari for voice input.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = noteText;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + transcript;
        } else {
          interim = transcript;
        }
      }
      setNoteText(finalTranscript + (interim ? " " + interim : ""));
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (event.error === "not-allowed") {
        toast({ title: "Microphone access denied", description: "Please allow microphone access in your browser settings.", variant: "destructive" });
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [noteText, toast]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleMagicWand = () => {
    if (!noteText.trim()) return;
    setIsGenerating(true);
    const raw = noteText;
    setTimeout(() => {
      const formatted = raw.charAt(0).toUpperCase() + raw.slice(1);
      const ending = formatted.endsWith(".") ? "" : ".";
      setNoteText(formatted + ending + " Great progress in their development today!");

      const lower = raw.toLowerCase();
      const suggested: DevelopmentalTag[] = [];
      if (/count|number|sort|match|shape|pattern|math|size/.test(lower)) suggested.push("early math");
      if (/talk|word|speak|said|name|story|read|book|sing|song|letter/.test(lower)) suggested.push("communication");
      if (/shar|friend|turn|help|together|cooperat|play with|group|emotion|feeling|kind/.test(lower)) suggested.push("social-emotional");
      if (/run|jump|climb|throw|catch|stack|build|walk|balance|motor|kick|push|pull/.test(lower)) suggested.push("physical");
      if (/paint|draw|color|art|creat|imagin|pretend|music|dance|craft|design|build/.test(lower)) suggested.push("creativity");
      if (suggested.length === 0) suggested.push("communication");

      setSelectedTags(prev => {
        const combined = new Set([...prev, ...suggested]);
        return Array.from(combined) as DevelopmentalTag[];
      });
      setIsGenerating(false);
    }, 1200);
  };

  const handleSubmit = async () => {
    if (!noteText.trim() && !photoFile) {
      toast({ title: "Please add a note or photo", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (photoFile) {
        const formData = new FormData();
        formData.append("photo", photoFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
        if (!uploadRes.ok) throw new Error("Photo upload failed");
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }
      await apiRequest("POST", "/api/updates", {
        childId: child.id,
        type: selectedType,
        content: noteText || "📷 Photo update",
        tags: selectedTags,
        mood: selectedMood,
        imageUrl,
      });
      toast({ title: "Update posted!", description: `Timeline updated for ${child.name}.` });
      setNoteText("");
      setSelectedTags([]);
      setSelectedMood(null);
      setSelectedType("note");
      clearPhoto();
      queryClient.invalidateQueries({ queryKey: ["/api/updates"] });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Failed to post", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, []);

  const typeButtons: { type: UpdateType; icon: any; label: string; hoverClass: string }[] = [
    { type: "photo", icon: ImageIcon, label: "Photo", hoverClass: "hover:bg-secondary/10 hover:text-secondary hover:border-secondary" },
    { type: "meal", icon: Utensils, label: "Meal", hoverClass: "hover:bg-accent hover:text-accent-foreground hover:border-accent" },
    { type: "nap", icon: Moon, label: "Nap", hoverClass: "hover:bg-primary/10 hover:text-primary hover:border-primary" },
    { type: "learning", icon: Activity, label: "Activity", hoverClass: "hover:bg-green-500/10 hover:text-green-600 hover:border-green-500" },
    { type: "milestone", icon: Sparkles, label: "Milestone", hoverClass: "hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-5 gap-2">
        {typeButtons.map(({ type, icon: Icon, label, hoverClass }) => {
          const isActive = selectedType === type;
          return (
            <Button
              key={type}
              variant="outline"
              className={`h-16 flex flex-col gap-1 rounded-2xl border-2 transition-all group p-0 ${isActive ? 'border-primary bg-primary/10 text-primary' : hoverClass}`}
              onClick={() => setSelectedType(type)}
              data-testid={`type-btn-${type}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-inherit'}`} />
              <span className="text-[10px] font-bold">{label}</span>
            </Button>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-foreground">Observations</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-bold text-primary bg-primary/10 rounded-full"
            onClick={handleMagicWand}
            disabled={!noteText.trim() || isGenerating}
            data-testid="auto-format-btn"
          >
            {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
            Auto-Format
          </Button>
        </div>
        <div className="relative">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Quick notes or tap the mic for voice..."
            className={`min-h-[120px] resize-none rounded-2xl bg-muted/30 border-2 pr-14 pb-4 transition-all ${isGenerating ? 'opacity-50 blur-[1px]' : ''} ${isRecording ? 'border-red-400 bg-red-50/30' : ''}`}
            data-testid="note-textarea"
          />
          <Button
            size="icon"
            variant={isRecording ? "destructive" : "secondary"}
            className={`absolute bottom-3 right-3 rounded-full w-10 h-10 shadow-md transition-transform ${isRecording ? 'animate-pulse scale-110' : ''}`}
            onClick={handleMicClick}
            data-testid="mic-btn"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          {isRecording && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-red-500">Listening...</span>
            </div>
          )}
        </div>

        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handlePhotoSelect} className="hidden" data-testid="photo-input" />
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1 rounded-xl border-2 border-dashed h-12" onClick={() => fileInputRef.current?.click()} data-testid="btn-add-photo">
            <Camera className="w-4 h-4 mr-2" /> Add Photo
          </Button>
        </div>

        {photoPreview && (
          <div className="relative inline-block">
            <img src={photoPreview} alt="Preview" className="w-full max-h-48 object-cover rounded-2xl border-2 border-muted" />
            <Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full w-7 h-7 shadow-md" onClick={clearPhoto} data-testid="btn-clear-photo">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="font-bold text-sm text-foreground flex items-center">
          <SmilePlus className="w-4 h-4 mr-2 text-muted-foreground" />
          Mood
        </h4>
        <div className="flex gap-2">
          {moods.map(m => (
            <Button
              key={m.value}
              variant="outline"
              className={`flex-1 h-12 rounded-xl border-2 text-lg transition-all ${selectedMood === m.value ? 'border-primary bg-primary/10 scale-105' : ''}`}
              onClick={() => setSelectedMood(selectedMood === m.value ? null : m.value)}
              data-testid={`mood-${m.value}`}
            >
              <span className="mr-1">{m.emoji}</span>
              <span className="text-[10px] font-bold hidden sm:inline">{m.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-bold text-sm text-foreground flex items-center">
          <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
          Developmental Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <Badge
                key={tag}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer capitalize px-3 py-1.5 rounded-xl transition-all select-none ${isSelected ? 'shadow-sm bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:bg-muted'}`}
                onClick={() => toggleTag(tag)}
                data-testid={`tag-${tag}`}
              >
                {tag}
                {isSelected && <Check className="w-3 h-3 ml-1 inline-block" />}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="pt-4">
        <Button
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg"
          onClick={handleSubmit}
          disabled={isSubmitting || !noteText.trim()}
          data-testid="post-update-btn"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
          {isSubmitting ? "Posting..." : "Post to Timeline"}
        </Button>
      </div>
    </div>
  );
}

export default function TeacherView() {
  const { user, isLoading, loginMutation, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: childrenList = [] } = useQuery({
    queryKey: ["/api/children"],
    enabled: !!user && (user.role === "teacher" || user.role === "admin"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm rounded-3xl border-none shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-black text-primary">Teacher Login</h1>
              <p className="text-muted-foreground text-sm font-medium">Windsor Locks ELC</p>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Username"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="rounded-xl h-12"
                data-testid="input-username"
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="rounded-xl h-12"
                data-testid="input-password"
                onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate({ username: loginUser, password: loginPass })}
              />
              <Button
                className="w-full h-12 rounded-xl font-bold text-lg"
                onClick={() => loginMutation.mutate({ username: loginUser, password: loginPass })}
                disabled={loginMutation.isPending}
                data-testid="btn-login"
              >
                {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </Button>
              {loginMutation.isError && (
                <p className="text-destructive text-sm text-center font-medium">Invalid credentials. Please try again.</p>
              )}
            </div>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filtered = (childrenList as any[]).filter((c: any) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <header className="bg-primary text-primary-foreground p-6 pt-12 shadow-md sticky top-0 z-10 rounded-b-3xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{user.fullName}</h1>
              <p className="text-primary-foreground/80 text-sm font-medium">Teacher • {filtered.length} Children</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => logoutMutation.mutate()} data-testid="btn-logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 mt-4 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search for a child..."
            className="pl-12 h-14 rounded-2xl bg-card border-none shadow-sm text-lg font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-children"
          />
        </div>

        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-foreground">Your Class</h2>
          <Badge variant="outline" className="bg-white/50 text-muted-foreground border-none shadow-sm font-bold">
            <Sparkles className="w-3 h-3 mr-1 text-primary" /> AI Assistant Active
          </Badge>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="font-medium text-lg">No children found.</p>
            <p className="text-sm">Ask your administrator to add children to the system.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {filtered.map((child: any) => (
            <Dialog key={child.id} open={openDialogId === child.id} onOpenChange={(open) => setOpenDialogId(open ? child.id : null)}>
              <DialogTrigger asChild>
                <Card className="rounded-3xl border-none shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden group bg-card">
                  <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-muted group-hover:border-accent transition-colors bg-primary/10 flex items-center justify-center text-2xl font-black text-primary">
                        {child.name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                        <Plus className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground" data-testid={`child-name-${child.id}`}>{child.name}</h3>
                      <p className="text-xs text-muted-foreground font-semibold">{child.ageMonths}m</p>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-none bg-card">
                <div className="bg-primary/10 p-6 flex flex-col items-center text-center pb-8 rounded-b-[3rem] sticky top-0 z-10 backdrop-blur-md">
                  <DialogTitle className="text-2xl font-black text-foreground mt-2">Update {child.name}</DialogTitle>
                  <DialogDescription className="text-muted-foreground font-medium text-sm">Log an activity or milestone</DialogDescription>
                </div>
                <ChildUpdateDialog child={child} user={user} onSuccess={() => setOpenDialogId(null)} />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </main>
    </div>
  );
}
