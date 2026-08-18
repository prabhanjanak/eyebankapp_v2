import { useState } from "react";
import {
  useListUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useToggleUserActive,
  useResetUserPassword,
  useListUnits,
  AppUser,
  UserInput,
  UserUpdate,
  AppUserRole,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Shield,
  User,
  Info,
  Building,
  Edit2,
  Trash2,
  KeyRound,
  Search,
  Filter,
  AlertTriangle,
  Copy,
  Check,
  Fingerprint,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface UserFormState {
  name: string;
  email: string;
  role: string;
  unitId: string; // 'none' or ID as string
  isActive: boolean;
  biometricEnabled: boolean;
}

const initialFormState: UserFormState = {
  name: "",
  email: "",
  role: "unit_coordinator",
  unitId: "none",
  isActive: true,
  biometricEnabled: false,
};

export default function Users() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const { data: users, isLoading: isUsersLoading } = useListUsers();
  const { data: units, isLoading: isUnitsLoading } = useListUnits();

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const toggleUserActiveMutation = useToggleUserActive();
  const resetUserPasswordMutation = useResetUserPassword();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<UserFormState>(initialFormState);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formError, setFormError] = useState("");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<AppUser | null>(null);
  const [tempPassword, setTempPassword] = useState("Welcome@123");
  const [copied, setCopied] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormState(initialFormState);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormState({
      name: user.name,
      email: user.email,
      role: user.role,
      unitId: user.unitId ? user.unitId.toString() : "none",
      isActive: user.isActive,
      biometricEnabled: (user as any).biometricEnabled ?? false,
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleOpenDelete = (user: AppUser) => {
    setDeletingUser(user);
    setIsDeleteOpen(true);
  };

  const handleOpenReset = (user: AppUser) => {
    setResettingUser(user);
    setTempPassword("Welcome@123");
    setResetSuccess(false);
    setCopied(false);
    setFormError("");
    setIsResetOpen(true);
  };

  const validateForm = (): boolean => {
    if (!formState.name.trim()) {
      setFormError("Full name is required");
      return false;
    }
    if (!editingUser) {
      if (!formState.email.trim()) {
        setFormError("Email address is required");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
        setFormError("Please enter a valid email address");
        return false;
      }
    }
    if (formState.role === "unit_coordinator" && formState.unitId === "none") {
      setFormError("A hospital branch must be assigned for Unit Coordinators");
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) return;

    try {
      const selectedUnitId = formState.unitId === "none" ? null : parseInt(formState.unitId, 10);

      if (editingUser) {
        // Update user
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          data: {
            name: formState.name.trim(),
            role: formState.role as any,
            unitId: selectedUnitId,
            isActive: formState.isActive,
            biometricEnabled: formState.biometricEnabled,
          } as any,
        });
        toast({
          title: "User Updated",
          description: `Successfully updated coordinator settings for "${formState.name}".`,
        });
      } else {
        // Create user with default password
        await createUserMutation.mutateAsync({
          data: {
            name: formState.name.trim(),
            email: formState.email.trim(),
            role: formState.role as any,
            unitId: selectedUnitId,
            password: "Welcome@123", // initial password
          },
        });
        toast({
          title: "Staff Created",
          description: `Created account for "${formState.name}" with default password "Welcome@123".`,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err?.data?.error || err?.message || "Failed to save user account. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteUserMutation.mutateAsync({ id: deletingUser.id });
      toast({
        title: "Account Removed",
        description: `Successfully deleted staff user "${deletingUser.name}".`,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteOpen(false);
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err?.data?.error || err?.message || "Failed to remove staff account.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (user: AppUser) => {
    try {
      await toggleUserActiveMutation.mutateAsync({ id: user.id });
      toast({
        title: user.isActive ? "Account Disabled" : "Account Activated",
        description: `Successfully toggled status for ${user.name}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch (err: any) {
      toast({
        title: "Status Toggle Failed",
        description: err?.data?.error || err?.message || "Failed to toggle active state.",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    if (tempPassword.trim().length < 8) {
      setFormError("Temporary password must be at least 8 characters long");
      return;
    }

    try {
      await resetUserPasswordMutation.mutateAsync({
        id: resettingUser.id,
        data: { newPassword: tempPassword.trim() },
      });
      setResetSuccess(true);
      toast({
        title: "Password Reset",
        description: `Successfully reset password for ${resettingUser.name}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch (err: any) {
      setFormError(err?.data?.error || err?.message || "Failed to reset password.");
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (currentUser?.role !== "super_admin" && currentUser?.role !== "eye_bank_head") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center bg-gray-50/50 rounded-3xl border border-gray-100 p-8">
        <Shield className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">Only Super Admins or Eye Bank Heads can manage staff user accounts.</p>
      </div>
    );
  }

  // Filter and search computation
  const filteredUsers = users?.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const isSaving = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Users</h1>
          <p className="text-gray-500">Manage coordinators, administrators, and regional branches.</p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white shadow-sm transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Create User
        </Button>
      </div>

      <div className="bg-[#f4f7fe] border border-blue-100/50 rounded-2xl p-4 flex items-start gap-3 shadow-sm bg-gradient-to-r from-orange-50/40 to-blue-50/20">
        <Info className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-gray-800 text-sm">Security & Staff Onboarding</h4>
          <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">
            All regional branch coordinators must be registered by HQ. Public registration is restricted.
            Newly-created staff accounts are assigned a temporary password (<code className="bg-white/80 border border-orange-100 px-1 rounded text-orange-600 font-semibold">Welcome@123</code>) and are forced to configure a secure password on their very first log in.
          </p>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50/50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent rounded-xl"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5 shrink-0 select-none">
            <Filter className="h-3.5 w-3.5" /> Filter Role:
          </span>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-gray-50/50 border-gray-200 text-gray-800 rounded-xl">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-150">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="eye_bank_head">Eye Bank Head</SelectItem>
              <SelectItem value="unit_coordinator">Unit Coordinator</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border border-gray-150 shadow-md rounded-2xl overflow-hidden bg-white">
        {/* Desktop Table View — Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow className="border-b border-gray-100">
                <TableHead className="font-semibold text-gray-700">User Details</TableHead>
                <TableHead className="font-semibold text-gray-700">Role</TableHead>
                <TableHead className="font-semibold text-gray-700">Assigned Branch</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">First Login Password</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isUsersLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="py-4">
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !filteredUsers || filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                    No users matching search filters found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100/80 p-2 rounded-xl text-[#ff7a18] border border-orange-100/50">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold text-[11px] bg-gray-50 text-gray-700 border-gray-200 uppercase tracking-wider select-none">
                        {user.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.unitName ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                          <Building className="h-3.5 w-3.5 text-[#ff7a18]" />
                          {user.unitName}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">All Branches (HQ)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        onClick={() => handleToggleActive(user)}
                        className={`border-0 select-none cursor-pointer font-medium ${
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {user.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.mustChangePassword ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 select-none animate-pulse font-semibold">
                          Change Required
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 select-none font-semibold">
                          Completed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(user)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                          title="Edit User Settings"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenReset(user)}
                          className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                          title="Reset Password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        {user.email !== currentUser.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDelete(user)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            title="Delete Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile List View — Vertical Cards instead of table */}
        <div className="md:hidden divide-y divide-gray-100 bg-white">
          {isUsersLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : !filteredUsers || filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs font-semibold">
              No users matching search filters found.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4 space-y-3 hover:bg-orange-50/20 active:bg-orange-50/40 transition-colors">
                {/* User Top Info: Avatar Name, Email & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-100 p-2 rounded-xl text-[#ff7a18]">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{user.name}</h4>
                      <p className="text-[10px] font-semibold text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <Badge
                    onClick={() => handleToggleActive(user)}
                    className={`border-0 select-none cursor-pointer font-bold text-[10px] ${
                      user.isActive
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    {user.isActive ? "Active" : "Disabled"}
                  </Badge>
                </div>

                {/* Role & Branch details */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[8.5px] block">Role</span>
                    <span className="font-bold text-gray-700 capitalize">{user.role.replace("_", " ")}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[8.5px] block">Branch</span>
                    <span className="font-bold text-gray-700 block truncate">
                      {user.unitName || "All Branches (HQ)"}
                    </span>
                  </div>
                </div>

                {/* Password status and actions row */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[8.5px] block mb-0.5">First Login Password</span>
                    {user.mustChangePassword ? (
                      <span className="bg-amber-50 text-amber-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-100 select-none animate-pulse">
                        Required
                      </span>
                    ) : (
                      <span className="bg-green-50 text-green-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-green-100 select-none">
                        Completed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(user)}
                      className="h-8 px-2.5 text-[10px] font-bold uppercase rounded-xl border-slate-200"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReset(user)}
                      className="h-8 px-2.5 text-[10px] font-bold text-amber-700 border-amber-200 hover:bg-amber-50 rounded-xl"
                    >
                      Reset Password
                    </Button>
                    {user.email !== currentUser.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDelete(user)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* CREATE & EDIT DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-[480px] rounded-2xl bg-white border border-gray-150">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingUser ? "Edit Coordinator Settings" : "Create Staff Account"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              {editingUser
                ? "Update full name, roles, or regional branch assignments for this coordinator."
                : "Register a new branch coordinator or eye bank administrator into the system."}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive" className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3">
              <AlertDescription className="text-sm font-medium leading-snug">
                {formError}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-name" className="text-sm font-semibold text-gray-700">
                Full Name
              </Label>
              <Input
                id="user-name"
                placeholder="e.g. Dr. Rajesh Kumar"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent rounded-lg"
                disabled={isSaving}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-email" className="text-sm font-semibold text-gray-700">
                Email Address
              </Label>
              <Input
                id="user-email"
                type="email"
                placeholder="name@sankaraeye.com"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent rounded-lg disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={!!editingUser || isSaving}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="user-role" className="text-sm font-semibold text-gray-700">
                  System Role
                </Label>
                <Select
                  value={formState.role}
                  onValueChange={(val) => {
                    const nextUnitId = val !== "unit_coordinator" ? "none" : formState.unitId;
                    setFormState({ ...formState, role: val, unitId: nextUnitId });
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger id="user-role" className="bg-white border-gray-200 text-gray-800 rounded-lg">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-150">
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="eye_bank_head">Eye Bank Head</SelectItem>
                    <SelectItem value="unit_coordinator">Unit Coordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-unit" className="text-sm font-semibold text-gray-700">
                  Hospital Branch Assignment
                </Label>
                <Select
                  value={formState.unitId}
                  onValueChange={(val) => setFormState({ ...formState, unitId: val })}
                  disabled={formState.role !== "unit_coordinator" || isSaving}
                >
                  <SelectTrigger id="user-unit" className="bg-white border-gray-200 text-gray-800 rounded-lg disabled:opacity-50">
                    <SelectValue placeholder={formState.role !== "unit_coordinator" ? "All branches (HQ)" : "Assign Branch"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-150">
                    <SelectItem value="none">HQ - All Branches</SelectItem>
                    {isUnitsLoading ? (
                      <SelectItem value="loading" disabled>Loading units...</SelectItem>
                    ) : (
                      units?.filter(u => u.isActive).map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editingUser && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="space-y-0.5">
                    <Label htmlFor="user-active" className="text-sm font-semibold text-gray-800 cursor-pointer">
                      Account Active Status
                    </Label>
                    <p className="text-xs text-gray-500">Suspended users cannot log in or manage eye donation data.</p>
                  </div>
                  <Switch
                    id="user-active"
                    checked={formState.isActive}
                    onCheckedChange={(checked) => setFormState({ ...formState, isActive: checked })}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50/50 rounded-xl border border-orange-100/50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Fingerprint className="h-3.5 w-3.5 text-orange-600" />
                      <Label htmlFor="user-biometric" className="text-sm font-semibold text-gray-800 cursor-pointer">
                        Biometric Access
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500">Enable fingerprint login capability for this staff member.</p>
                  </div>
                  <Switch
                    id="user-biometric"
                    checked={formState.biometricEnabled}
                    onCheckedChange={(checked) => setFormState({ ...formState, biometricEnabled: checked })}
                    disabled={isSaving}
                  />
                </div>
              </div>
            )}

            {!editingUser && (
              <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-800 leading-snug">
                  The initial password will be set to <span className="font-semibold">Welcome@123</span>. The coordinator will be forced to change this immediately upon their first login attempt.
                </p>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : editingUser ? (
                  "Save Changes"
                ) : (
                  "Create Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PASSWORD RESET DIALOG */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-[420px] rounded-2xl bg-white border border-gray-150">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" /> Reset Staff Password
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              Generate a temporary password to restore access for coordinator <span className="font-semibold text-gray-900">"{resettingUser?.name}"</span>.
            </DialogDescription>
          </DialogHeader>

          {resetSuccess ? (
            <div className="space-y-4 pt-2">
              <Alert className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-3 flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs">✓</div>
                <AlertDescription className="text-sm font-medium leading-snug">
                  Password has been reset successfully. Provide the temporary password below to the staff member.
                </AlertDescription>
              </Alert>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Temporary Password</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-gray-800 font-semibold select-all text-center">
                    {tempPassword}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyPassword}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 shrink-0 h-10 w-10 p-0 rounded-lg"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed">
                <strong>Attention Coordinator:</strong> The user will be automatically prompted to configure a new personal password immediately upon signing in with this temporary key.
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setIsResetOpen(false)}
                  className="w-full bg-[#ff7a18] hover:bg-orange-600 text-white font-semibold rounded-lg shadow-sm"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
              {formError && (
                <Alert variant="destructive" className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3">
                  <AlertDescription className="text-sm font-medium leading-snug">
                    {formError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="temp-pass" className="text-sm font-semibold text-gray-700">
                  New Temporary Password
                </Label>
                <Input
                  id="temp-pass"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="e.g. Welcome@123"
                  className="bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent rounded-lg font-mono font-semibold text-center"
                  disabled={resetUserPasswordMutation.isPending}
                  required
                />
                <p className="text-xs text-gray-400">Must be at least 8 characters long.</p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResetOpen(false)}
                  className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  disabled={resetUserPasswordMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                  disabled={resetUserPasswordMutation.isPending}
                >
                  {resetUserPasswordMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-[400px] rounded-2xl bg-white border border-gray-150">
          <DialogHeader className="flex flex-col items-center text-center gap-2">
            <div className="h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm mt-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900 mt-2">Delete Staff Account?</DialogTitle>
            <DialogDescription className="text-gray-500 text-sm leading-snug">
              Are you sure you want to permanently delete user <span className="font-semibold text-gray-900">"{deletingUser?.name}"</span> ({deletingUser?.email})?
              This action will restrict all portal access for this coordinator immediately and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex sm:flex-row gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-all"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
