import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Plus, Clock, Calendar, Trash2, Timer, Route, Pencil, Activity, X } from "lucide-react";
import ProgressionChart from "@/components/race-results/ProgressionChart";
import ActivityAnalysisDialog from "@/components/training-calendar/ActivityAnalysisDialog";
import { intervalsService, IntervalsActivity } from "@/services/intervalsService";
import { toast } from "sonner";
import { format, subDays, addDays } from "date-fns";
import { fr } from "date-fns/locale";

const RACE_TYPES = [
  { value: "running", label: "Course à pied" },
  { value: "triathlon", label: "Triathlon" },
];

const DISTANCES: Record<string, { value: string; label: string }[]> = {
  running: [
    { value: "5k", label: "5 km" },
    { value: "10k", label: "10 km" },
    { value: "semi", label: "Semi-marathon (21.1 km)" },
    { value: "marathon", label: "Marathon (42.2 km)" },
    { value: "trail_short", label: "Trail court (<30 km)" },
    { value: "trail_long", label: "Trail long (>30 km)" },
    { value: "ultra", label: "Ultra-trail" },
    { value: "other_run", label: "Autre" },
  ],
  triathlon: [
    { value: "super_sprint", label: "Super Sprint" },
    { value: "sprint", label: "Sprint" },
    { value: "olympic", label: "Olympique" },
    { value: "half_ironman", label: "Half Ironman" },
    { value: "ironman", label: "Ironman" },
    { value: "other_tri", label: "Autre" },
  ],
};

const formatTimeFromSeconds = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
  return `${m}m${String(s).padStart(2, "0")}s`;
};

const parseTimeToSeconds = (hours: string, minutes: string, secs: string) => {
  return (parseInt(hours || "0") * 3600) + (parseInt(minutes || "0") * 60) + parseInt(secs || "0");
};

const getDistanceLabel = (type: string, distance: string) => {
  const found = DISTANCES[type]?.find(d => d.value === distance);
  return found?.label || distance;
};

const getRaceTypeColor = (type: string) => {
  return type === "triathlon"
    ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
    : "bg-orange-500/15 text-orange-400 border-orange-500/30";
};

interface RaceResult {
  id: string;
  name: string;
  race_type: string;
  distance: string;
  official_time_seconds: number;
  activity_date: string;
  activity_id: string | null;
  activity_time_seconds: number | null;
  overall_rank: number | null;
  category_rank: number | null;
  notes: string | null;
  created_at: string;
}

export default function RaceResults() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDistance, setFilterDistance] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  // Form state
  const [raceType, setRaceType] = useState("running");
  const [distance, setDistance] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [activityHours, setActivityHours] = useState("");
  const [activityMinutes, setActivityMinutes] = useState("");
  const [activitySeconds, setActivitySeconds] = useState("");
  const [hasActivityTime, setHasActivityTime] = useState(false);
  const [overallRank, setOverallRank] = useState("");
  const [categoryRank, setCategoryRank] = useState("");
  const [notes, setNotes] = useState("");
  const [activityId, setActivityId] = useState("");
  const [activityCandidates, setActivityCandidates] = useState<IntervalsActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Analysis dialog state
  const [analysisActivity, setAnalysisActivity] = useState<IntervalsActivity | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setRaceType("running");
    setDistance("");
    setName("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setHours(""); setMinutes(""); setSeconds("");
    setActivityHours(""); setActivityMinutes(""); setActivitySeconds("");
    setHasActivityTime(false);
    setOverallRank("");
    setCategoryRank("");
    setNotes("");
    setActivityId("");
    setActivityCandidates([]);
  };
  };

  const populateForm = (r: RaceResult) => {
    setEditingId(r.id);
    setRaceType(r.race_type);
    setDistance(r.distance);
    setName(r.name);
    setDate(r.activity_date);
    const oh = Math.floor(r.official_time_seconds / 3600);
    const om = Math.floor((r.official_time_seconds % 3600) / 60);
    const os = r.official_time_seconds % 60;
    setHours(oh > 0 ? String(oh) : "");
    setMinutes(String(om));
    setSeconds(String(os));
    if (r.activity_time_seconds) {
      setHasActivityTime(true);
      const ah = Math.floor(r.activity_time_seconds / 3600);
      const am = Math.floor((r.activity_time_seconds % 3600) / 60);
      const as2 = r.activity_time_seconds % 60;
      setActivityHours(ah > 0 ? String(ah) : "");
      setActivityMinutes(String(am));
      setActivitySeconds(String(as2));
    } else {
      setHasActivityTime(false);
      setActivityHours(""); setActivityMinutes(""); setActivitySeconds("");
    }
    setOverallRank(r.overall_rank ? String(r.overall_rank) : "");
    setCategoryRank(r.category_rank ? String(r.category_rank) : "");
    setNotes(r.notes || "");
    setActivityId(r.activity_id || "");
    setOpen(true);
  };

  const searchActivities = async (raceDate: string) => {
    setLoadingActivities(true);
    try {
      const start = format(subDays(new Date(raceDate), 1), "yyyy-MM-dd");
      const end = format(addDays(new Date(raceDate), 1), "yyyy-MM-dd");
      const { activities } = await intervalsService.getActivities(start, end);
      setActivityCandidates(activities);
    } catch {
      setActivityCandidates([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const openAnalysis = async (aId: string) => {
    try {
      const raceResult = results.find(r => r.activity_id === aId);
      if (!raceResult) return;
      const start = format(subDays(new Date(raceResult.activity_date), 1), "yyyy-MM-dd");
      const end = format(addDays(new Date(raceResult.activity_date), 1), "yyyy-MM-dd");
      const { activities } = await intervalsService.getActivities(start, end);
      const found = activities.find(a => a.id === aId);
      if (found) {
        setAnalysisActivity(found);
        setIsAnalysisOpen(true);
      } else {
        toast.error("Séance introuvable dans Intervals.icu");
      }
    } catch {
      toast.error("Erreur de connexion à Intervals.icu");
    }
  };

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["race-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("race_results")
        .select("*")
        .order("activity_date", { ascending: false });
      if (error) throw error;
      return data as RaceResult[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (result: Omit<RaceResult, "id" | "created_at">) => {
      const { error } = await supabase.from("race_results").insert(result);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["race-results"] });
      toast.success("Résultat ajouté !");
      setOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...result }: Omit<RaceResult, "created_at">) => {
      const { error } = await supabase.from("race_results").update(result).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["race-results"] });
      toast.success("Résultat mis à jour !");
      setOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("race_results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["race-results"] });
      toast.success("Résultat supprimé");
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !distance) {
      toast.error("Veuillez remplir le nom et la distance");
      return;
    }
    const officialTime = parseTimeToSeconds(hours, minutes, seconds);
    if (officialTime <= 0) {
      toast.error("Veuillez saisir un temps valide");
      return;
    }

    const activityTime = hasActivityTime
      ? parseTimeToSeconds(activityHours, activityMinutes, activitySeconds)
      : null;

    const payload = {
      name: name.trim(),
      race_type: raceType,
      distance,
      official_time_seconds: officialTime,
      activity_date: date,
      activity_id: activityId.trim() || null,
      activity_time_seconds: activityTime && activityTime > 0 ? activityTime : null,
      overall_rank: overallRank ? parseInt(overallRank) : null,
      category_rank: categoryRank ? parseInt(categoryRank) : null,
      notes: notes.trim() || null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload } as any);
    } else {
      addMutation.mutate(payload);
    }
  };

  const allYears = [...new Set(results.map(r => new Date(r.activity_date).getFullYear()))].sort((a, b) => b - a);

  const filtered = results.filter(r => {
    if (filterType !== "all" && r.race_type !== filterType) return false;
    if (filterDistance !== "all" && r.distance !== filterDistance) return false;
    if (filterYear !== "all" && new Date(r.activity_date).getFullYear() !== parseInt(filterYear)) return false;
    return true;
  });

  // Group by distance for PR tracking
  const prByDistance = results.reduce((acc, r) => {
    const key = `${r.race_type}-${r.distance}`;
    if (!acc[key] || r.official_time_seconds < acc[key].official_time_seconds) {
      acc[key] = r;
    }
    return acc;
  }, {} as Record<string, RaceResult>);

  const allDistances = [...new Set(results.map(r => r.distance))];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Résultats de courses</h1>
            <p className="text-sm text-muted-foreground">Historique et suivi de vos performances en compétition</p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Ajouter un résultat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Modifier le résultat" : "Nouveau résultat de course"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Race type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de course</Label>
                  <Select value={raceType} onValueChange={(v) => { setRaceType(v); setDistance(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RACE_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Distance</Label>
                  <Select value={distance} onValueChange={setDistance}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      {DISTANCES[raceType]?.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Name & date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom de la course</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Marathon de Paris" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>

              {/* Official time */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5 text-primary" />
                  Temps officiel
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Input type="number" min="0" max="99" placeholder="HH" value={hours} onChange={e => setHours(e.target.value)} />
                    <span className="text-xs text-muted-foreground ml-1">heures</span>
                  </div>
                  <div>
                    <Input type="number" min="0" max="59" placeholder="MM" value={minutes} onChange={e => setMinutes(e.target.value)} />
                    <span className="text-xs text-muted-foreground ml-1">minutes</span>
                  </div>
                  <div>
                    <Input type="number" min="0" max="59" placeholder="SS" value={seconds} onChange={e => setSeconds(e.target.value)} />
                    <span className="text-xs text-muted-foreground ml-1">secondes</span>
                  </div>
                </div>
              </div>

              {/* Activity time toggle */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasActivityTime"
                    checked={hasActivityTime}
                    onChange={e => setHasActivityTime(e.target.checked)}
                    className="rounded border-input"
                  />
                  <Label htmlFor="hasActivityTime" className="flex items-center gap-2 cursor-pointer">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Temps de la séance (montre/GPS)
                  </Label>
                </div>
                {hasActivityTime && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Input type="number" min="0" max="99" placeholder="HH" value={activityHours} onChange={e => setActivityHours(e.target.value)} />
                      <span className="text-xs text-muted-foreground ml-1">heures</span>
                    </div>
                    <div>
                      <Input type="number" min="0" max="59" placeholder="MM" value={activityMinutes} onChange={e => setActivityMinutes(e.target.value)} />
                      <span className="text-xs text-muted-foreground ml-1">minutes</span>
                    </div>
                    <div>
                      <Input type="number" min="0" max="59" placeholder="SS" value={activitySeconds} onChange={e => setActivitySeconds(e.target.value)} />
                      <span className="text-xs text-muted-foreground ml-1">secondes</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rattacher une séance Intervals.icu */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  Séance Intervals.icu (optionnel)
                </Label>
                {activityId ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs gap-1 py-1">
                      <Activity className="h-3 w-3" />
                      {activityCandidates.find(a => a.id === activityId)?.name || activityId}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActivityId("")}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-2"
                      disabled={!date || loadingActivities}
                      onClick={() => searchActivities(date)}
                    >
                      {loadingActivities ? "Recherche..." : "Rechercher les séances autour de cette date"}
                    </Button>
                    {activityCandidates.length > 0 && (
                      <div className="space-y-1 max-h-[120px] overflow-y-auto">
                        {activityCandidates.map(a => (
                          <button
                            key={a.id}
                            type="button"
                            className="w-full text-left px-3 py-1.5 rounded-md text-xs hover:bg-accent transition-colors border border-border/50"
                            onClick={() => setActivityId(a.id)}
                          >
                            <span className="font-medium">{a.name}</span>
                            <span className="text-muted-foreground ml-2">
                              {format(new Date(a.start_date_local), "dd/MM HH:mm")}
                              {a.distance > 0 && ` · ${(a.distance / 1000).toFixed(1)}km`}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Classement */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Place générale (optionnel)</Label>
                  <Input type="number" min="1" placeholder="Ex: 42" value={overallRank} onChange={e => setOverallRank(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Place catégorie (optionnel)</Label>
                  <Input type="number" min="1" placeholder="Ex: 5" value={categoryRank} onChange={e => setCategoryRank(e.target.value)} />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Conditions, ressenti, objectif..." rows={2} />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={addMutation.isPending || updateMutation.isPending}>
                {editingId
                  ? (updateMutation.isPending ? "Mise à jour..." : "Mettre à jour")
                  : (addMutation.isPending ? "Ajout..." : "Ajouter")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* PR Cards */}
      {Object.keys(prByDistance).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Object.entries(prByDistance).map(([key, pr]) => (
            <Card key={key} className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground truncate">
                      {getDistanceLabel(pr.race_type, pr.distance)}
                    </span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getRaceTypeColor(pr.race_type)}`}>
                      {pr.race_type === "triathlon" ? "TRI" : "CAP"}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold tabular-nums">{formatTimeFromSeconds(pr.official_time_seconds)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Progression chart */}
      <ProgressionChart results={results} />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setFilterDistance("all"); }}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {RACE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDistance} onValueChange={setFilterDistance}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les distances</SelectItem>
            {(filterType === "all"
              ? allDistances
              : allDistances.filter(d => results.some(r => r.race_type === filterType && r.distance === d))
            ).map(d => (
              <SelectItem key={d} value={d}>
                {getDistanceLabel(filterType === "all" ? "running" : filterType, d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les années</SelectItem>
            {allYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Results table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            Historique ({filtered.length} résultat{filtered.length !== 1 ? "s" : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aucun résultat de course enregistré</p>
              <p className="text-sm mt-1">Cliquez sur "Ajouter un résultat" pour commencer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Course</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Distance</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                      <span className="flex items-center justify-end gap-1"><Timer className="h-3 w-3" /> Officiel</span>
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                      <span className="flex items-center justify-end gap-1"><Clock className="h-3 w-3" /> Séance</span>
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Place</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Cat.</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Écart</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const isPR = prByDistance[`${r.race_type}-${r.distance}`]?.id === r.id;
                    const diff = r.activity_time_seconds
                      ? r.activity_time_seconds - r.official_time_seconds
                      : null;

                    return (
                      <tr key={r.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 text-muted-foreground tabular-nums">
                          {format(new Date(r.activity_date), "dd MMM yyyy", { locale: fr })}
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          <div className="flex items-center gap-2">
                            {isPR && <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                            <span className="truncate max-w-[200px]">{r.name}</span>
                          </div>
                          {r.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px]">{r.notes}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className={`text-xs ${getRaceTypeColor(r.race_type)}`}>
                            {r.race_type === "triathlon" ? "Triathlon" : "Course à pied"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {getDistanceLabel(r.race_type, r.distance)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums">
                          {formatTimeFromSeconds(r.official_time_seconds)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground tabular-nums">
                          {r.activity_time_seconds
                            ? formatTimeFromSeconds(r.activity_time_seconds)
                            : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                          {r.overall_rank ? `${r.overall_rank}e` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                          {r.category_rank ? `${r.category_rank}e` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {diff !== null ? (
                            <span className={diff > 0 ? "text-orange-400" : "text-emerald-400"}>
                              {diff > 0 ? "+" : ""}{formatTimeFromSeconds(Math.abs(diff))}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => populateForm(r)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {r.activity_id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                onClick={() => openAnalysis(r.activity_id!)}
                              >
                                <Activity className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteMutation.mutate(r.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ActivityAnalysisDialog
        activity={analysisActivity}
        isOpen={isAnalysisOpen}
        onClose={() => { setIsAnalysisOpen(false); setAnalysisActivity(null); }}
      />
    </div>
  );
}
