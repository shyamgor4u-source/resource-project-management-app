import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { useDemoAuthContext } from '../App';
import { UserRole } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Shield, Users, BarChart3, Briefcase, UserCheck, Building2 } from 'lucide-react';

interface LoginPageProps {
  initialShowProfileSetup?: boolean;
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.admin]: 'Admin',
  [UserRole.pmo]: 'PMO',
  [UserRole.pm]: 'Project Manager',
  [UserRole.deliveryHead]: 'Delivery Head',
  [UserRole.management]: 'Management',
  [UserRole.employee]: 'Employee',
};

const DEMO_ROLES = [
  {
    role: UserRole.employee,
    label: 'Employee',
    description: 'View dashboard and log timesheets',
    icon: UserCheck,
    color: 'text-blue-500',
  },
  {
    role: UserRole.pm,
    label: 'Manager / PM',
    description: 'Manage projects, resources, and timesheets',
    icon: Briefcase,
    color: 'text-green-500',
  },
  {
    role: UserRole.deliveryHead,
    label: 'Delivery Head',
    description: 'Full access including reports',
    icon: Building2,
    color: 'text-purple-500',
  },
  {
    role: UserRole.pmo,
    label: 'PMO',
    description: 'Full access to all modules',
    icon: BarChart3,
    color: 'text-orange-500',
  },
];

export default function LoginPage({ initialShowProfileSetup = false }: LoginPageProps) {
  const { login, loginStatus } = useInternetIdentity();
  const { loginAsDemo } = useDemoAuthContext();
  const { data: userProfile } = useGetCallerUserProfile();
  const saveProfileMutation = useSaveCallerUserProfile();

  const [showProfileSetup, setShowProfileSetup] = useState(initialShowProfileSetup);
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState<UserRole>(UserRole.employee);

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.message === 'User is already authenticated') {
        // Already authenticated, profile setup will show
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    await saveProfileMutation.mutateAsync({
      name: profileName.trim(),
      appRole: profileRole,
    });
    setShowProfileSetup(false);
  };

  if (showProfileSetup && !userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <img src="/assets/generated/teamtrack-logo.dim_128x128.png" alt="TeamTrack" className="h-12 w-12" />
            </div>
            <CardTitle>Set Up Your Profile</CardTitle>
            <CardDescription>Tell us a bit about yourself to get started</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role">Your Role</Label>
              <Select value={profileRole} onValueChange={(v) => setProfileRole(v as UserRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={!profileName.trim() || saveProfileMutation.isPending}
              className="w-full"
            >
              {saveProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg flex flex-col items-center gap-8">
        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/assets/generated/teamtrack-logo.dim_128x128.png"
            alt="TeamTrack"
            className="h-16 w-16"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">TeamTrack</h1>
            <p className="text-muted-foreground mt-1">Resource & Project Management</p>
          </div>
        </div>

        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="demo">Demo Access</TabsTrigger>
            <TabsTrigger value="identity">Internet Identity</TabsTrigger>
          </TabsList>

          {/* Demo Tab */}
          <TabsContent value="demo" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Try as a Role</CardTitle>
                <CardDescription>
                  Explore the app instantly with pre-configured demo data — no wallet needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_ROLES.map(({ role, label, description, icon: Icon, color }) => (
                  <button
                    key={role}
                    onClick={() => loginAsDemo(role)}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
                  >
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
                    <div>
                      <div className="text-sm font-medium text-foreground">{label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Internet Identity Tab */}
          <TabsContent value="identity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Secure Login
                </CardTitle>
                <CardDescription>
                  Sign in with Internet Identity for persistent, on-chain data storage.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Your data is stored securely on the Internet Computer blockchain. No passwords
                    required.
                  </p>
                </div>
                <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full">
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    'Connect with Internet Identity'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground text-center">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'teamtrack-rmg')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
