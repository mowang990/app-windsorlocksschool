import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ShieldCheck, Plus, Users, UserCog, Baby, Building2, Search, ArrowLeft, Loader2, Trash2, Pencil, LogOut, Link2, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminView() {
  const { user, isLoading, loginMutation, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isRecoverMode, setIsRecoverMode] = useState(false);
  const [recoverApiKey, setRecoverApiKey] = useState("");
  const [recoverNewPassword, setRecoverNewPassword] = useState("");
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const { toast } = useToast();

  const { data: setupStatus } = useQuery({
    queryKey: ["/api/auth/setup-status"],
    queryFn: async () => {
      const res = await fetch("/api/auth/setup-status");
      return res.json();
    },
    enabled: !user,
  });

  const recoverMutation = useMutation({
    mutationFn: async (data: { apiKey: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/auth/admin-recover", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsRecoverMode(false);
      setRecoverApiKey("");
      setRecoverNewPassword("");
      toast({ title: "Password reset! You are now signed in." });
    },
    onError: (e: any) => {
      toast({ title: "Recovery failed", description: e.message, variant: "destructive" });
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; fullName: string; email: string }) => {
      const res = await apiRequest("POST", "/api/auth/setup", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/setup-status"] });
      toast({ title: "Admin account created! You are now signed in." });
    },
    onError: (e: any) => {
      toast({ title: "Setup failed", description: e.message, variant: "destructive" });
    },
  });

  // Form states
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childClassId, setChildClassId] = useState("");
  const [childDialogOpen, setChildDialogOpen] = useState(false);

  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentUsername, setParentUsername] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [parentDialogOpen, setParentDialogOpen] = useState(false);

  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherUsername, setTeacherUsername] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);

  const [className, setClassName] = useState("");
  const [classAgeRange, setClassAgeRange] = useState("");
  const [classDialogOpen, setClassDialogOpen] = useState(false);

  const [linkParentId, setLinkParentId] = useState("");
  const [linkChildId, setLinkChildId] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const [assignTeacherId, setAssignTeacherId] = useState("");
  const [assignClassId, setAssignClassId] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const [resetUserId, setResetUserId] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const [changeCurrentPassword, setChangeCurrentPassword] = useState("");
  const [changeNewPassword, setChangeNewPassword] = useState("");
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);

  const [searchChildren, setSearchChildren] = useState("");
  const [searchParents, setSearchParents] = useState("");
  const [searchTeachers, setSearchTeachers] = useState("");

  // Queries
  const { data: childrenList = [] } = useQuery({ queryKey: ["/api/children"], enabled: !!user && user.role === "admin" });
  const { data: parentsList = [] } = useQuery({ queryKey: ["/api/users/role/parent"], enabled: !!user && user.role === "admin" });
  const { data: teachersList = [] } = useQuery({ queryKey: ["/api/users/role/teacher"], enabled: !!user && user.role === "admin" });
  const { data: classesList = [] } = useQuery({ queryKey: ["/api/classes"], enabled: !!user && user.role === "admin" });
  const { data: teacherClassLinks = [] } = useQuery({ queryKey: ["/api/teacher-classes"], enabled: !!user && user.role === "admin" });

  // Mutations
  const createChildMut = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/children", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/children"] }); setChildDialogOpen(false); setChildName(""); setChildAge(""); setChildClassId(""); toast({ title: "Child registered!" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const deleteChildMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/children/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/children"] }); toast({ title: "Child removed" }); },
  });

  const createParentMut = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/users", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users/role/parent"] }); setParentDialogOpen(false); setParentName(""); setParentEmail(""); setParentUsername(""); setParentPassword(""); toast({ title: "Parent account created!" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const deleteParentMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/users/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users/role/parent"] }); toast({ title: "Parent removed" }); },
  });

  const createTeacherMut = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/users", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users/role/teacher"] }); setTeacherDialogOpen(false); setTeacherName(""); setTeacherEmail(""); setTeacherUsername(""); setTeacherPassword(""); toast({ title: "Teacher account created!" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const deleteTeacherMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/users/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users/role/teacher"] }); toast({ title: "Teacher removed" }); },
  });

  const createClassMut = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/classes", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/classes"] }); setClassDialogOpen(false); setClassName(""); setClassAgeRange(""); toast({ title: "Class created!" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const deleteClassMut = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/classes/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/classes"] }); toast({ title: "Class removed" }); },
  });

  const linkParentChildMut = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/parent-children", data); return res.json(); },
    onSuccess: () => { setLinkDialogOpen(false); setLinkParentId(""); setLinkChildId(""); toast({ title: "Parent linked to child!" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const assignTeacherMut = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/teacher-classes", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/teacher-classes"] }); setAssignDialogOpen(false); setAssignTeacherId(""); setAssignClassId(""); toast({ title: "Teacher assigned to class!" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const unassignTeacherMut = useMutation({
    mutationFn: async ({ teacherId, classId }: { teacherId: string; classId: string }) => { await apiRequest("DELETE", `/api/teacher-classes/${teacherId}/${classId}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/teacher-classes"] }); toast({ title: "Teacher removed from class" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const resetPasswordMut = useMutation({
    mutationFn: async (data: { userId: string; newPassword: string }) => { const res = await apiRequest("POST", "/api/auth/reset-password", data); return res.json(); },
    onSuccess: () => { setResetDialogOpen(false); setResetUserId(""); setResetNewPassword(""); toast({ title: "Password reset successfully!" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const changePasswordMut = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => { const res = await apiRequest("POST", "/api/auth/change-password", data); return res.json(); },
    onSuccess: () => { setChangePasswordDialogOpen(false); setChangeCurrentPassword(""); setChangeNewPassword(""); toast({ title: "Your password has been changed!" }); },
    onError: (e: any) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const showSetup = setupStatus?.needsSetup === true || isSetupMode;

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm rounded-3xl border-none shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <ShieldCheck className="w-12 h-12 text-primary mx-auto" />
              <h1 className="text-2xl font-black text-primary">{isRecoverMode ? "Recover Admin" : showSetup ? "Set Up Admin" : "Admin Login"}</h1>
              <p className="text-muted-foreground text-sm font-medium">Windsor Locks ELC</p>
            </div>

            {isRecoverMode ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">Verify you're the server owner by entering your Gmail App Password, then set a new password.</p>
                <Input type="password" placeholder="Gmail App Password" value={recoverApiKey} onChange={(e) => setRecoverApiKey(e.target.value)} className="rounded-xl h-12" data-testid="input-recover-key" />
                <Input type="password" placeholder="New Password (min 6 characters)" value={recoverNewPassword} onChange={(e) => setRecoverNewPassword(e.target.value)} className="rounded-xl h-12" data-testid="input-recover-password" onKeyDown={(e) => e.key === "Enter" && recoverMutation.mutate({ apiKey: recoverApiKey, newPassword: recoverNewPassword })} />
                <Button className="w-full h-12 rounded-xl font-bold text-lg" onClick={() => recoverMutation.mutate({ apiKey: recoverApiKey, newPassword: recoverNewPassword })} disabled={!recoverApiKey || recoverNewPassword.length < 6 || recoverMutation.isPending} data-testid="btn-recover">
                  {recoverMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                </Button>
                {recoverMutation.isError && <p className="text-destructive text-sm text-center font-medium">Recovery failed. Check your Gmail App Password.</p>}
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setIsRecoverMode(false)}>
                  Back to Sign In
                </Button>
              </div>
            ) : showSetup ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">Create the first administrator account for your school.</p>
                <Input placeholder="Full Name" value={setupName} onChange={(e) => setSetupName(e.target.value)} className="rounded-xl h-12" data-testid="input-setup-name" />
                <Input type="email" placeholder="Email" value={setupEmail} onChange={(e) => setSetupEmail(e.target.value)} className="rounded-xl h-12" data-testid="input-setup-email" />
                <Input placeholder="Choose a Username" value={setupUsername} onChange={(e) => setSetupUsername(e.target.value)} className="rounded-xl h-12" data-testid="input-setup-username" />
                <Input type="password" placeholder="Choose a Password" value={setupPassword} onChange={(e) => setSetupPassword(e.target.value)} className="rounded-xl h-12" data-testid="input-setup-password" onKeyDown={(e) => e.key === "Enter" && setupMutation.mutate({ fullName: setupName, email: setupEmail, username: setupUsername, password: setupPassword })} />
                <Button className="w-full h-12 rounded-xl font-bold text-lg" onClick={() => setupMutation.mutate({ fullName: setupName, email: setupEmail, username: setupUsername, password: setupPassword })} disabled={!setupName || !setupUsername || !setupPassword || setupMutation.isPending} data-testid="btn-setup">
                  {setupMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Admin Account"}
                </Button>
                {setupMutation.isError && <p className="text-destructive text-sm text-center font-medium">Setup failed. Please try again.</p>}
                {!setupStatus?.needsSetup && (
                  <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setIsSetupMode(false)}>
                    Already have an account? Sign In
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Input placeholder="Username" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="rounded-xl h-12" data-testid="input-username" />
                <Input type="password" placeholder="Password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="rounded-xl h-12" data-testid="input-password" onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate({ username: loginUser, password: loginPass })} />
                <Button className="w-full h-12 rounded-xl font-bold text-lg" onClick={() => loginMutation.mutate({ username: loginUser, password: loginPass })} disabled={loginMutation.isPending} data-testid="btn-login">
                  {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                </Button>
                {loginMutation.isError && <p className="text-destructive text-sm text-center font-medium">Invalid credentials.</p>}
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={() => setIsRecoverMode(true)}>
                    Forgot Password?
                  </Button>
                  <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={() => setIsSetupMode(true)}>
                    First time? Set up Admin Account
                  </Button>
                </div>
              </div>
            )}

            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredChildren = (childrenList as any[]).filter((c: any) => c.name.toLowerCase().includes(searchChildren.toLowerCase()));
  const filteredParents = (parentsList as any[]).filter((p: any) => p.fullName.toLowerCase().includes(searchParents.toLowerCase()));
  const filteredTeachers = (teachersList as any[]).filter((t: any) => t.fullName.toLowerCase().includes(searchTeachers.toLowerCase()));

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <header className="bg-primary text-primary-foreground p-6 pt-12 shadow-md sticky top-0 z-10 rounded-b-3xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10"><ArrowLeft className="h-6 w-6" /></Button>
            </Link>
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><ShieldCheck className="w-6 h-6" /></div>
            <div>
              <h1 className="text-2xl font-bold">Admin Portal</h1>
              <p className="text-primary-foreground/80 text-sm font-medium">Manage ELC Accounts & Access</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Dialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" data-testid="btn-open-change-pw" title="Change Your Password"><Pencil className="h-5 w-5" /></Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-primary">Change Your Password</DialogTitle>
                  <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label className="font-bold">Current Password</Label>
                    <Input type="password" placeholder="Enter current password" className="rounded-xl" value={changeCurrentPassword} onChange={(e) => setChangeCurrentPassword(e.target.value)} data-testid="input-current-password" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold">New Password</Label>
                    <Input type="password" placeholder="Min 6 characters" className="rounded-xl" value={changeNewPassword} onChange={(e) => setChangeNewPassword(e.target.value)} data-testid="input-new-password" />
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full rounded-xl h-12 text-lg font-bold" onClick={() => changePasswordMut.mutate({ currentPassword: changeCurrentPassword, newPassword: changeNewPassword })} disabled={!changeCurrentPassword || changeNewPassword.length < 6 || changePasswordMut.isPending} data-testid="btn-change-password">
                    {changePasswordMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Change Password"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" data-testid="btn-open-reset" title="Reset User Password"><KeyRound className="h-5 w-5" /></Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-primary">Reset User Password</DialogTitle>
                  <DialogDescription>Select a user and set their new password. They will be notified by email if configured.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label className="font-bold">User</Label>
                    <Select value={resetUserId} onValueChange={setResetUserId}>
                      <SelectTrigger className="rounded-xl" data-testid="select-reset-user"><SelectValue placeholder="Select a user" /></SelectTrigger>
                      <SelectContent>
                        {[...(teachersList as any[]), ...(parentsList as any[])].map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>{u.fullName} ({u.role})</SelectItem>
                        ))}
                        {user && <SelectItem value={user.id}>{user.fullName} (admin)</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold">New Password</Label>
                    <Input type="password" placeholder="Min 6 characters" className="rounded-xl" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} data-testid="input-reset-password" />
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full rounded-xl h-12 text-lg font-bold" onClick={() => resetPasswordMut.mutate({ userId: resetUserId, newPassword: resetNewPassword })} disabled={!resetUserId || resetNewPassword.length < 6 || resetPasswordMut.isPending} data-testid="btn-reset-password">
                    {resetPasswordMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => logoutMutation.mutate()} data-testid="btn-logout"><LogOut className="h-5 w-5" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-6">
        <Tabs defaultValue="children" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full h-14 rounded-2xl bg-card shadow-sm border border-muted p-1">
            <TabsTrigger value="children" className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><Baby className="w-4 h-4 mr-2" /> Children</TabsTrigger>
            <TabsTrigger value="parents" className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><Users className="w-4 h-4 mr-2" /> Parents</TabsTrigger>
            <TabsTrigger value="teachers" className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><UserCog className="w-4 h-4 mr-2" /> Teachers</TabsTrigger>
            <TabsTrigger value="classes" className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"><Building2 className="w-4 h-4 mr-2" /> Classes</TabsTrigger>
          </TabsList>

          {/* CHILDREN TAB */}
          <TabsContent value="children" className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-2xl shadow-sm border border-muted gap-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search children..." className="pl-9 bg-muted/50 border-none rounded-xl" value={searchChildren} onChange={(e) => setSearchChildren(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl font-bold"><Link2 className="w-4 h-4 mr-2" /> Link Parent</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-primary">Link Parent to Child</DialogTitle>
                      <DialogDescription>Choose the parent and the child to connect.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label className="font-bold">Parent</Label>
                        <Select value={linkParentId} onValueChange={setLinkParentId}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select parent" /></SelectTrigger>
                          <SelectContent>{(parentsList as any[]).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label className="font-bold">Child</Label>
                        <Select value={linkChildId} onValueChange={setLinkChildId}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select child" /></SelectTrigger>
                          <SelectContent>{(childrenList as any[]).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button className="w-full rounded-xl h-12 text-lg font-bold" onClick={() => linkParentChildMut.mutate({ parentId: linkParentId, childId: linkChildId })} disabled={!linkParentId || !linkChildId || linkParentChildMut.isPending}>
                        {linkParentChildMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Link"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={childDialogOpen} onOpenChange={setChildDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl font-bold bg-accent text-accent-foreground hover:bg-accent/90" data-testid="btn-add-child"><Plus className="w-4 h-4 mr-2" /> Add Child</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-primary">Register New Child</DialogTitle>
                      <DialogDescription>Enter the child's details below.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label className="font-bold">Full Name</Label>
                        <Input placeholder="e.g. Leo Smith" className="rounded-xl" value={childName} onChange={(e) => setChildName(e.target.value)} data-testid="input-child-name" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="font-bold">Age (Months)</Label>
                        <Input type="number" placeholder="e.g. 24" className="rounded-xl" value={childAge} onChange={(e) => setChildAge(e.target.value)} data-testid="input-child-age" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="font-bold">Assign to Class</Label>
                        <Select value={childClassId} onValueChange={setChildClassId}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a class" /></SelectTrigger>
                          <SelectContent>{(classesList as any[]).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.ageRange})</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button className="w-full rounded-xl h-12 text-lg font-bold" onClick={() => createChildMut.mutate({ name: childName, ageMonths: parseInt(childAge), classId: childClassId || null })} disabled={!childName || !childAge || createChildMut.isPending} data-testid="btn-save-child">
                        {createChildMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Profile"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            {filteredChildren.length === 0 && <div className="text-center py-12 text-muted-foreground font-medium">No children registered yet. Click "Add Child" to get started.</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredChildren.map((child: any) => (
                <Card key={child.id} className="rounded-2xl border-none shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-black text-primary">{child.name.charAt(0)}</div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground" data-testid={`text-child-${child.id}`}>{child.name}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{child.ageMonths} months old</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-full" onClick={() => deleteChildMut.mutate(child.id)} data-testid={`btn-delete-child-${child.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* PARENTS TAB */}
          <TabsContent value="parents" className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-2xl shadow-sm border border-muted gap-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search parents..." className="pl-9 bg-muted/50 border-none rounded-xl" value={searchParents} onChange={(e) => setSearchParents(e.target.value)} />
              </div>
              <Dialog open={parentDialogOpen} onOpenChange={setParentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl font-bold bg-primary text-primary-foreground" data-testid="btn-add-parent"><Plus className="w-4 h-4 mr-2" /> Add Parent</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary">Create Parent Account</DialogTitle>
                    <DialogDescription>Set up login credentials for the parent.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label className="font-bold">Full Name</Label>
                      <Input placeholder="Parent name" className="rounded-xl" value={parentName} onChange={(e) => setParentName(e.target.value)} data-testid="input-parent-name" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="font-bold">Email</Label>
                      <Input type="email" placeholder="parent@example.com" className="rounded-xl" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} data-testid="input-parent-email" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="font-bold">Username</Label>
                      <Input placeholder="Choose a username" className="rounded-xl" value={parentUsername} onChange={(e) => setParentUsername(e.target.value)} data-testid="input-parent-username" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="font-bold">Password</Label>
                      <Input type="password" placeholder="Set a password" className="rounded-xl" value={parentPassword} onChange={(e) => setParentPassword(e.target.value)} data-testid="input-parent-password" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button className="w-full rounded-xl h-12 text-lg font-bold" onClick={() => createParentMut.mutate({ fullName: parentName, email: parentEmail, username: parentUsername, password: parentPassword, role: "parent" })} disabled={!parentName || !parentUsername || !parentPassword || createParentMut.isPending} data-testid="btn-save-parent">
                      {createParentMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {filteredParents.length === 0 && <div className="text-center py-12 text-muted-foreground font-medium">No parents registered yet.</div>}
            <Card className="rounded-2xl border-none shadow-md overflow-hidden">
              {filteredParents.length > 0 && (
                <>
                  <div className="p-4 bg-muted/30 border-b border-muted flex font-bold text-sm text-muted-foreground">
                    <div className="flex-1">Name</div>
                    <div className="flex-1">Email</div>
                    <div className="flex-1">Username</div>
                    <div className="w-16"></div>
                  </div>
                  <div className="divide-y divide-muted">
                    {filteredParents.map((p: any) => (
                      <div key={p.id} className="p-4 flex items-center hover:bg-muted/10 transition-colors">
                        <div className="flex-1 font-bold text-foreground">{p.fullName}</div>
                        <div className="flex-1 text-sm text-muted-foreground">{p.email || "—"}</div>
                        <div className="flex-1 text-sm text-muted-foreground">{p.username}</div>
                        <div className="w-16 text-right">
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-full" onClick={() => deleteParentMut.mutate(p.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </TabsContent>

          {/* TEACHERS TAB */}
          <TabsContent value="teachers" className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-2xl shadow-sm border border-muted gap-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search teachers..." className="pl-9 bg-muted/50 border-none rounded-xl" value={searchTeachers} onChange={(e) => setSearchTeachers(e.target.value)} />
              </div>
              <Dialog open={teacherDialogOpen} onOpenChange={setTeacherDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="btn-add-teacher"><Plus className="w-4 h-4 mr-2" /> Add Teacher</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary">Create Teacher Account</DialogTitle>
                    <DialogDescription>Set up login credentials for the teacher.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label className="font-bold">Full Name</Label>
                      <Input placeholder="Teacher name" className="rounded-xl" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} data-testid="input-teacher-name" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="font-bold">Email</Label>
                      <Input type="email" placeholder="teacher@example.com" className="rounded-xl" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} data-testid="input-teacher-email" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="font-bold">Username</Label>
                      <Input placeholder="Choose a username" className="rounded-xl" value={teacherUsername} onChange={(e) => setTeacherUsername(e.target.value)} data-testid="input-teacher-username" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="font-bold">Password</Label>
                      <Input type="password" placeholder="Set a password" className="rounded-xl" value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} data-testid="input-teacher-password" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button className="w-full rounded-xl h-12 text-lg font-bold" onClick={() => createTeacherMut.mutate({ fullName: teacherName, email: teacherEmail, username: teacherUsername, password: teacherPassword, role: "teacher" })} disabled={!teacherName || !teacherUsername || !teacherPassword || createTeacherMut.isPending} data-testid="btn-save-teacher">
                      {createTeacherMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {filteredTeachers.length === 0 && <div className="text-center py-12 text-muted-foreground font-medium">No teachers registered yet.</div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredTeachers.map((t: any) => (
                <Card key={t.id} className="rounded-2xl border-none shadow-md overflow-hidden relative">
                  <div className="h-16 bg-gradient-to-r from-secondary/40 to-primary/40"></div>
                  <CardContent className="p-6 pt-0 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-card rounded-full p-1 -mt-8 mb-3 shadow-sm flex items-center justify-center text-xl font-black text-primary border-2 border-card">
                      {t.fullName.charAt(0)}
                    </div>
                    <h3 className="font-bold text-lg">{t.fullName}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{t.email || t.username}</p>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteTeacherMut.mutate(t.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Remove
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* CLASSES TAB */}
          <TabsContent value="classes" className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-2xl shadow-sm border border-muted gap-4">
              <h3 className="font-bold text-foreground">Classrooms</h3>
              <div className="flex gap-2">
                <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl font-bold" data-testid="btn-assign-teacher"><UserCog className="w-4 h-4 mr-2" /> Assign Teacher</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-primary">Assign Teacher to Class</DialogTitle>
                      <DialogDescription>Select a teacher and a class to link them.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label className="font-bold">Teacher</Label>
                        <Select value={assignTeacherId} onValueChange={setAssignTeacherId}>
                          <SelectTrigger className="rounded-xl" data-testid="select-assign-teacher"><SelectValue placeholder="Select a teacher" /></SelectTrigger>
                          <SelectContent>
                            {(teachersList as any[]).map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label className="font-bold">Class</Label>
                        <Select value={assignClassId} onValueChange={setAssignClassId}>
                          <SelectTrigger className="rounded-xl" data-testid="select-assign-class"><SelectValue placeholder="Select a class" /></SelectTrigger>
                          <SelectContent>
                            {(classesList as any[]).map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button className="w-full rounded-xl h-12 text-lg font-bold" onClick={() => assignTeacherMut.mutate({ teacherId: assignTeacherId, classId: assignClassId })} disabled={!assignTeacherId || !assignClassId || assignTeacherMut.isPending} data-testid="btn-save-assign">
                        {assignTeacherMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Assign Teacher"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl font-bold" data-testid="btn-add-class"><Plus className="w-4 h-4 mr-2" /> Add Class</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-primary">Create Classroom</DialogTitle>
                      <DialogDescription>Define a new class group.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label className="font-bold">Class Name</Label>
                        <Input placeholder="e.g. Toddlers" className="rounded-xl" value={className} onChange={(e) => setClassName(e.target.value)} data-testid="input-class-name" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="font-bold">Age Range</Label>
                        <Input placeholder="e.g. 18-36 months" className="rounded-xl" value={classAgeRange} onChange={(e) => setClassAgeRange(e.target.value)} data-testid="input-class-age" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button className="w-full rounded-xl h-12 text-lg font-bold" onClick={() => createClassMut.mutate({ name: className, ageRange: classAgeRange })} disabled={!className || !classAgeRange || createClassMut.isPending} data-testid="btn-save-class">
                        {createClassMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Class"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            {(classesList as any[]).length === 0 && <div className="text-center py-12 text-muted-foreground font-medium">No classes created yet.</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(classesList as any[]).map((c: any) => {
                const assignedLinks = (teacherClassLinks as any[]).filter((l: any) => l.classId === c.id);
                const assignedTeachers = assignedLinks.map((l: any) => (teachersList as any[]).find((t: any) => t.id === l.teacherId)).filter(Boolean);
                return (
                  <Card key={c.id} className="rounded-2xl border-none shadow-md">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="w-6 h-6 text-primary" /></div>
                          <div>
                            <h3 className="font-bold text-lg text-foreground">{c.name}</h3>
                            <p className="text-sm text-muted-foreground font-medium">{c.ageRange}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-full" onClick={() => deleteClassMut.mutate(c.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {assignedTeachers.length > 0 ? (
                        <div className="space-y-2 pl-16">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Assigned Teachers</p>
                          {assignedTeachers.map((t: any) => (
                            <div key={t.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold text-secondary">{t.fullName.charAt(0)}</div>
                                <span className="text-sm font-medium">{t.fullName}</span>
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => unassignTeacherMut.mutate({ teacherId: t.id, classId: c.id })} data-testid={`btn-unassign-${t.id}-${c.id}`}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground pl-16 italic">No teachers assigned yet</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
