import { useNavigate } from "react-router-dom";
import { FolderKanban, Users, Loader2, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useProjects, useDeleteProject } from "../hooks/useProjects";
import { useAuth } from "../context/AuthContext";

const avatarColors = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const navigate = useNavigate();
  const { user } = useAuth();

  const capitalize = (str) => {
   return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
};

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome {capitalize(user?.name)}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's an overview of your projects
        </p>
      </div>

      {/* Stats */}
      {!isLoading && projects && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Projects",
              value: projects.length,
              icon: FolderKanban,
              color: "text-blue-600 bg-blue-50",
            },
            {
              label: "Total Members",
              value: projects.reduce((acc, p) => acc + p.members.length + 1, 0),
              icon: Users,
              color: "text-violet-600 bg-violet-50",
            },
            {
              label: "Active Lists",
              value: projects.reduce((acc, p) => acc + p.lists.length, 0),
              icon: Clock,
              color: "text-emerald-600 bg-emerald-50",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}
              >
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">All Projects</h2>
        <span className="text-xs text-gray-400">
          {projects?.length ?? 0} projects
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-blue-600" size={28} />
        </div>
      ) : !projects?.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={24} className="text-gray-300" />
          </div>
          <p className="font-medium text-gray-500">No projects yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Click the + button in the sidebar to create one
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const members = [p.owner, ...p.members.map((m) => m.user)];
            return (
              <div
                key={p._id}
                className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-blue-100 transition-all group cursor-pointer relative"
                onClick={() => navigate(`/project/${p._id}`)}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject.mutate(p._id, {
                      onSuccess: () => toast.success("Project archived"),
                    });
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>

                {/* Project icon */}
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition">
                  <FolderKanban size={18} className="text-blue-600" />
                </div>

                <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition pr-6 truncate">
                  {p.name}
                </h2>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2 leading-relaxed min-h-[40px]">
                  {p.description || "No description provided"}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                  <div className="flex -space-x-1.5">
                    {members.slice(0, 4).map((m, i) => (
                      <div
                        key={m._id}
                        title={m.name}
                        className={`w-6 h-6 rounded-full ${avatarColors[i % avatarColors.length]} text-white text-[10px] flex items-center justify-center border-2 border-white font-semibold`}
                      >
                        {m.name[0].toUpperCase()}
                      </div>
                    ))}
                    {members.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-[10px] flex items-center justify-center border-2 border-white">
                        +{members.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-auto text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FolderKanban size={11} /> {p.lists.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {members.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
