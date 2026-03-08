import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Flag, Plus, Calendar, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const RACE_TYPES = [
  { value: "running", label: "Course à pied" },
  { value: "triathlon", label: "Triathlon" },
];

const DISTANCES: Record<string, { value: string; label: string }[]> = {
  running: [
    { value: "5k", label: "5 km" },
    { value: "10k", label: "10 km" },
    { value: "semi", label: "Semi-marathon" },
    { value: "marathon", label: "Marathon" },
    { value: "trail_short", label: "Trail court" },
    { value: "trail_long", label: "Trail long" },
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

const PRIORITIES = [
  { value: "A", label: "Course A", description: "Objectif principal", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  { value: "B", label: "Course B", description: "Objectif secondaire", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  { value: "C", label: "Course C", description: "Préparation / entraînement", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
];

const getDistanceLabel = (type: string, distance: string) => {
  const found = DISTANCES[type]?.find(d => d.value === distance);
  return found?.label || distance;
};

const getPriorityStyle = (priority: string) => {
  return PRIORITIES.find(p => p.value === priority)?.color || PRIORITIES[1].color;
};

interface UpcomingRace {
  id: string;
  name: string;
  race_date: string;
  race_type: string;
  distance: string;
  priority: string;
  notes: string | null;
  created_at: string;
}

const UpcomingRaces = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [raceDate, setRaceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [raceType, setRaceType] = useState("running");
  const [distance, setDistance] = useState("");
  const [priority, setPriority] = useState("B");

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setRaceDate(format(new Date(), "yyyy-MM-dd"));
    setRaceType("running");
    setDistance("");
    setPriority("B");
  };

  const { data: races = [], isLoading } = useQuery({
    queryKey: ["upcoming-races"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("upcoming_races")
        .select("*")
        .gte("race_date", today)
        .order("race_date", { ascending: true });
      if (error) throw error;
      return data as UpcomingRace[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (race: Omit<UpcomingRace, "id" | "created_at">) => {
      const { error } = await supabase.from("upcoming_races").insert(race);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcoming-races"] });
      toast.success("Course ajoutée !");
      setOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...race }: Omit<UpcomingRace, "created_at">) => {
      const { error } = await supabase.from("upcoming_races").update(race).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcoming-races"] });
      toast.success("Course mise à jour !");
      setOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("upcoming_races").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcoming-races"] });
      toast.success("Course supprimée");
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !distance) {
      toast.error("Veuillez remplir le nom et la distance");
      return;
    }
    const payload = {
      name: name.trim(),
      race_date: raceDate,
      race_type: raceType,
      distance,
      priority,
      notes: null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload } as any);
    } else {
      addMutation.mutate(payload);
    }
  };

  const populateForm = (r: UpcomingRace) => {
    setEditingId(r.id);
    setName(r.name);
    setRaceDate(r.race_date);
    setRaceType(r.race_type);
    setDistance(r.distance);
    setPriority(r.priority);
    setOpen(true);
  };

  // Sort: priority A first, then B, then C, then by date
  const sortedRaces = [...races].sort((a, b) => {
    const priorityOrder: Record<string, number> = { A: 0, B: 1, C: 2 };
    const pa = priorityOrder[a.priority] ?? 1;
    const pb = priorityOrder[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return new Date(a.race_date).getTime() - new Date(b.race_date).getTime();
  });

  return (
    <Card className="glass-card opacity-0 animate-fade-in-up" style={{ animationDelay: '0.35s', animationFillMode: 'forwards' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            <span className="gradient-text">Courses à venir</span>
          </CardTitle>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? "Modifier la course" : "Nouvelle course à venir"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Nom de la course</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ironman Nice" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={raceDate} onChange={e => setRaceDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Priorité</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label} — {p.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
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
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-6 text-sm">Chargement...</p>
        ) : sortedRaces.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Flag className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune course planifiée</p>
            <p className="text-xs mt-1">Ajoutez vos prochains objectifs</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRaces.map(race => {
              const daysLeft = differenceInDays(parseISO(race.race_date), new Date());
              const isClose = daysLeft <= 14;
              const isVeryClose = daysLeft <= 7;

              return (
                <div
                  key={race.id}
                  className="group flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-border transition-all hover:bg-muted/20"
                >
                  {/* Countdown */}
                  <div className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 px-2 rounded-lg border ${
                    isVeryClose
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : isClose
                      ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                      : "bg-primary/10 border-primary/30 text-primary"
                  }`}>
                    <span className="text-xl font-black tabular-nums leading-none">
                      {daysLeft < 0 ? "—" : daysLeft}
                    </span>
                    <span className="text-[10px] font-medium opacity-80">
                      {daysLeft === 1 ? "jour" : "jours"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{race.name}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${getPriorityStyle(race.priority)}`}>
                        {race.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(parseISO(race.race_date), "EEEE d MMMM yyyy", { locale: fr })}</span>
                      <span className="opacity-50">·</span>
                      <span>{getDistanceLabel(race.race_type, race.distance)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => populateForm(race)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(race.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingRaces;
