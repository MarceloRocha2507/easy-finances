import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHANGELOG, type ChangeType } from "@/lib/version";
import { Sparkles } from "lucide-react";

const typeBadge: Record<ChangeType, { label: string; className: string }> = {
  feature: { label: "Novo", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" },
  fix: { label: "Correção", className: "bg-destructive/15 text-destructive border-destructive/20" },
  improvement: { label: "Melhoria", className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
};

export default function Changelog() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Novidades</h1>
            <p className="text-sm text-muted-foreground">Histórico de atualizações do sistema</p>
          </div>
        </div>

        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-6 bottom-6 w-px bg-border" />

          {CHANGELOG.map((entry, idx) => (
            <div key={entry.version} className="relative pl-10">
              {/* Timeline dot */}
              <div className={`absolute left-2 top-6 w-3 h-3 rounded-full border-2 ${idx === 0 ? "bg-primary border-primary" : "bg-muted border-border"}`} />

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">v{entry.version}</Badge>
                      {entry.title}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {entry.changes.map((change, i) => {
                    const badge = typeBadge[change.type];
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <Badge variant="outline" className={`text-[10px] mt-0.5 shrink-0 ${badge.className}`}>
                          {badge.label}
                        </Badge>
                        <span className="text-sm text-foreground">{change.description}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
