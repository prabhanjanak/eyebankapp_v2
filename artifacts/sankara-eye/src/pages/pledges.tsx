import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Mail, CheckCircle2, User, Phone, MapPin, Activity, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useListPledges, useSendPledgeCertificate, useDeletePledge } from "../hooks/usePledges";

export function PledgesDashboard() {
  const { data, isLoading, error } = useListPledges();
  const sendCertificate = useSendPledgeCertificate();
  const deletePledge = useDeletePledge();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isSuperAdmin = user?.role === "super_admin";

  const handleSendCertificate = (id: number) => {
    setSendingId(id);
    sendCertificate.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Certificate Sent!",
          description: "The pledge certificate has been successfully sent via Email and WhatsApp.",
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ["pledges"] });
        setSendingId(null);
      },
      onError: (err) => {
        toast({
          title: "Failed to send",
          description: err.message || "An error occurred while sending the certificate.",
          variant: "destructive",
        });
        setSendingId(null);
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId === null) return;
    setDeletingId(deleteConfirmId);
    setDeleteConfirmId(null);
    deletePledge.mutate(deleteConfirmId, {
      onSuccess: () => {
        toast({
          title: "Pledge Deleted",
          description: `Pledge #P${deleteConfirmId} has been permanently removed.`,
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ["pledges"] });
        setDeletingId(null);
      },
      onError: (err: any) => {
        toast({
          title: "Delete Failed",
          description: err?.data?.error || err.message || "Could not delete this pledge.",
          variant: "destructive",
        });
        setDeletingId(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff7a18]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        Failed to load pledges data: {error.message || "Unknown error"}
      </div>
    );
  }

  const pledges = data?.data || [];
  const pledgeToDelete = pledges.find((p: any) => p.id === deleteConfirmId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Counters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-['Outfit'] bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Living Eye Pledges
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-bold text-gray-700">{pledges.length}</span> Total Registered Pledges
          </p>
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-xl shadow-slate-200/20 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-xl">
        {/* Desktop Table View — Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400 py-5 w-[80px]">Pledge ID</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400 py-5 min-w-[200px]">Donor Demographics</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400 py-5 hidden md:table-cell">Contact Info</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400 py-5">Date Pledged</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400 py-5 text-center">Certificate</TableHead>
                {isSuperAdmin && (
                  <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400 py-5 text-center w-[80px]">Delete</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pledges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 6 : 5} className="text-center py-16 text-slate-500 bg-white">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-400">No pledges found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pledges.map((pledge: any) => (
                  <TableRow 
                    key={pledge.id} 
                    className="group border-b border-slate-100 hover:bg-orange-50/30 transition-colors"
                  >
                    <TableCell className="font-bold font-sans text-slate-700 py-4 align-top">
                      #P{pledge.id}
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-sm text-slate-800 capitalize tracking-tight flex items-center gap-1.5">
                          {pledge.fullName}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Activity className="h-3 w-3" /> Blood Group: {pledge.bloodGroup || "N/A"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {pledge.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 align-top hidden md:table-cell">
                      <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600 font-sans">
                        <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {pledge.mobile}</span>
                        <span className="flex items-center gap-1.5 text-slate-500"><Mail className="h-3 w-3" /> {pledge.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">
                          {format(new Date(pledge.pledgedAt), "MMM d, yyyy")}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {format(new Date(pledge.pledgedAt), "hh:mm a")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 align-top text-center">
                      {pledge.isCertificateSent ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100/50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                          </span>
                          <Button 
                            onClick={() => handleSendCertificate(pledge.id)}
                            disabled={sendCertificate.isPending}
                            size="sm"
                            variant="outline"
                            className="border-gray-250 hover:bg-slate-50 text-slate-600 rounded-xl h-8 px-2.5 text-[9px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            {sendCertificate.isPending && sendingId === pledge.id ? <Loader2 className="h-3 w-3 animate-spin text-[#ff7a18]" /> : <RefreshCw className="h-3 w-3 text-[#ff7a18]" />}
                            Send Again
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleSendCertificate(pledge.id)}
                          disabled={sendCertificate.isPending}
                          size="sm"
                          className="bg-[#ff7a18] hover:bg-[#e66a12] text-white rounded-xl h-8 text-[10px] font-extrabold uppercase tracking-wider shadow-sm cursor-pointer"
                        >
                          {sendCertificate.isPending && sendingId === pledge.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send Certificate"}
                        </Button>
                      )}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell className="py-4 align-top text-center">
                        <Button
                          onClick={() => setDeleteConfirmId(pledge.id)}
                          disabled={deletingId === pledge.id}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                          title="Delete pledge"
                        >
                          {deletingId === pledge.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile List View — Vertical Cards instead of table */}
        <div className="md:hidden divide-y divide-gray-100 bg-white">
          {pledges.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-semibold text-xs">
              No pledges found.
            </div>
          ) : (
            pledges.map((pledge: any) => (
              <div key={pledge.id} className="p-4 space-y-3 hover:bg-orange-50/20 active:bg-orange-50/40 transition-colors">
                {/* Header Row: ID and Delete */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md">#P{pledge.id}</span>
                  {isSuperAdmin && (
                    <Button
                      onClick={() => setDeleteConfirmId(pledge.id)}
                      disabled={deletingId === pledge.id}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Pledger Name & Demographics */}
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{pledge.fullName}</h3>
                  <div className="flex flex-wrap gap-x-2 text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                    <span>BG: {pledge.bloodGroup || "N/A"}</span>
                    <span>•</span>
                    <span>Date: {format(new Date(pledge.pledgedAt), "dd MMM, yyyy")}</span>
                  </div>
                </div>

                {/* Contact and address box */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 space-y-1.5 text-[11px]">
                  <div>
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[8.5px] block">Address</span>
                    <span className="font-bold text-gray-700">{pledge.address}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="font-bold text-gray-400 uppercase tracking-widest text-[8.5px] block">Phone</span>
                      <span className="font-bold text-gray-700">{pledge.mobile}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-400 uppercase tracking-widest text-[8.5px] block">Email</span>
                      <span className="font-bold text-gray-700 truncate block">{pledge.email}</span>
                    </div>
                  </div>
                </div>

                {/* Certificate Action bar */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-bold">
                    Pledge Date: {format(new Date(pledge.pledgedAt), "h:mm a")}
                  </span>
                  <div>
                    {pledge.isCertificateSent ? (
                      <div className="flex items-center gap-1.5">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md">Sent</span>
                        <Button 
                          onClick={() => handleSendCertificate(pledge.id)}
                          disabled={sendCertificate.isPending}
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-[9px] font-bold uppercase rounded-xl border-slate-200"
                        >
                          Send Again
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleSendCertificate(pledge.id)}
                        disabled={sendCertificate.isPending}
                        size="sm"
                        className="bg-[#ff7a18] hover:bg-[#e66a12] text-white text-[10px] font-bold uppercase rounded-xl h-8 px-3"
                      >
                        Send Certificate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-base font-extrabold text-gray-900">Delete Pledge Entry</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete pledge{" "}
              <span className="font-bold text-gray-700">
                #P{deleteConfirmId} — {pledgeToDelete?.fullName}
              </span>
              ? This action <span className="text-red-600 font-bold">cannot be undone</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
              onClick={handleDeleteConfirm}
              disabled={deletePledge.isPending}
            >
              {deletePledge.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
