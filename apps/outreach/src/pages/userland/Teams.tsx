import { useEffect, useState, useRef } from "react";
import { Plus, Xmark, Mail, User, Trash, Check, Clock } from "iconoir-react";
import toast from "react-hot-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { type CreateTeam, createTeamSchema} from "@melinia/shared";
import api from "../../services/api";
import { team_management } from "../../services/teams";

// Validation schema
interface Team {
  id: string;
  team_name: string;
  event_id: string | null;
  event_name: string | null;
  leader_id: string;
  member_count: string;
}

interface PendingInvite {
  invitation_id: number;
  team_id: string;
  invitee_id: string;
  invitee_email: string;
  invitee_first_name: string;
  invitee_last_name: string;
  inviter_id: string;
  inviter_email: string;
  status: string;
}

const Teams = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const detailsModalRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTeam>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      member_emails: [],
    },
  });

  const watchedEmails = watch("member_emails");

  // Fetch teams
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      const response = await api.get("/teams");
      return response.data.data || [];
    },
  });

  // Fetch pending invites for selected team
  const { data: pendingInvites = [] } = useQuery<PendingInvite[]>({
    queryKey: ["pending-invites", selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      const response = await api.get(`/teams/${selectedTeamId}/pending-invites`);
      return response.data.data || [];
    },
    enabled: !!selectedTeamId,
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (values: CreateTeam) => {
      const formData:CreateTeam = {
        name: values.name,
        member_emails: values.member_emails
      }

      await team_management.createTeam(formData);
   },
    onSuccess: () => {
      toast.success("Team created successfully!");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      reset();
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create team.");
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await team_management.deleteTeam(teamId);
    },
    onSuccess: () => {
      toast.success("Team deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setSelectedTeamId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete team.");
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: { teamId: string; email: string }) => {
      await api.post(`/teams/${data.teamId}/members`, { email: data.email });
    },
    onSuccess: () => {
      toast.success("Member added successfully!");
      queryClient.invalidateQueries({ queryKey: ["pending-invites", selectedTeamId] });
      setEmailInput("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add member.");
    },
  });

  // Remove pending invite mutation
  const removePendingInviteMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      await api.delete(`/teams/invitations/${invitationId}`);
    },
    onSuccess: () => {
      toast.success("Invitation removed!");
      queryClient.invalidateQueries({ queryKey: ["pending-invites", selectedTeamId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to remove invitation.");
    },
  });

  // Handle adding email
  const handleAddEmail = () => {
    if (!emailInput.trim()) {
      toast.error("Please enter an email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      toast.error("Please enter a valid email");
      return;
    }
    if (watchedEmails.includes(emailInput)) {
      toast.error("Email already added");
      return;
    }
    setValue("member_emails", [...watchedEmails, emailInput]);
    setEmailInput("");
  };

  // Handle removing email
  const handleRemoveEmail = (email: string) => {
    setValue("member_emails", watchedEmails.filter((e) => e !== email));
  };

  // Handle form submission
  const onSubmit = (data: CreateTeam) => {
    createTeamMutation.mutate(data);
  };

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsCreateModalOpen(false);
      }
    };
    if (isCreateModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isCreateModalOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsModalRef.current && !detailsModalRef.current.contains(event.target as Node)) {
        setSelectedTeamId(null);
      }
    };
    if (selectedTeamId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [selectedTeamId]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  const getInputClass = (hasError: boolean = false) => {
    const base = "w-full rounded-lg bg-zinc-950 border px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-colors duration-200";
    const errorClass = hasError ? "border-red-500 focus:ring-red-500/50" : "border-zinc-800 focus:ring-zinc-600";
    return `${base} ${errorClass}`;
  };

  return (
    <div className="w-full font-geist text-base text-zinc-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Teams</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm text-zinc-900 font-semibold hover:bg-white transition"
        >
          <Plus width={18} height={18} />
          New Team
        </button>
      </div>

      {/* Teams List */}
      {teamsLoading ? (
        <div className="text-center py-8 text-zinc-400">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12">
          <User width={48} height={48} className="mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-400 mb-4">No teams yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all hover:shadow-lg"
            >
              <h3 className="font-semibold text-zinc-100 mb-2">{team.team_name}</h3>
              <div className="space-y-1 text-xs text-zinc-400">
                {team.event_name && <p>Event: {team.event_name}</p>}
                <p>Members: {team.member_count}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Create New Team</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <Xmark width={20} height={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Team Name */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${errors.name ? "text-red-400" : "text-zinc-400"}`}>
                  Team Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter team name"
                  {...register("name")}
                  className={getInputClass(!!errors.name)}
                />
                {errors.name && (
                  <p className="text-red-400 text-[10px] mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Team Members */}
              <div>
                <label className="block text-xs font-medium mb-1 text-zinc-400">
                  Add Team Members (Optional)
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                      className={getInputClass()}
                    />
                    <button
                      type="button"
                      onClick={handleAddEmail}
                      className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium transition"
                    >
                      Add
                    </button>
                  </div>

                  {/* Added Emails */}
                  {watchedEmails.length > 0 && (
                    <div className="space-y-2">
                      {watchedEmails.map((email) => (
                        <div
                          key={email}
                          className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2"
                        >
                          <span className="text-sm text-zinc-300">{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            className="text-zinc-500 hover:text-red-400 transition"
                          >
                            <Xmark width={16} height={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={createTeamMutation.isPending}
                className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm text-zinc-900 font-semibold hover:bg-white transition disabled:opacity-70 mt-6"
              >
                {createTeamMutation.isPending ? "Creating..." : "Create Team"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {selectedTeamId && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            ref={detailsModalRef}
            className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-h-96 overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">{selectedTeam.team_name}</h2>
                <p className="text-xs text-zinc-400">Team ID: {selectedTeam.id}</p>
              </div>
              <button
                onClick={() => setSelectedTeamId(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <Xmark width={20} height={20} />
              </button>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-800 rounded-lg p-3">
                <p className="text-xs text-zinc-400 mb-1">Members</p>
                <p className="text-lg font-semibold">{selectedTeam.member_count}</p>
              </div>
              {selectedTeam.event_name && (
                <div className="bg-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 mb-1">Event</p>
                  <p className="text-sm font-semibold truncate">{selectedTeam.event_name}</p>
                </div>
              )}
            </div>

            {/* Add Member Section */}
            <div className="mb-6 pb-6 border-b border-zinc-800">
              <h3 className="text-sm font-semibold mb-3 text-zinc-100">Add Team Member</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter member email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(),
                    addMemberMutation.mutate({ teamId: selectedTeamId, email: emailInput }))
                  }
                  className={getInputClass()}
                />
                <button
                  type="button"
                  onClick={() =>
                    addMemberMutation.mutate({ teamId: selectedTeamId, email: emailInput })
                  }
                  disabled={addMemberMutation.isPending || !emailInput.trim()}
                  className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 font-medium hover:bg-white transition disabled:opacity-70"
                >
                  <Plus width={18} height={18} />
                </button>
              </div>
            </div>

            {/* Pending Invitations */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock width={16} height={16} />
                Pending Invitations ({pendingInvites.length})
              </h3>
              {pendingInvites.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No pending invitations</p>
              ) : (
                <div className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.invitation_id}
                      className="flex items-center justify-between bg-zinc-800 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Mail width={16} height={16} className="text-zinc-500" />
                        <div className="min-w-0">
                          <p className="text-sm text-zinc-100 truncate">
                            {invite.invitee_first_name} {invite.invitee_last_name}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {invite.invitee_email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Clock width={14} height={14} />
                          Pending
                        </span>
                        <button
                          onClick={() =>
                            removePendingInviteMutation.mutate(invite.invitation_id)
                          }
                          disabled={removePendingInviteMutation.isPending}
                          className="text-zinc-500 hover:text-red-400 transition"
                        >
                          <Trash width={16} height={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Team Button */}
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to delete this team? This action cannot be undone."
                  )
                ) {
                  deleteTeamMutation.mutate(selectedTeamId);
                }
              }}
              disabled={deleteTeamMutation.isPending}
              className="w-full mt-6 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2.5 text-sm text-white font-semibold transition disabled:opacity-70"
            >
              {deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;