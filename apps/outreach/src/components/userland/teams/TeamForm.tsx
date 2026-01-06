'use strict';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react"; // Import X icon
import toast from "react-hot-toast";
import { CreateTeam, createTeamSchema } from "@melinia/shared";
import { team_management } from "../../../services/teams";
import { Spinner } from "@melinia/outreach/src/components/common/Spinner"; // Assuming you have a spinner

interface CreateTeamFormProps {
  onClose: () => void;
}

export const CreateTeamForm: React.FC<CreateTeamFormProps> = ({ onClose }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTeam>({
    resolver: zodResolver(createTeamSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      member_emails: [],
    },
  });

  // Mutation for creating the team
  const createTeamMutation = useMutation({
    mutationFn: team_management.createTeam,
    onSuccess: () => {
      toast.success("Team created successfully");
      queryClient.invalidateQueries({ queryKey: ["teams"] }); // Refresh the list
      reset(); // Clear form
      onClose(); // Close the modal
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create team");
    },
  });

  const onSubmit = (data: CreateTeam) => {
    createTeamMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Create New Team</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            type="button"
          >
            <X width={20} height={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Team Name */}
          <div>
            <label
              className={`block text-xs font-medium mb-1.5 ${
                errors.name ? "text-red-400" : "text-zinc-400"
              }`}
            >
              Team Name *
            </label>
            <input
              type="text"
              placeholder="Enter team name"
              {...register("name")}
              className={`w-full bg-zinc-950 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors ${
                errors.name
                  ? "border-red-500 text-red-100 placeholder-red-300/50 focus:ring-red-500"
                  : "border-zinc-700 text-white placeholder-zinc-600 focus:border-white focus:ring-white"
              }`}
            />
            {errors.name && (
              <p className="text-red-400 text-[10px] mt-1">{errors.name.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={createTeamMutation.isPending}
            className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm text-zinc-900 font-semibold hover:bg-white transition disabled:opacity-70 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
          >
            {createTeamMutation.isPending ? (
              <>
                <Spinner /> Creating...
              </>
            ) : (
              "Create Team"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};