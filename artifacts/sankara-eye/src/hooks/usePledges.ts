import { useQuery, useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

export function useListPledges() {
  return useQuery({
    queryKey: ["pledges"],
    queryFn: async () => {
      return customFetch<{ data: any[] }>("/api/pledges");
    }
  });
}

export function useSendPledgeCertificate() {
  return useMutation({
    mutationFn: async (id: number) => {
      return customFetch(`/api/pledges/${id}/certificate`, {
        method: "POST",
      });
    }
  });
}

export function useDeletePledge() {
  return useMutation({
    mutationFn: async (id: number) => {
      return customFetch(`/api/pledges/${id}`, {
        method: "DELETE",
      });
    }
  });
}
